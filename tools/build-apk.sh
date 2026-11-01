#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/export_courses.py
python3 tools/sync_android.py
cd android-studio
./gradlew --no-daemon assembleDebug "$@"
cd ..
python3 tools/check_apk.py android-studio/app/build/outputs/apk/debug/app-debug.apk
