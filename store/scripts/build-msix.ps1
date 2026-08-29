<#
    Buduje pakiet MSIX aplikacji "Polskie Przepisy" do wysyłki w Partner Center.

    Wymagania: .NET SDK 8+ oraz Windows 10 SDK (makeappx.exe, makepri.exe).
    Użycie:    pwsh -File store\scripts\build-msix.ps1 [-Version 1.0.0.0]
#>
[CmdletBinding()]
param(
    [string]$Version = '1.0.0.0',
    [ValidateSet('x64')][string]$Architecture = 'x64'
)

$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$store    = Join-Path $root 'store'
$project  = Join-Path $store 'src\PolskiePrzepisy.csproj'
$assets   = Join-Path $store 'assets'
$manifest = Join-Path $store 'AppxManifest.xml'
$layout   = Join-Path $store 'build\layout'
$output   = Join-Path $store 'out'

# --- Lokalizacja narzędzi Windows SDK ---------------------------------------
function Find-SdkTool([string]$name) {
    $bin = 'C:\Program Files (x86)\Windows Kits\10\bin'
    $hit = Get-ChildItem $bin -Directory -ErrorAction SilentlyContinue |
           Where-Object Name -match '^10\.' |
           Sort-Object Name -Descending |
           ForEach-Object { Join-Path $_.FullName "x64\$name" } |
           Where-Object { Test-Path $_ } |
           Select-Object -First 1
    if (-not $hit) { throw "Nie znaleziono $name — zainstaluj Windows 10/11 SDK." }
    return $hit
}
$makeappx = Find-SdkTool 'makeappx.exe'
$makepri  = Find-SdkTool 'makepri.exe'

# --- 0. Synchronizacja plików aplikacji webowej -----------------------------
Write-Host '==> Synchronizacja wwwroot z plikami projektu' -ForegroundColor Cyan
$wwwroot = Join-Path $store 'src\wwwroot'
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
Copy-Item (Join-Path $root 'index.html') $wwwroot -Force
Copy-Item (Join-Path $root 'css') $wwwroot -Recurse -Force
Copy-Item (Join-Path $root 'js')  $wwwroot -Recurse -Force

# --- 1. Kompilacja samodzielnej aplikacji -----------------------------------
Write-Host '==> Kompilacja aplikacji (self-contained)' -ForegroundColor Cyan
if (Test-Path $layout) { Remove-Item $layout -Recurse -Force }
dotnet publish $project -c Release -o $layout | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'dotnet publish zakończone błędem.' }

# Dokumentacja XML pakietów NuGet nie jest potrzebna w pakiecie.
Get-ChildItem $layout -Filter '*.xml' -File | Remove-Item -Force

# --- 2. Zasoby graficzne i manifest -----------------------------------------
Write-Host '==> Kopiowanie zasobów i manifestu' -ForegroundColor Cyan
$layoutAssets = Join-Path $layout 'Assets'
New-Item -ItemType Directory -Path $layoutAssets -Force | Out-Null
Copy-Item (Join-Path $assets '*.png') $layoutAssets -Force

$xml = [xml](Get-Content $manifest)
$xml.Package.Identity.Version = $Version
$xml.Package.Identity.ProcessorArchitecture = $Architecture
$xml.Save((Join-Path $layout 'AppxManifest.xml'))

# --- 3. Indeks zasobów (resources.pri) --------------------------------------
Write-Host '==> Generowanie resources.pri' -ForegroundColor Cyan
$priConfig = Join-Path $store 'build\priconfig.xml'
& $makepri createconfig /ConfigXml $priConfig /Default pl-PL /Overwrite | Out-Null
Push-Location $layout
try {
    & $makepri new /ProjectRoot $layout /ConfigXml $priConfig `
        /OutputFile (Join-Path $layout 'resources.pri') /Manifest (Join-Path $layout 'AppxManifest.xml') /Overwrite | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'makepri zakończone błędem.' }
} finally { Pop-Location }

# --- 4. Pakowanie MSIX ------------------------------------------------------
Write-Host '==> Pakowanie MSIX' -ForegroundColor Cyan
New-Item -ItemType Directory -Path $output -Force | Out-Null
$msix = Join-Path $output "PolskiePrzepisy_${Version}_${Architecture}.msix"
if (Test-Path $msix) { Remove-Item $msix -Force }
& $makeappx pack /d $layout /p $msix /overwrite | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'makeappx zakończone błędem.' }

$mb = [math]::Round((Get-Item $msix).Length / 1MB, 1)
Write-Host ''
Write-Host "Gotowe: $msix ($mb MB)" -ForegroundColor Green
Write-Host 'Pakiet jest niepodpisany — Partner Center podpisze go certyfikatem Sklepu.'
