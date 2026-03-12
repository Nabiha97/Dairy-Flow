@echo off
echo ========================================
echo Creating .env file for Dairy Flow
echo ========================================
echo.

set /p DB_PASSWORD="Enter your PostgreSQL password: "

(
echo DB_HOST=localhost
echo DB_NAME=dairy_flow
echo DB_USER=postgres
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_PORT=5432
) > .env

echo.
echo .env file created successfully!
echo.
pause

