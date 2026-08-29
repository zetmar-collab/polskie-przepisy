#!/bin/bash
# ===== Ksiazka Kucharska - uruchomienie na Linux =====
# Otwiera aplikacje w oknie przegladarki (tryb aplikacji w Chrome/Chromium, jesli jest).
# Nadaj prawa wykonywania: chmod +x Uruchom-Ksiazke-Linux.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
URL="file://$DIR/index.html"

if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --app="$URL" --window-size=1200,800 &
elif command -v google-chrome-stable >/dev/null 2>&1; then
  google-chrome-stable --app="$URL" --window-size=1200,800 &
elif command -v chromium >/dev/null 2>&1; then
  chromium --app="$URL" --window-size=1200,800 &
elif command -v chromium-browser >/dev/null 2>&1; then
  chromium-browser --app="$URL" --window-size=1200,800 &
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" &
else
  echo "Nie znaleziono przegladarki. Otworz recznie plik: $URL"
fi
