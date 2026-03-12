@echo off
echo ========================================
echo    DAIRY FLOW - QUICK SETUP WIZARD
echo ========================================
echo.
echo This will help you set up the backend step by step.
echo.
echo PREREQUISITES:
echo 1. Python must be installed (https://www.python.org/downloads/)
echo 2. PostgreSQL must be installed (https://www.postgresql.org/download/)
echo.
pause

cd /d %~dp0

echo.
echo ========================================
echo STEP 1: Checking Python Installation
echo ========================================
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python first from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
) else (
    python --version
    echo [OK] Python is installed!
)
echo.

echo ========================================
echo STEP 2: Checking PostgreSQL Installation
echo ========================================
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL might not be installed or not in PATH.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
) else (
    psql --version
    echo [OK] PostgreSQL is installed!
)
echo.

echo ========================================
echo STEP 3: Installing Python Packages
echo ========================================
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install packages!
    pause
    exit /b 1
)
echo [OK] Packages installed!
echo.

echo ========================================
echo STEP 4: Creating .env File
echo ========================================
if exist .env (
    echo .env file already exists.
    set /p OVERWRITE="Overwrite? (y/n): "
    if /i "%OVERWRITE%"=="y" (
        call create_env.bat
    )
) else (
    call create_env.bat
)
echo.

echo ========================================
echo STEP 5: Setting Up Database
echo ========================================
set /p SETUP_DB="Set up database tables? (y/n): "
if /i "%SETUP_DB%"=="y" (
    call setup_database.bat
)
echo.

echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo To start the server, run: start_server.bat
echo Or manually: python app.py
echo.
echo The server will run at: http://localhost:5000
echo.
pause

