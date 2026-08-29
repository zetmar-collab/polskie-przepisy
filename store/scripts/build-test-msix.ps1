<#
    Buduje OSOBNY pakiet testowy, podpisany certyfikatem testowym
    zainstalowanym w systemie.

    Pakiet sklepowy (store\out\PolskiePrzepisy_<wersja>_x64.msix) pozostaje
    nietknięty i niepodpisany — Partner Center podpisuje go certyfikatem Sklepu.

    Użycie:
        pwsh -File store\scripts\build-test-msix.ps1
        pwsh -File store\scripts\build-test-msix.ps1 -Install
        pwsh -File store\scripts\build-test-msix.ps1 -Thumbprint <odcisk-palca>
#>
[CmdletBinding()]
param(
    [string]$Version = '1.0.0.0',
    [string]$Subject = 'CN=15A53D32-C868-48EE-B700-5DBB5449CA1B',
    [string]$Thumbprint,
    [switch]$Install
)

$ErrorActionPreference = 'Stop'

$root   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$store  = Join-Path $root 'store'
$output = Join-Path $store 'out'
$msix   = Join-Path $output "PolskiePrzepisy_${Version}_x64.msix"
$test   = Join-Path $output "PolskiePrzepisy_${Version}_x64_TEST.msix"

if (-not (Test-Path $msix)) {
    throw "Brak pakietu sklepowego: $msix`nUruchom najpierw: pwsh -File store\scripts\build-msix.ps1"
}

$signtool = Get-ChildItem 'C:\Program Files (x86)\Windows Kits\10\bin' -Directory -ErrorAction SilentlyContinue |
            Where-Object Name -match '^10\.' | Sort-Object Name -Descending |
            ForEach-Object { Join-Path $_.FullName 'x64\signtool.exe' } |
            Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $signtool) { throw 'Nie znaleziono signtool.exe — zainstaluj Windows 10/11 SDK.' }

# --- Certyfikat testowy z magazynu systemowego ------------------------------
# Podmiot certyfikatu musi być identyczny z polem Publisher w manifeście,
# inaczej instalacja pakietu zostanie odrzucona.
$certs = Get-ChildItem Cert:\CurrentUser\My, Cert:\LocalMachine\My -ErrorAction SilentlyContinue |
         Where-Object { $_.HasPrivateKey -and $_.NotAfter -gt (Get-Date) }

if ($Thumbprint) {
    $cert = $certs | Where-Object Thumbprint -eq $Thumbprint | Select-Object -First 1
    if (-not $cert) { throw "Nie znaleziono certyfikatu z kluczem prywatnym o odcisku $Thumbprint." }
} else {
    $cert = $certs | Where-Object Subject -eq $Subject | Sort-Object NotAfter -Descending | Select-Object -First 1
    if (-not $cert) { throw "Nie znaleziono ważnego certyfikatu testowego dla podmiotu $Subject." }
}

Write-Host "==> Certyfikat: $($cert.Thumbprint) (ważny do $($cert.NotAfter.ToString('yyyy-MM-dd')))" -ForegroundColor Cyan

# --- Podpisanie kopii -------------------------------------------------------
Copy-Item $msix $test -Force
& $signtool sign /fd SHA256 /sha1 $cert.Thumbprint /t http://timestamp.digicert.com $test
if ($LASTEXITCODE -ne 0) { throw 'signtool zakończone błędem.' }

& $signtool verify /pa $test | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Warning 'Weryfikacja podpisu nie powiodła się — sprawdź zaufanie do certyfikatu.' }

$mb = [math]::Round((Get-Item $test).Length / 1MB, 1)
Write-Host ''
Write-Host "Pakiet testowy: $test ($mb MB)" -ForegroundColor Green
Write-Host "Pakiet sklepowy (niepodpisany): $msix" -ForegroundColor Green

if ($Install) {
    Write-Host ''
    Write-Host '==> Instalacja pakietu testowego' -ForegroundColor Cyan
    Add-AppxPackage -Path $test -ForceUpdateFromAnyVersion
    Write-Host 'Zainstalowano. Uruchom "Polskie Przepisy" z menu Start.' -ForegroundColor Green
    Write-Host 'Odinstalowanie: Get-AppxPackage *Polskieprzepisy* | Remove-AppxPackage'
}
