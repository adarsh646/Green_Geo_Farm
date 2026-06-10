@echo off
REM GeoFarm Camera Microservice Startup Script
REM Run from PowerShell with:  cmd /c ".\GeoFarm\start_camera.bat"
REM Or double-click this file in Explorer

set "SOURCE=..\videos\Trial_video.mp4"
set "CAMERA_ID=XPIA_I_01"

REM Always work relative to THIS script's location (not the caller's CWD)
cd /d "%~dp0camera_microservice"

REM Detect the right Python executable
if exist "venv_win\Scripts\python.exe" (
    set "PY_EXE=venv_win\Scripts\python.exe"
) else if exist ".venv\Scripts\python.exe" (
    set "PY_EXE=.venv\Scripts\python.exe"
) else (
    set "PY_EXE=python"
)

echo [DEBUG] Script dir : %~dp0
echo [DEBUG] Working dir: %CD%
echo [DEBUG] Python     : %PY_EXE%
echo [DEBUG] Source     : "%SOURCE%"
echo.
echo [INFO] Starting GeoFarm Camera Microservice...
echo.

%PY_EXE% api.py --source "%SOURCE%" --camera-id "%CAMERA_ID%"
pause
