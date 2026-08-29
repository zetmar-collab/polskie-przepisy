#!/bin/bash
# ===== Ksiazka Kucharska - uruchomienie na macOS =====
# Otwiera aplikacje w oknie przegladarki (tryb aplikacji w Chrome, jesli jest).
# Aby plik dzialal po dwukrotnym uruchomieniu, nadaj mu prawa wykonywania:
#   chmod +x "Uruchom-Ksiazke-Mac.command"

DIR="$(cd "$(dirname "$0")" && pwd)"
URL="file://$DIR/index.html"

if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL" --window-size=1200,800
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$URL" --window-size=1200,800
else
  open "$URL"
fi
