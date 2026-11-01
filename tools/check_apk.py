"""Verify a real APK contains exactly the current shared educational frontend.

This checks packaging, not Android execution, signing or Python isolation.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def verify_assets(archive, web=ROOT / 'www'):
    expected = {p.relative_to(web).as_posix(): p for p in web.rglob('*') if p.is_file()}
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise ValueError('Duplicate ZIP entries')
    packaged = {name.removeprefix('assets/') for name in names if name.startswith('assets/') and not name.endswith('/')}
    if packaged != set(expected):
        raise ValueError(f'Assets differ: missing={set(expected)-packaged}, stale={packaged-set(expected)}')
    for name, path in expected.items():
        if archive.read('assets/' + name) != path.read_bytes():
            raise ValueError('Stale or modified packaged asset: ' + name)
    source = archive.read('assets/lessons.js').decode('utf-8')
    lessons = json.loads(source.split(' = ', 1)[1].rstrip(';\n'))
    if len(lessons) != len({item['id'] for item in lessons}):
        raise ValueError('Duplicate lesson IDs')
    return lessons


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path)
    args = parser.parse_args()
    with zipfile.ZipFile(args.apk) as archive:
        if not archive.read('AndroidManifest.xml'):
            raise ValueError('Missing Android manifest')
        if not archive.read('classes.dex').startswith(b'dex\n'):
            raise ValueError('Missing Android DEX')
        if 'resources.arsc' in archive.namelist() and archive.getinfo('resources.arsc').compress_type != zipfile.ZIP_STORED:
            raise ValueError('Android 11+: resources.arsc must be uncompressed and aligned')
        for name in archive.namelist():
            if name.endswith('.dex') and not archive.read(name).startswith(b'dex\n'):
                raise ValueError('Invalid DEX: '+name)
        lessons = verify_assets(archive)
        if any('solution' in lesson for lesson in lessons):
            raise ValueError('Python reference solution leaked into catalog')
        python_files = [name for name in archive.namelist() if name.endswith(('.py', '.pyc', '.so'))]
    print(f'PASS APK assets: {len(lessons)} lessons, {sum(x["track"]=="path" for x in lessons)} path lessons')
    print('Bundled Python checker: worker.js (JavaScript subset; CPython is not bundled).')
    print('Python/native files:', ', '.join(python_files) or 'none')
    print('SHA256:', hashlib.sha256(args.apk.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
