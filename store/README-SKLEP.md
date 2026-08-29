# Polskie Przepisy — pakiet dla Microsoft Store

Aplikacja webowa (HTML/CSS/JS) zapakowana jako **samodzielna aplikacja Windows**.
Nie wymaga instalowania czegokolwiek ze stron trzecich — przeglądarka, w której
wyświetlane są przepisy, jest **wbudowana w aplikację**.

## Dane sklepowe

| Pole | Wartość |
|---|---|
| Package/Identity/Name | `MarekZettel-zetmar.Polskieprzepisy` |
| Package/Identity/Publisher | `CN=15A53D32-C868-48EE-B700-5DBB5449CA1B` |
| Package/Properties/PublisherDisplayName | `Marek Zettel - zetmar` |
| Package Family Name | `MarekZettel-zetmar.Polskieprzepisy_411qrz2m02jw4` |
| Identyfikator sklepu | `9NR7TWLXMW6` |
| Nazwa wyświetlana | Polskie Przepisy |
| Architektura | x64 |
| Minimalna wersja Windows | 10.0.17763.0 (Windows 10 1809) |

## Budowanie

```powershell
pwsh -File store\scripts\build-msix.ps1
```

Wynik: `store\out\PolskiePrzepisy_1.0.0.0_x64.msix` (~66 MB).
Pakiet jest **niepodpisany** — Partner Center podpisuje go certyfikatem Sklepu
przy publikacji. Nie podpisuj pakietu wysyłanego do Sklepu własnym certyfikatem.

Podniesienie wersji przy aktualizacji:

```powershell
pwsh -File store\scripts\build-msix.ps1 -Version 1.0.1.0
```

Ostatni człon wersji musi zawsze wynosić `0` — tego wymaga Sklep.

## Pakiet testowy (osobny plik)

Pakiet sklepowy zostaje niepodpisany. Do testów budowany jest **osobny plik**
`..._TEST.msix`, podpisany certyfikatem testowym z magazynu Windows
(`Cert:\CurrentUser\My`, podmiot `CN=15A53D32-C868-48EE-B700-5DBB5449CA1B`).

```powershell
pwsh -File store\scripts\build-test-msix.ps1 -Install
```

Bez `-Install` skrypt tylko podpisuje pakiet. Jeśli w systemie jest kilka
pasujących certyfikatów, wybierany jest ten o najdłuższej ważności; konkretny
można wskazać przez `-Thumbprint <odcisk>`. Uprawnienia administratora nie są
potrzebne, o ile certyfikat jest już zaufany w `LocalMachine\TrustedPeople`.

Odinstalowanie:

```powershell
Get-AppxPackage *Polskieprzepisy* | Remove-AppxPackage
```

W `store\out\` powstają zatem dwa pliki:

| Plik | Podpis | Przeznaczenie |
|---|---|---|
| `PolskiePrzepisy_1.0.0.0_x64.msix` | brak | wysyłka do Partner Center |
| `PolskiePrzepisy_1.0.0.0_x64_TEST.msix` | certyfikat testowy | instalacja lokalna |

## Wysyłka do Partner Center

1. Partner Center → aplikacja **Polskie Przepisy** (`9NR7TWLXMW6`) → **Pakiety**.
2. Prześlij `store\out\PolskiePrzepisy_1.0.0.0_x64.msix`.
3. Uzupełnij opis, zrzuty ekranu, wiek (3+) i kategorię
   (*Jedzenie i picie* / *Styl życia*).
4. W **Deklaracjach produktu** zaznacz, że aplikacja działa offline.

## Jak to zbudowano

| Element | Rozwiązanie |
|---|---|
| Host aplikacji | .NET 8 WinForms, publikacja *self-contained* (środowisko .NET w pakiecie) |
| Silnik stron | WebView2 — komponent systemowy Windows 10/11 (Microsoft, nie firma trzecia) |
| Pliki aplikacji | `wwwroot\` wewnątrz pakietu, serwowane pod `https://przepisy.local/` |
| Schowek, localStorage | działają dzięki adresowi `https://` zamiast `file://` |
| Przyciski AI | otwierane w domyślnej przeglądarce systemu |
| Drukowanie przepisu | osobne okno aplikacji z podglądem wydruku |
| Lista zakupów `.txt` | pobieranie obsługiwane przez WebView2 (folder Pobrane) |
| Dane użytkownika | `%LOCALAPPDATA%` (katalog pakietu jest tylko do odczytu) |

### Pełna niezależność od komponentu systemowego (opcjonalnie)

Silnik WebView2 jest częścią Windows 11 i Windows 10 (dostarczany z Edge), więc
w praktyce jest obecny na każdym komputerze. Jeśli mimo to chcesz zawrzeć silnik
bezpośrednio w pakiecie:

1. Pobierz **Fixed Version** (x64, plik `.cab`) ze strony
   <https://developer.microsoft.com/microsoft-edge/webview2/>
2. ```powershell
   pwsh -File store\scripts\embed-webview2-runtime.ps1 -CabPath <sciezka-do-.cab>
   pwsh -File store\scripts\build-msix.ps1
   ```

Aplikacja wykryje folder `WebView2Runtime` i użyje dołączonego silnika.
Pakiet urośnie o ok. 150–200 MB.

## Struktura

```
store/
├── AppxManifest.xml              # manifest pakietu MSIX
├── assets/                       # ikony i kafelki (generowane z icons/icon.png)
├── src/                          # host aplikacji (C#)
│   ├── PolskiePrzepisy.csproj
│   ├── Program.cs
│   ├── MainForm.cs               # okno główne + WebView2
│   ├── PopupForm.cs              # okno podglądu wydruku
│   ├── WebViewRuntime.cs         # wybór silnika i folderu danych
│   ├── AppIcon.cs
│   └── wwwroot/                  # kopia aplikacji webowej (generowana przy budowaniu)
├── scripts/
│   ├── build-msix.ps1
│   ├── build-test-msix.ps1
│   └── embed-webview2-runtime.ps1
├── build/                        # katalog roboczy
└── out/                          # pakiet sklepowy + pakiet testowy
```
