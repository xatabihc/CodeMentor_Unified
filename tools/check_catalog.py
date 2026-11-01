"""Check lossless catalog export and identical Android assets."""
import json
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'curriculum_source'))
from codementor.content import ALL
items=json.loads((root/'www/lessons.js').read_text().split(' = ',1)[1].rstrip(';\n'))
assert len(items)==len(ALL)==len({x['id'] for x in items})
assert [x['id'] for x in items]==[x['id'] for x in ALL]
assert all('solution' not in x for x in items)
baseline=json.loads((root/'curriculum_source/compatibility/2.0.1-lesson-ids.json').read_text())
by_id={x['id']:x for x in items}
assert all(by_id[ident]['track']==track for ident,track in baseline.items())
assert [x['id'] for x in items if x['id'] in baseline]==list(baseline)
assert all(x.get('checking',{}).get('mode') in {'python-subset','text','unavailable'} for x in items)
assert all(x['checking']['mode']!='text' or x['track'] in {'linux','sql'} for x in items)
for item in items:
    if item['id'].startswith('path') and item['id'] not in baseline:
        assert all(item.get(field) for field in ('intro','theory','example','task','starter','cases','hints'))
        assert all(item['learning'].get(field) for field in ('walkthrough','first','medium','independent','errors','review','checkpoint'))

assets=root/'android-studio/app/src/main/assets'
web=root/'www'
assert {p.relative_to(web) for p in web.rglob('*') if p.is_file()}=={p.relative_to(assets) for p in assets.rglob('*') if p.is_file()}
for p in web.rglob('*'):
    if p.is_file(): assert p.read_bytes()==(assets/p.relative_to(web)).read_bytes(),p
print(f'PASS {len(items)} unique lesson IDs; no Python reference solutions shipped; Android assets identical')
