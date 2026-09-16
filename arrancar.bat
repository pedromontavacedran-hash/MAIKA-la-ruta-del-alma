@echo off
REM Arrancador MAIKA - mata la instancia anterior y arranca limpio
setlocal

REM Obtiene el PID del cmd actual (proceso padre de PowerShell)
for /f %%a in ('powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \"ProcessId=$PID\").ParentProcessId"') do set "MY_PID=%%a"

REM Archivo de bloqueo con el PID del cmd anterior
set "LOCK=%TEMP%\maika_dev.lock"

REM Si existe el archivo, hay una instancia anterior - matarla
if exist "%LOCK%" (
  set /p OLD_PID=<"%LOCK%"
  echo 🔨 Cerrando instancia anterior (PID %OLD_PID%)...
  taskkill /F /T /PID %OLD_PID% >nul 2>&1
  del "%LOCK%" >nul 2>&1
  timeout /t 2 /nobreak >nul
)

REM Escribe el PID actual en el archivo de bloqueo
echo %MY_PID% > "%LOCK%"

REM Mata procesos en los puertos 5173 y 3001 (con sus hijos)
echo 🔨 Limpiando puertos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  taskkill /F /T /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  taskkill /F /T /PID %%a >nul 2>&1
)

REM Mata cualquier node.exe con vite o backend en el comando
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'vite|backend' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo ✅ Limpieza completada. Arrancando...
echo.
npm run dev:full

REM Al terminar, libera el bloqueo
del "%LOCK%" >nul 2>&1
endlocal
