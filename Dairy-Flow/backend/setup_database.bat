@echo off
echo ========================================
echo Setting up Dairy Flow Database
echo ========================================
echo.

echo Step 1: Creating database...
psql -U postgres -c "CREATE DATABASE dairy_flow;" 2>nul
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database might already exist or there was an error.
    echo Continuing...
)
echo.

echo Step 2: Running schema SQL file...
set /p DB_PASSWORD="Enter your PostgreSQL password: "
set PGPASSWORD=%DB_PASSWORD%
psql -U postgres -d dairy_flow -f database\schema.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Database setup completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Error setting up database.
    echo Please check your PostgreSQL password and try again.
    echo ========================================
)

echo.
pause

