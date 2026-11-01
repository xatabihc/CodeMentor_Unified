#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/share/applications"
cat > "$HOME/.local/share/applications/codementor-unified.desktop" <<DESKTOP
[Desktop Entry]
Name=CodeMentor 2.0
Comment=Python с нуля · офлайн
Exec=/bin/bash "$ROOT/run-ubuntu.sh"
Icon=$ROOT/www/icons/icon.svg
Terminal=true
Type=Application
Categories=Education;Development;
DESKTOP
chmod +x "$HOME/.local/share/applications/codementor-unified.desktop"
echo 'Добавлен ярлык CodeMentor 2.0 в меню приложений.'
