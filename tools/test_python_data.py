"""Run only trusted developer-written original solutions; never user input code."""
import sys,json,subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'curriculum_source'))
from codementor.content_data import DATA_PYTHON
if '--references' in sys.argv:
 print(json.dumps({l['id']:[l['solution'],*l['alternative_solutions']] for l in DATA_PYTHON}));sys.exit()
count=0
for l in DATA_PYTHON:
 assert all(l['learning'].get(k) for k in ['walkthrough','first','medium','independent','errors','review','checkpoint'])
 for solution in [l['solution'],*l['alternative_solutions']]:
  for c in l['cases']:
   r=subprocess.run([sys.executable,'-I','-c',solution],input='\n'.join(c['stdin'])+'\n',text=True,capture_output=True,timeout=3)
   assert r.returncode==0 and r.stdout.rstrip()==c['stdout'].rstrip(),(l['id'],r.stdout,r.stderr)
   count+=1
print('PASS D1 trusted CPython: 6 original lessons,',count,'canonical/alternative cases')
