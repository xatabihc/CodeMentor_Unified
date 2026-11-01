"""Run actual browser layout checks, separately from DOM/geometry unit tests.

Requires a local Chrome allowed to create its normal process sockets. Exit 2
means the browser could not start, not a UI test success. No app data is used.
"""
from pathlib import Path
import shutil
import subprocess
import sys

root=Path(__file__).resolve().parents[1]
browser=shutil.which('google-chrome') or shutil.which('chromium')
if not browser:
    print('Browser unavailable; layout checks NOT RUN')
    sys.exit(2)
work=root/'.test-tmp/navigation-browser'
work.mkdir(parents=True,exist_ok=True)
try:
    result=subprocess.run([browser,'--headless','--no-sandbox','--disable-gpu',
        '--disable-dev-shm-usage','--allow-file-access-from-files',
        '--user-data-dir='+str(work/'profile'),'--window-size=1200,1000',
        '--virtual-time-budget=15000','--dump-dom',
        (root/'tools/navigation_browser_test.html').as_uri()],
        text=True,capture_output=True,timeout=35)
except subprocess.TimeoutExpired:
    print('Browser timed out; layout checks NOT VERIFIED')
    sys.exit(2)
(work/'result.html').write_text(result.stdout)
(work/'browser.log').write_text(result.stderr)
if result.returncode:
    print('Browser startup failed; layout checks NOT RUN:',result.stderr[:700])
    sys.exit(2)
if 'data-status="passed"' not in result.stdout:
    print('Browser layout checks FAILED or incomplete; see',work/'result.html')
    sys.exit(1)
print('PASS actual browser layout at 360/390/412: native/PWA, scroll, viewport shrink, landscape')
