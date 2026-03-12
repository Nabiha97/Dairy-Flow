@echo off
echo ========================================
echo Dairy Flow Database Reset Script
echo ========================================
echo.
echo WARNING: This will DROP and RECREATE the database!
echo All existing data will be LOST!
echo.
pause

echo.
echo Step 1: Dropping existing database (if exists)...
psql -U postgres -c "DROP DATABASE IF EXISTS dairy_flow;" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo Error: Could not connect to PostgreSQL or drop database.
    echo Please ensure PostgreSQL is running and credentials are correct.
    pause
    exit /b 1
)

echo.
echo Step 2: Creating new database...
psql -U postgres -c "CREATE DATABASE dairy_flow;" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo Error: Could not create database.
    pause
    exit /b 1
)

echo.
echo Step 3: Initializing schema...
psql -U postgres -d dairy_flow -f database\schema.sql

if %ERRORLEVEL% NEQ 0 (
    echo Error: Could not initialize schema.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database reset completed successfully!
echo ========================================
echo.
echo The database has been recreated with:
echo - 5-year data retention limit
echo - Alert system for data limits
echo - All 7 tables (production, sales, purchases, expenses, salaries, balance_sheet, summaries)
echo.
pause
