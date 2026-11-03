"""Back up this application's data before a non-destructive APK update."""
from pathlib import Path
import subprocess,datetime,json,hashlib,tarfile,io,xml.etree.ElementTree as ET
adb='/home/xatabihc/Android/Sdk/platform-tools/adb'; package='com.codementor.offline'
def run(*args):return subprocess.check_output([adb,*args],timeout=40)
model=run('shell','getprop','ro.product.model').decode().strip()
run('shell','am','force-stop',package)
data=run('exec-out','run-as',package,'tar','-cf','-','shared_prefs','app_webview')
folder=Path('backups')/('samsung-before-scroll-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'));folder.mkdir(parents=True)
(folder/'app-data.tar').write_bytes(data)
with tarfile.open(fileobj=io.BytesIO(data)) as archive:
 raw=archive.extractfile('shared_prefs/codementor.xml').read()
 root=ET.fromstring(raw);progress=next((e.text for e in root if e.attrib.get('name')=='progress'),None)
 if progress:
  records=json.loads(progress)['records'];(folder/'progress.json').write_text(progress)
 else:records={}
(folder/'metadata.json').write_text(json.dumps({'model':model,'sha256':hashlib.sha256(data).hexdigest(),'records':len(records)},indent=2))
print('Backup:',folder,'; records:',len(records),'; model:',model)
