"""ZIP fixture tests for packaging verification; does not build an APK."""
import io
from pathlib import Path
import unittest
import zipfile
from check_apk import verify_assets, ROOT


class PackagingTests(unittest.TestCase):
    def fixture(self, changed=None, extra=False):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive:
            for path in (ROOT / 'www').rglob('*'):
                if path.is_file():
                    name = path.relative_to(ROOT / 'www').as_posix()
                    archive.writestr('assets/' + name, b'stale' if name == changed else path.read_bytes())
            if extra:
                archive.writestr('assets/stale.js', b'old')
        buffer.seek(0)
        return zipfile.ZipFile(buffer)

    def test_current_assets(self):
        with self.fixture() as archive:
            self.assertGreaterEqual(len(verify_assets(archive)), 166)

    def test_stale_code(self):
        with self.fixture(changed='worker.js') as archive:
            with self.assertRaisesRegex(ValueError, 'Stale'):
                verify_assets(archive)

    def test_stale_mathematics(self):
        with self.fixture(changed='math-lessons.js') as archive:
            with self.assertRaisesRegex(ValueError, 'Stale'):
                verify_assets(archive)

    def test_stale_extra(self):
        with self.fixture(extra=True) as archive:
            with self.assertRaisesRegex(ValueError, 'stale='):
                verify_assets(archive)


if __name__ == '__main__':
    unittest.main()
