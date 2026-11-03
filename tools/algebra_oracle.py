"""Independent rational/permutation oracles; no JS implementation is reused."""
import json,itertools,math
from fractions import Fraction as F
from pathlib import Path
lessons=[l for l in json.loads(Path('curriculum_source/platform.json').read_text()) if l['id'].startswith('la-b2-')]
def product(a,b):return [[sum(x*y for x,y in zip(row,col)) for col in zip(*b)] for row in a]
def determinant(a):
 return sum((-1)**sum(p[i]>p[j] for i in range(len(a)) for j in range(i+1,len(a)))*math.prod(a[i][p[i]] for i in range(len(a))) for p in itertools.permutations(range(len(a))))
def rref(a):
 a=[[F(v) for v in r] for r in a];row=0
 for col in range(len(a[0])):
  pivot=next((i for i in range(row,len(a)) if a[i][col]),None)
  if pivot is None:continue
  a[pivot],a[row]=a[row],a[pivot];factor=a[row][col];a[row]=[v/factor for v in a[row]]
  for i in range(len(a)):
   if i!=row:
    k=a[i][col];a[i]=[v-k*w for v,w in zip(a[i],a[row])]
  row+=1
  if row==len(a):break
 return [[float(v) for v in r] for r in a],row
oracles={}
for l in lessons:
 assert len(l['exercises'])==3
 for e in l['exercises']:
  spec=e.get('operation',{});kind=spec.get('kind');a=spec.get('a');b=spec.get('b');expected=e['expected']
  if kind in ('add','subtract'):
   assert expected==[[x+(1 if kind=='add' else -1)*y for x,y in zip(r,s)] for r,s in zip(a,b)]
  elif kind=='transpose':assert expected==list(map(list,zip(*a)))
  elif kind=='multiply':assert expected==product(a,b)
  elif kind=='det':assert expected==determinant(a)
  elif kind=='inverse':assert product(a,expected)==[[int(i==j) for j in range(len(a))] for i in range(len(a))]
  elif e['type']=='row-reduction':assert expected==rref(e['initial'])[0]
  elif kind=='rank':assert expected==rref(a)[1]
  elif kind=='independence':assert expected==int(rref(a)[1]==len(a[0]))
  elif kind=='basis':assert rref(expected)[1]==len(expected[0])==rref(a)[1] and rref([r+s for r,s in zip(a,expected)])[1]==rref(a)[1]
  elif kind=='system':assert [r[-1] for r in a]==[r[0] for r in product([r[:-1] for r in a],[[v] for v in expected])]
  elif kind=='eigenvalue':
   assert determinant([[v-(expected if i==j else 0) for j,v in enumerate(row)] for i,row in enumerate(a)])==0
   trace=a[0][0]+a[1][1];largest=(trace+math.sqrt(trace*trace-4*determinant(a)))/2;assert expected==largest
  elif kind=='eigenvector':assert product(a,[[v] for v in expected])==[[e['eigenvalue']*v] for v in expected]
  elif e['type']=='vector':
   # Independently specified coordinate/linear-combination answers.
   witnesses={'la-b2-16:e1':[2,1],'la-b2-16:e2':[3,3],'la-b2-16:e3':[2,0],
              'la-b2-17:e1':[1,1],'la-b2-17:e2':[5,4],'la-b2-17:e3':[0,-5]}
   assert expected==witnesses[e['id']],e['id']
  else:raise AssertionError((l['id'],e['id'],kind))
  oracles[e['id']]={'expected':expected,**({'rref':rref(e['initial'])[0]} if e['type']=='row-reduction' else {})}
assert len(lessons)==21 and len(oracles)==63
print(json.dumps(oracles))
