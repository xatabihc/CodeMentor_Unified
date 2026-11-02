"""Export original CodeMentor 1.6 course records; never ship hidden reference solutions."""
import sys, json, pathlib
root=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'curriculum_source'))
from codementor.content import ALL
from codementor.checking import capability
fields=('id','track','module','title','intro','theory','example','task','starter','cases','hints','answers','source_url','stage','level','checkpoint','learning','curriculumLevel','prerequisites','source_note')
items=[{'checking':capability(x), **{k:v for k,v in x.items() if k in fields}, **({'sql_expected':x['solution']} if x.get('track')=='sql' else {})} for x in ALL]
baseline=json.loads((root/'curriculum_source/compatibility/2.0.1-lesson-ids.json').read_text())
baseline.update(json.loads((root/'curriculum_source/compatibility/2.1-lesson-ids.json').read_text()))
assert len(items)==len({x['id'] for x in items})
assert all(any(x['id']==ident and x['track']==track for x in items) for ident,track in baseline.items())
out=root/'www'/'lessons.js'
out.write_text('window.CODEMENTOR_LESSONS = '+json.dumps(items,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('Exported',len(items),'lessons to',out)
# Original mathematics material uses the shared exercise schema; legacy catalog stays intact.
platform=json.loads((root/'curriculum_source/platform.json').read_text())
assert not ({x['id'] for x in platform}&{x['id'] for x in items})
assert len(platform)==len({x['id'] for x in platform})
(root/'www/math-lessons.js').write_text('window.CODEMENTOR_MATH_LESSONS = '+json.dumps(platform,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('Exported',len(platform),'mathematics lessons')
