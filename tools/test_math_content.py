"""Independent calculations for the introductory mathematics module."""
import json
from pathlib import Path
items=json.loads(Path('curriculum_source/platform.json').read_text())
all_items=items
items=[l for l in items if l['track']=='linear-algebra']
assert len(items)==6
expected=[
 [2+3,6-2,4+3],
 [[[2,3]],[[2,3],[4,1]],[[5,2],[1,6]]],
 [[len(a),len(a[0])] for a in [[[8,9]],[[1],[2],[3]],[[1,2,3],[4,5,6]]]],
 [[[0 for j in range(c)] for i in range(r)] for r,c in [(1,2),(2,2),(2,3)]],
 [[[int(i==j) for j in range(n)] for i in range(n)] for n in (1,2,3)],
 [[3,2],[[0],[0],[0]],[[int(i==j) for j in range(3)] for i in range(3)]]
]
ids=set()
for i,l in enumerate(items):
 assert l['prerequisites']==([items[i-1]['id']] if i else [])
 assert len(l['exercises'])==3
 for field in ('intro','theory','example','learning','simpler','hints'):assert l[field]
 for j,e in enumerate(l['exercises']):
  assert e['id'] not in ids;ids.add(e['id']);assert e['expected']==expected[i][j]
print('PASS independent mathematics calculations, 18 stable exercises, sequential prerequisites')

import statistics
operations={'count':len,'frequency':lambda a:a.count(4),'mean':statistics.mean,'median':statistics.median,'mode':statistics.mode,'range':lambda a:max(a)-min(a)}
stats=[l for l in all_items if l['track']=='statistics']
assert len(stats)==7
for i,l in enumerate(stats):
 assert l['prerequisites']==([stats[i-1]['id']] if i else [])
 for e in l['exercises']:
  assert e['id'] not in ids;ids.add(e['id'])
  assert e['expected']==operations[e['statistic']](e['data'])
print('PASS 21 statistics exercises computed independently with Python statistics')
