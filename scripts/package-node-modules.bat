@echo off
REM Quick node_modules packager for cPanel

echo =========================================
echo Creating node_modules package for cPanel
echo =========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo node_modules not found. Installing...
    call npm install
    if errorlevel 1 (
        echo Error: npm install failed
        pause
        exit /b 1
    )
)

echo.
echo Compressing node_modules...
echo This will take 5-10 minutes depending on size...
echo.

REM Use tar (built into Windows 10+)
tar -czf node_modules.tar.gz node_modules

if exist "node_modules.tar.gz" (
    echo.
    echo =========================================
    echo SUCCESS!
    echo =========================================
    echo.
    echo File created: node_modules.tar.gz
    for %%A in (node_modules.tar.gz) do (
        set size=%%~zA
        set /a sizeMB=%%~zA/1024/1024
    )
    echo Size: %sizeMB% MB
    echo.
    echo Next steps:
    echo 1. Upload node_modules.tar.gz to cPanel File Manager
    echo 2. Place it in ~/prod directory
    echo 3. Extract with: tar -xzf node_modules.tar.gz
    echo 4. Run: npm start
    echo.
) else (
    echo Error: Failed to create archive
)

pause
