@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ====================================================================
echo  RoboBackup Studio - GitHub Automated Push & CI/CD Trigger Script
echo  Developer: AhBiYout (GitHub: AhBiYout-all)
echo  Repository: https://github.com/AhBiYout-all/robobackup-studio
echo ====================================================================
echo.

cd /d "%~dp0"

REM 1. Parse latest version from docs\PATCH_NOTES.md
set "VERSION=v2.16.5"
set "PATCH_FILE=docs\PATCH_NOTES.md"
if exist "%PATCH_FILE%" (
    for /f "tokens=2 delims=[]" %%A in ('findstr /r /c:"^##.*\[v[0-9]" "%PATCH_FILE%"') do (
        if not "%%A"=="" (
            set "VERSION=%%A"
            goto :VERSION_FOUND
        )
    )
)
:VERSION_FOUND
echo [*] Current Release Target Version: %VERSION%
echo.

REM 2. Check Git Installation
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed or not found in system PATH.
    echo Please install Git for Windows from https://git-scm.com/
    pause
    exit /b 1
)

REM 3. Check or Initialize Git Repository
echo [*] Checking local Git repository...
if not exist ".git" (
    echo [*] Initializing new Git repository...
    git init
    git branch -M main
)

REM 4. Configure Remote Origin (AhBiYout-all)
echo [*] Configuring GitHub remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/AhBiYout-all/robobackup-studio.git

REM 5. Stage Files (Respecting .gitignore)
echo [*] Staging essential project files...
git add .

REM 6. Commit Changes
set "DEFAULT_MSG=Release %VERSION% - High Performance Robocopy Studio"
echo.
set /p USER_MSG="Enter commit message (Press Enter for default '%DEFAULT_MSG%'): "
if "%USER_MSG%"=="" set "USER_MSG=%DEFAULT_MSG%"

echo [*] Committing changes...
git commit -m "%USER_MSG%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [*] Working tree clean or commit already up to date.
)

REM 7. Create/Update Git Release Tag
echo [*] Creating Git Release Tag: %VERSION%...
git tag -a "%VERSION%" -m "Release %VERSION%" -f

REM 8. Push to GitHub Main Branch
echo [*] Pushing commits to GitHub (main branch)...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] git push main failed. Checking credentials or branch state.
)

REM 9. Push Git Release Tag (Triggers GitHub Actions Automated Build & Release)
echo [*] Pushing release tag (%VERSION%) to trigger GitHub Actions...
git push origin "%VERSION%" --force
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Failed to push tag %VERSION%. You can re-run or push manually: git push origin %VERSION% --force
)

echo.
echo ====================================================================
echo  [SUCCESS] GitHub push and release tag trigger completed!
echo ====================================================================
echo  * GitHub Actions Build Status:
echo    https://github.com/AhBiYout-all/robobackup-studio/actions
echo.
echo  * GitHub Releases Downloads:
echo    https://github.com/AhBiYout-all/robobackup-studio/releases
echo ====================================================================
echo.
pause
