"""Validate trusted course references using CPython, never user submissions.

A temporary working directory is test hygiene, not security isolation.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'curriculum_source'))
from codementor.content import ALL
test_tmp=Path(__file__).resolve().parents[1]/'.test-tmp'
test_tmp.mkdir(exist_ok=True)
checked = 0
failures = []
for lesson in ALL:
    if not lesson.get('cases'):
        continue
    for number, case in enumerate(lesson['cases'], 1):
        with tempfile.TemporaryDirectory(prefix='codementor-reference-',dir=test_tmp) as directory:
            root = Path(directory)
            for name, content in case.get('files', {}).items():
                target = root / name
                assert target.resolve().is_relative_to(root)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content, encoding='utf-8')
            result = subprocess.run([sys.executable, '-I', '-c', lesson['solution']],
                input='\n'.join(map(str, case.get('stdin', [])))+'\n',
                text=True, capture_output=True, cwd=root, timeout=3,
                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
            expected = str(case.get('stdout', '')).rstrip('\n')
            errors = []
            if result.returncode or result.stdout.rstrip('\n') != expected:
                errors.append(f'expected={expected!r} actual={result.stdout!r} stderr={result.stderr!r}')
            for name, content in case.get('expected_files', {}).items():
                target = root / name
                assert target.resolve().is_relative_to(root)
                if not target.exists() or target.read_text(encoding='utf-8') != content:
                    errors.append('file mismatch: '+name)
            if errors:
                failures.append(f"{lesson['id']} case {number}: {'; '.join(errors)}")
            checked += 1
print(f'CPython: {checked} cases, {len(failures)} failures')
for failure in failures:
    print(failure)
sys.exit(bool(failures))
