"""Exercise the actual SQLite 1.x -> portable JSON -> current importer path."""
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
root=Path(__file__).resolve().parents[1]
test_tmp=root/'.test-tmp'
test_tmp.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='codementor-legacy-',dir=test_tmp) as directory:
    database=Path(directory)/'progress.sqlite3'
    output=Path(directory)/'progress.json'
    with sqlite3.connect(database) as connection:
        connection.execute('CREATE TABLE lessons(id TEXT,draft TEXT,completed INTEGER,attempts INTEGER,hint_level INTEGER,completed_at TEXT)')
        connection.executemany('INSERT INTO lessons VALUES(?,?,?,?,?,?)',[
            ('py01','print("Привет")',1,3,1,'2025-01-01'),
            ('path01','',0,0,0,None),
            ('cloud221','print(221)',1,1,0,None)])
    subprocess.run([sys.executable,str(root/'tools/export_old_progress.py'),str(database),'-o',str(output)],check=True)
    payload=json.loads(output.read_text())
    assert payload['format']=='codementor-progress' and payload['version']==1
    subprocess.run(['node','-e',
        "require('./www/progress.js');const fs=require('fs'),assert=require('assert');const x=CodeMentorProgress.merge({},JSON.parse(fs.readFileSync(0,'utf8')));assert.equal(x.py01.completed,1);assert.equal(x.path01.draft,'');assert.equal(x.cloud221.completed,1);console.log('PASS actual legacy SQLite export imported with original IDs');"],
        input=json.dumps(payload),text=True,cwd=root,check=True)
