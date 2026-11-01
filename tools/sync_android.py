"""Copy frontend into native Android assets; safe idempotent sync."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
src=root/'www';dst=root/'android-studio/app/src/main/assets'
dst.mkdir(parents=True,exist_ok=True)
for old in dst.rglob('*'):
    if old.is_file():old.unlink()
for f in src.rglob('*'):
    if f.is_file():
        target=dst/f.relative_to(src);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
print(f'Synchronized {len(list(src.rglob("*")))} files with Android assets.')
