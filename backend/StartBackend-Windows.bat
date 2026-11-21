@echo off
cd /d "%~dp0"
if not exist ".env" (
  echo ERROR: Create backend\.env from .env.example and fill in the credentials.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo ERROR: Create the virtual environment and install requirements first.
  pause
  exit /b 1
)
echo Starting FastAPI at http://127.0.0.1:8000
.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
