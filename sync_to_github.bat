@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync_to_github.ps1" %*
pause
