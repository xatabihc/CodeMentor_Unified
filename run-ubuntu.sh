#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
URL="http://127.0.0.1:8765/"
if command -v xdg-open >/dev/null 2>&1; then (sleep 1; xdg-open "$URL" >/dev/null 2>&1) & fi
printf 'CodeMentor запущен: %s\nДля остановки нажми Ctrl+C.\n' "$URL"
exec python3 -m http.server 8765 --bind 127.0.0.1 --directory www
