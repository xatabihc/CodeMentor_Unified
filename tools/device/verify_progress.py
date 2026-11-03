"""Compare private progress with a local pre-update backup, without printing content."""
import sys,json,subprocess,xml.etree.ElementTree as ET
from pathlib import Path
baseline=Path(sys.argv[1]) if len(sys.argv)>1 else sorted(Path('backups').glob('samsung-before-scroll-*/progress.json'))[-1]
before=json.loads(baseline.read_text())['records']
raw=subprocess.check_output(['/home/xatabihc/Android/Sdk/platform-tools/adb','exec-out','run-as','com.codementor.offline','cat','shared_prefs/codementor.xml'],timeout=20)
root=ET.fromstring(raw);after=json.loads(next(e.text for e in root if e.attrib.get('name')=='progress'))['records']
for ident,record in before.items():
 assert ident in after,('Lost ID',ident)
 for key in ['completed','attempts','hint_level','completed_at']:
  assert record.get(key)==after[ident].get(key),(ident,key)
 if record.get('draft') is not None:assert record['draft']==after[ident]['draft'],('Draft changed',ident)
print('PASS',len(before),'pre-update records: IDs, completion, attempts, hints, dates and drafts preserved')
