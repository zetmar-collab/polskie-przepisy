@echo off
chcp 65001 >nul
title Ksiazka Kucharska
rem ===== Uruchamia aplikacje w oknie przegladarki (tryb aplikacji) =====

set "APPDIR=%~dp0"
set "APPDIR=%APPDIR:\=/%"
set "URL=file:///%APPDIR%index.html"

rem --- Probuje Google Chrome (tryb okna aplikacji) ---
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if defined CHROME (
  start "" "%CHROME%" --app="%URL%" --window-size=1200,800
  goto :end
)

rem --- Probuje Microsoft Edge (tryb okna aplikacji) ---
set "EDGE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined EDGE (
  start "" "%EDGE%" --app="%URL%" --window-size=1200,800
  goto :end
)

rem --- Awaryjnie: domyslna przegladarka ---
start "" "%URL%"

:end
