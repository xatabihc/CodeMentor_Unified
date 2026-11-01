#!/usr/bin/env python3
"""Export progress.sqlite3 from CodeMentor 1.x to portable JSON, no dependencies."""
from pathlib import Path
import argparse,json,sqlite3,datetime
parser=argparse.ArgumentParser(description='Экспорт прогресса CodeMentor 1.0–1.6')
parser.add_argument('database',nargs='?',default=str(Path.home()/'.local/share/codementor/progress.sqlite3'))
parser.add_argument('-o','--output',default='codementor-old-progress.json')
a=parser.parse_args()
if not Path(a.database).is_file():parser.error('База не найдена: '+a.database)
with sqlite3.connect(f'file:{Path(a.database).resolve()}?mode=ro',uri=True) as conn:
    rows=conn.execute('SELECT id,draft,completed,attempts,hint_level,completed_at FROM lessons').fetchall()
records=[dict(zip(('id','draft','completed','attempts','hint_level','completed_at'),r)) for r in rows]
payload={'format':'codementor-progress','version':1,'exported_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'lessons':records}
Path(a.output).write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Экспортировано {len(records)} записей: {a.output}')
