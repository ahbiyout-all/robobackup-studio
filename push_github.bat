@echo off
chcp 65001 > nul
echo ====================================================================
echo  RoboBackup Studio - GitHub Automated Push Script
echo  Developer: AhBiYout (AhBiYout-all)
echo  Repository: https://github.com/AhBiYout-all/robobackup-studio
echo ====================================================================

cd /d "%~dp0"

echo [*] Checking git repository status...
if not exist ".git" (
    echo [*] Initializing git repository...
    git init
    git branch -M main
)

echo [*] Setting remote repository origin to AhBiYout-all...
git remote remove origin 2>nul
git remote add origin https://github.com/AhBiYout-all/robobackup-studio.git

echo [*] Adding essential project files (excluding build artifacts and sensitive data)...
git add .

echo [*] Committing changes...
set /p COMMIT_MSG="Enter commit message (Press Enter for default 'v2.13.0 Release Update'): "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=v2.13.0 Release Update - High Performance Robocopy Studio & C# WPF Generator"

git commit -m "%COMMIT_MSG%"

echo [*] Pushing to GitHub (AhBiYout-all/robobackup-studio)...
git push -u origin main

echo ====================================================================
echo  [SUCCESS] GitHub push completed successfully!
echo ====================================================================
pause
