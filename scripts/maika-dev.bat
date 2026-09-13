@echo off
setlocal EnableExtensions
REM Doble clic o: scripts\maika-dev.bat
REM Cierra listeners en 5173 y 3001 (Vite y API) y luego arranca dev:full.
cd /d "%~dp0\.."

echo.
echo === MAIKA: liberar 5173 y 3001 si quedaron ocupados ===
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; foreach ($port in 5173,3001) { $ids = Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $ids) { if ($procId -gt 0) { Write-Host ('Puerto '+$port+': cerrando PID '+$procId); Stop-Process -Id $procId -Force } } }"
timeout /t 1 /nobreak >nul

echo.
echo === MAIKA: npm run dev:full ===
call npm run dev:full
echo.
echo Proceso terminado. Codigo: %ERRORLEVEL%
pause
