@echo off
REM Windows Deployment Package Creator for cPanel
REM This script prepares your project for cPanel deployment

echo =========================================
echo Creating cPanel Deployment Package
echo =========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies locally...
    call npm install
    if errorlevel 1 (
        echo Error: npm install failed
        pause
        exit /b 1
    )
)

echo.
echo Step 1: Building for production...
call npm run build:cpanel
if errorlevel 1 (
    echo Warning: Build failed, continuing anyway...
)

echo.
echo Step 2: Creating deployment archive...
echo This may take several minutes...

REM Create a temporary directory for deployment files
if exist "deploy-temp" rmdir /s /q deploy-temp
mkdir deploy-temp

REM Copy necessary files
echo Copying files...
xcopy /E /I /Y node_modules deploy-temp\node_modules
xcopy /E /I /Y dist deploy-temp\dist 2>nul
xcopy /E /I /Y prisma deploy-temp\prisma
copy /Y package.json deploy-temp\
copy /Y package-lock.json deploy-temp\
copy /Y server.js deploy-temp\
copy /Y server.cjs deploy-temp\
copy /Y run.sh deploy-temp\ 2>nul
copy /Y .env deploy-temp\ 2>nul

echo.
echo Step 3: Compressing deployment package...
REM Use PowerShell to create zip file
powershell -command "Compress-Archive -Path 'deploy-temp\*' -DestinationPath 'cpanel-deployment.zip' -Force"

if exist "cpanel-deployment.zip" (
    echo.
    echo =========================================
    echo SUCCESS! Deployment package created
    echo =========================================
    echo.
    echo File: cpanel-deployment.zip
    echo Size: 
    for %%A in (cpanel-deployment.zip) do echo   %%~zA bytes
    echo.
    echo Next steps:
    echo 1. Upload cpanel-deployment.zip to your cPanel File Manager
    echo 2. Extract so server.js, node_modules, and dist are in the SAME folder (e.g. ~/prod).
    echo    If extract creates a subfolder, set Application Root to that subfolder.
    echo 3. On cPanel, cd to that folder and run: npx prisma generate
    echo 4. Then run: npm start  (or chmod +x run.sh and use run.sh as Startup File).
    echo.
    echo Do NOT run npm install on cPanel (it gets killed).
    echo.
) else (
    echo Error: Failed to create deployment package
)

REM Cleanup
rmdir /s /q deploy-temp

echo.
pause
