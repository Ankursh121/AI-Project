@echo off
echo ========================================================
echo Running Automated Pytest Suite (33 Tests)...
echo ========================================================
cd /d "%~dp0"
.\venv\Scripts\python.exe -m pytest -v
pause
