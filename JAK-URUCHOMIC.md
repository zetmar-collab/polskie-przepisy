# 🚀 Jak uruchomić Książkę Kucharską

Aplikacja nie wymaga instalacji. Wystarczy uruchomić skrypt dla swojego systemu —
otworzy się w oknie przeglądarki (najlepiej w trybie aplikacji, czyli bez paska adresu).

## ▶️ Uruchamianie

### Windows
Kliknij dwukrotnie plik **`Uruchom-Ksiazke-Windows.bat`**.
- Skrypt sam wykryje Chrome lub Edge i otworzy aplikację w czystym oknie.
- Jeśli nie masz żadnej z tych przeglądarek, otworzy się przeglądarka domyślna.

### macOS
1. Otwórz **Terminal** w folderze aplikacji.
2. Nadaj prawa wykonywania (jednorazowo):
   ```bash
   chmod +x "Uruchom-Ksiazke-Mac.command"
   ```
3. Kliknij dwukrotnie **`Uruchom-Ksiazke-Mac.command`**.

### Linux
1. Nadaj prawa wykonywania (jednorazowo):
   ```bash
   chmod +x Uruchom-Ksiazke-Linux.sh
   ```
2. Uruchom: `./Uruchom-Ksiazke-Linux.sh` lub kliknij dwukrotnie w menedżerze plików.

---

## 🖼️ Ikony i skróty na pulpicie

W folderze **`icons/`** znajdziesz ikony w formatach dla każdego systemu:

| System  | Plik ikony        |
|---------|-------------------|
| Windows | `icons/icon.ico`  |
| macOS   | `icons/icon.icns` |
| Linux   | `icons/icon.png`  |

### Windows — skrót z ikoną
1. Kliknij prawym przyciskiem na `Uruchom-Ksiazke-Windows.bat` → **Utwórz skrót**.
2. Przeciągnij skrót na pulpit.
3. Prawy przycisk na skrócie → **Właściwości** → **Zmień ikonę…**
4. Wskaż plik `icons\icon.ico` i zatwierdź.

### macOS — własna ikona
1. Otwórz `icons/icon.icns` w **Podglądzie** i skopiuj obraz (Cmd + C).
   (Możesz też otworzyć `icons/icon.png` i skopiować.)
2. Zaznacz `Uruchom-Ksiazke-Mac.command` → **Plik → Informacje** (Cmd + I).
3. Kliknij małą ikonę w lewym górnym rogu okna i wklej (Cmd + V).
4. Przeciągnij plik na pulpit lub Dock.

### Linux — skrót z ikoną
1. Otwórz plik **`Ksiazka-Kucharska.desktop`** w edytorze tekstu.
2. Podmień `/SCIEZKA/DO/PROJEKTU` na rzeczywistą ścieżkę do tego folderu
   (np. `/home/uzytkownik/Ksiazka-kucharska`).
3. Skopiuj plik `.desktop` na pulpit i nadaj mu prawa wykonywania:
   ```bash
   chmod +x ~/Pulpit/Ksiazka-Kucharska.desktop
   ```
   (W niektórych systemach folder nazywa się `Desktop`.)

---

## ℹ️ Uwaga
Aplikacja działa w pełni offline. Lista zakupów zapisuje się lokalnie w przeglądarce.
Przyciski AI wymagają połączenia z internetem (otwierają stronę wybranego modelu).
