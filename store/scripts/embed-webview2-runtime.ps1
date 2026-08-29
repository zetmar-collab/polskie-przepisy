<#
    Wbudowuje silnik WebView2 w wersji stałej (Fixed Version) do aplikacji,
    dzięki czemu pakiet nie zależy od żadnego komponentu zainstalowanego w systemie.

    1. Pobierz z https://developer.microsoft.com/microsoft-edge/webview2/
       sekcja "Fixed Version" -> architektura x64 -> plik .cab
    2. Uruchom:  pwsh -File store\scripts\embed-webview2-runtime.ps1 -CabPath <sciezka-do-.cab>
    3. Przebuduj pakiet:  pwsh -File store\scripts\build-msix.ps1

    Uwaga: zwiększa rozmiar pakietu o ok. 150–200 MB.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$CabPath
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $CabPath)) { throw "Nie znaleziono pliku: $CabPath" }

$root   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$target = Join-Path $root 'store\src\WebView2Runtime'
$temp   = Join-Path $env:TEMP ('wv2-' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Path $temp -Force | Out-Null
Write-Host '==> Rozpakowywanie CAB' -ForegroundColor Cyan
& expand.exe $CabPath -F:* $temp | Out-Null

# CAB zawiera jeden folder z numerem wersji, np. 131.0.2903.86
$engine = Get-ChildItem $temp -Directory | Select-Object -First 1
if (-not $engine) { throw 'Nieoczekiwana zawartość pliku CAB.' }

if (Test-Path $target) { Remove-Item $target -Recurse -Force }
Move-Item $engine.FullName $target
Remove-Item $temp -Recurse -Force

$exe = Join-Path $target 'msedgewebview2.exe'
if (-not (Test-Path $exe)) { throw "Brak msedgewebview2.exe w $target — zły plik CAB?" }

$mb = [math]::Round(((Get-ChildItem $target -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 1)
Write-Host "Gotowe: silnik ($mb MB) osadzony w store\src\WebView2Runtime" -ForegroundColor Green
Write-Host 'Uruchom teraz build-msix.ps1, aby przebudować pakiet.'
