@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
if not exist .cache mkdir .cache
set LOGFILE=.cache\launcher.log

chcp 65001 > nul

rem --- WEZTERM_PANE is set automatically by WezTerm in all child processes ---
if not defined WEZTERM_PANE (
  set "WEZTERM_EXE="
  where wezterm >nul 2>nul && for /f "delims=" %%I in ('where wezterm') do set "WEZTERM_EXE=%%I"
  if not defined WEZTERM_EXE if exist "C:\Program Files\WezTerm\wezterm.exe" set "WEZTERM_EXE=C:\Program Files\WezTerm\wezterm.exe"
  if defined WEZTERM_EXE (
    echo [%date% %time%] [bat] relaunching in WezTerm: !WEZTERM_EXE! >> "%LOGFILE%"
    start "" "!WEZTERM_EXE!" --config-file "%~dp0wezterm.lua" start --cwd "%~dp0." -- cmd /k "%~f0"
    exit
  ) else (
    echo [%date% %time%] [bat] WezTerm not found, running in current console >> "%LOGFILE%"
  )
)

:loop
echo [%date% %time%] [bat] launching node run-taru.mjs >> "%LOGFILE%"
node run-taru.mjs
set EXITCODE=!errorlevel!
echo [%date% %time%] [bat] node exited code !EXITCODE!, restarting in 5s >> "%LOGFILE%"
echo.
echo [bat] node exited (code !EXITCODE!), restarting in 5s...
timeout /t 5 /nobreak > nul
goto loop
