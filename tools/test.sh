#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/export_courses.py
python3 tools/sync_android.py
python3 tools/check_catalog.py
python3 tools/reference_solutions.py | node tools/test_runner.js
python3 tools/reference_solutions.py | node tools/worker_coverage.js
node tools/test_editor.js
node tools/test_navigation.js
mkdir -p .test-tmp/native-navigation
javac -d .test-tmp/native-navigation android-studio/app/src/main/java/com/codementor/offline/SafeArea.java tools/java/SafeAreaTest.java
java -cp .test-tmp/native-navigation com.codementor.offline.SafeAreaTest
python3 tools/test_apk_assets.py
node tools/test_learning.js
node tools/test_progress.js
node tools/test_app_storage.js
python3 tools/test_legacy_progress.py
python3 tools/check_references.py
node --check www/app.js
node --check www/worker.js
bash -n tools/build-apk.sh
