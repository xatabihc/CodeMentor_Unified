"""Narrow offline incremental build for this navigation fix, without Gradle.

Rebuilds ALL current app Java and the manifest/assets. Preserves byte-for-byte
external-library DEX, R DEX, resources and other files from a verified baseline.
Requires the unchanged source manifest/dependency versions and the baseline's
cached Gradle DEX outputs. It is not a clean Gradle build or an Android UI test.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT=Path(__file__).resolve().parents[1]
ANDROID='{http://schemas.android.com/apk/res/android}'
ET.register_namespace('android',ANDROID[1:-1])


def run(args, **kwargs):
    return subprocess.run(list(map(str,args)),cwd=ROOT,check=True,**kwargs)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline',type=Path,required=True,help='Navigation backup directory with SHA256.json')
    args=parser.parse_args()
    backup=args.baseline.resolve()
    if not backup.is_relative_to(ROOT/'backups'):
        raise ValueError('Use the preserved baseline inside project backups/')
    hashes=json.loads((backup/'SHA256.json').read_text())
    manifest_name='android-studio/app/src/main/AndroidManifest.xml'
    apk_name='android-studio/app/build/outputs/apk/debug/app-debug.apk'
    base=backup/apk_name
    for name in (apk_name,manifest_name):
        if hashlib.sha256((backup/name).read_bytes()).hexdigest()!=hashes[name]:
            raise ValueError('Baseline backup changed: '+name)
    if (ROOT/manifest_name).read_bytes()!=(backup/manifest_name).read_bytes():
        raise ValueError('Source manifest changed: use a full Gradle manifest merge instead')
    baseline_gradle=(backup/'android-studio/app/build.gradle').read_text()
    gradle=(ROOT/'android-studio/app/build.gradle').read_text()
    baseline_deps=re.search(r'dependencies\s*\{([^}]+)\}',baseline_gradle).group(1)
    if re.search(r'dependencies\s*\{([^}]+)\}',gradle).group(1)!=baseline_deps:
        raise ValueError('Dependencies changed: a clean Gradle build is required')
    version=int(re.search(r'versionCode\s+(\d+)',gradle).group(1))
    version_name=re.search(r"versionName\s+'([^']+)'",gradle).group(1)
    if re.search(r'compileSdk\s+(\d+)',gradle).group(1)!='35':
        raise ValueError('Expected the unchanged SDK 35 configuration')
    if re.search(r'minSdk\s+(\d+)',gradle).group(1)!='26' or re.search(r'targetSdk\s+(\d+)',gradle).group(1)!='35':
        raise ValueError('SDK targets changed: use a full Gradle build')
    if any(path.is_file() for path in (ROOT/'android-studio/app/src/main/res').rglob('*')):
        raise ValueError('Native app resources exist: use a full Gradle resource build')
    sdk=Path(os.environ.get('ANDROID_HOME',str(Path.home()/'Android/Sdk')))
    tools=sdk/'build-tools/35.0.0';android=sdk/'platforms/android-35/android.jar'
    work=ROOT/'android-studio/app/build/navigation-sdk'
    # Refuse stale compiler outputs; each run gets its own new directory.
    import tempfile
    work.mkdir(parents=True,exist_ok=True)
    directory=Path(tempfile.mkdtemp(prefix='run-',dir=work))
    env={**os.environ,'TMPDIR':str(directory)}
    with zipfile.ZipFile(base) as original:
        external=ROOT/'android-studio/app/build/intermediates/dex/debug/mergeExtDexDebug/classes.dex'
        resource_dex=ROOT/'android-studio/app/build/intermediates/dex/debug/mergeProjectDexDebug/0/classes.dex'
        if original.read('classes.dex')!=external.read_bytes() or original.read('classes2.dex')!=resource_dex.read_bytes():
            raise ValueError('Cached library/R DEX is not identical to the baseline APK')
        old_app=directory/'old-app.dex';old_app.write_bytes(original.read('classes3.dex'))
        descriptions=run([tools/'dexdump',old_app],text=True,capture_output=True).stdout
        descriptors=re.findall(r"Class descriptor\s*:\s*'([^']+)'",descriptions)
        if not descriptors or any(name!='Lcom/codementor/offline/MainActivity;' and not name.startswith('Lcom/codementor/offline/MainActivity$') for name in descriptors):
            raise ValueError('Baseline app DEX contains additional code; do not replace it incrementally')
        files={name:original.read(name) for name in original.namelist() if not name.endswith('/')}
    cache=Path.home()/'.gradle/caches/modules-2/files-2.1'
    webkit=next((cache/'androidx.webkit/webkit/1.12.1').rglob('*.aar'))
    webkit_jar=directory/'webkit.jar'
    with zipfile.ZipFile(webkit) as archive:webkit_jar.write_bytes(archive.read('classes.jar'))
    annotations=next((cache/'androidx.annotation/annotation-jvm/1.8.1').rglob('*.jar'))
    classes=directory/'classes';classes.mkdir()
    java_sources=sorted((ROOT/'android-studio/app/src/main/java').rglob('*.java'))
    run(['javac','-source','17','-target','17','-classpath',os.pathsep.join(map(str,[android,webkit_jar,annotations])),
        '-d',classes,*java_sources],env=env)
    app_jar=directory/'app.jar'
    with zipfile.ZipFile(app_jar,'w') as archive:
        for path in classes.rglob('*.class'):archive.write(path,path.relative_to(classes).as_posix())
    dex=directory/'dex';dex.mkdir()
    run([tools/'d8','--debug','--min-api','26','--lib',android,'--classpath',webkit_jar,'--output',dex,app_jar],env=env)
    if sorted(p.name for p in dex.glob('*.dex'))!=['classes.dex']:
        raise ValueError('Unexpected app multidex output')
    tree=ET.parse(ROOT/manifest_name);manifest=tree.getroot();manifest.set('package','com.codementor.offline')
    app=manifest.find('application')
    app.set(ANDROID+'appComponentFactory','androidx.core.app.CoreComponentFactory')
    app.set(ANDROID+'extractNativeLibs','false')
    text_manifest=directory/'AndroidManifest.xml';tree.write(text_manifest,encoding='utf-8',xml_declaration=True)
    linked=directory/'manifest.ap_'
    run([tools/'aapt2','link','-o',linked,'-I',android,'--manifest',text_manifest,
        '--min-sdk-version','26','--target-sdk-version','35','--version-code',str(version),
        '--version-name',version_name,'--debug-mode'],env=env)
    with zipfile.ZipFile(linked) as archive:files['AndroidManifest.xml']=archive.read('AndroidManifest.xml')
    files['classes3.dex']=(dex/'classes.dex').read_bytes()
    web=ROOT/'www'
    assets={'assets/'+p.relative_to(web).as_posix():p.read_bytes() for p in web.rglob('*') if p.is_file()}
    unknown={name for name in files if name.startswith('assets/')}-set(assets)
    if unknown:raise ValueError('Unknown baseline assets would be lost: '+str(unknown))
    files.update(assets)
    unsigned=directory/'unsigned.apk'
    with zipfile.ZipFile(unsigned,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for name,data in files.items():
            if name.startswith('META-INF/') and (name.endswith(('.SF','.RSA','.DSA','.EC')) or name=='META-INF/MANIFEST.MF'):
                continue
            archive.writestr(name,data,compress_type=zipfile.ZIP_STORED if name=='resources.arsc' or name.endswith(('.dex','.so')) else zipfile.ZIP_DEFLATED)
    aligned=directory/'aligned.apk';run([tools/'zipalign','-f','-P','16','4',unsigned,aligned],env=env)
    # Read the existing debug key. Never generate or replace a key outside the project.
    key=Path.home()/'.android/debug.keystore'
    output=ROOT/'android-studio/app/build/outputs/apk/debug/app-debug-navigation.apk'
    run([tools/'apksigner','sign','--ks',key,'--ks-key-alias','androiddebugkey',
        '--ks-pass','pass:android','--key-pass','pass:android','--out',output,aligned],env=env)
    def certificate(path):
        result=run([tools/'apksigner','verify','--print-certs',path],text=True,capture_output=True,env=env)
        return re.search(r'certificate SHA-256 digest: (\w+)',result.stdout).group(1)
    if certificate(base)!=certificate(output):raise ValueError('Signing certificate changed; update would fail')
    run([tools/'zipalign','-c','-P','16','4',output],env=env)
    run([sys.executable,ROOT/'tools/check_apk.py',output],env=env)
    with zipfile.ZipFile(output) as built:
        for name in ('classes.dex','classes2.dex','resources.arsc'):
            if built.read(name)!=files[name]:raise ValueError('Preserved baseline content changed: '+name)
    badge=run([tools/'aapt','dump','badging',output],text=True,capture_output=True,env=env).stdout
    if f"versionCode='{version}'" not in badge or "package: name='com.codementor.offline'" not in badge:
        raise ValueError('APK package/version verification failed')
    report={'method':'offline incremental SDK build; NOT assembleDebug',
        'baseline_apk_sha256':hashlib.sha256(base.read_bytes()).hexdigest(),
        'apk_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
        'versionCode':version,'versionName':version_name,'certificate_sha256':certificate(output),
        'sources':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in java_sources},
        'assets':{name:hashlib.sha256(data).hexdigest() for name,data in assets.items()},
        'preserved':{name:hashlib.sha256(files[name]).hexdigest() for name in ('classes.dex','classes2.dex','resources.arsc')},
        'device_tested':False}
    output.with_suffix('.build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    output.with_suffix('.apk.sha256').write_text(report['apk_sha256']+'  '+output.name+'\n')
    print('PASS signed incremental debug APK:',output)
    print('Signing certificate matches the preserved 2.0.1 APK. No Android device test performed.')


if __name__=='__main__':main()
