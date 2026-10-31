@echo off
setlocal

REM ====================================================================
REM  RoboBackup Studio - High Performance Build Pipeline
REM  Developer: AhBiYout
REM  Blog: https://ahbiyoutvibe.blogspot.com/
REM ====================================================================

cd /d "%~dp0"

REM 1. Set Project Name and Default Version
set "APP_NAME=RoboBackupStudio"
set "PATCH_FILE=docs\PATCH_NOTES.md"
set "VERSION=v2.17.1"

if exist "%PATCH_FILE%" (
    echo [*] Reading latest patch version from %PATCH_FILE%...
    for /f "tokens=2 delims=[]" %%A in ('findstr /r /c:"^##.*\[v[0-9]" "%PATCH_FILE%"') do (
        if not "%%A"=="" (
            set "VERSION=%%A"
            goto :VERSION_FOUND
        )
    )
)

:VERSION_FOUND
echo ====================================================================
echo  [RoboBackup Studio] Starting Automated Build Pipeline...
echo ====================================================================
echo [*] Target Release Version: %VERSION%
echo.

REM 2. Check .NET SDK Installation
where dotnet >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :DOTNET_NOT_FOUND

echo [*] .NET SDK detected:
dotnet --version
echo.
goto :PREPARE_DIRS

:DOTNET_NOT_FOUND
echo.
echo [ERROR] .NET SDK is not installed or not found in system PATH.
echo Please install .NET 8.0 SDK from: https://dotnet.microsoft.com/download
echo.
goto :FINAL_SUMMARY

:PREPARE_DIRS
REM 3. Prepare Publish Directory
if not exist "publish" mkdir "publish"
if not exist "publish\app" mkdir "publish\app"

REM ====================================================================
REM [STEP 1] Compile Portable Self-Contained Single-File Executable
REM ====================================================================
echo ====================================================================
echo [*] [1/2] Compiling Portable Single-File EXE (Windows 10/11/Server)...
echo ====================================================================
echo [*] Running dotnet publish (Self-Contained Single-File)...
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true -o "./publish"

if exist "publish\%APP_NAME%.exe" (
    copy /y "publish\%APP_NAME%.exe" "publish\%APP_NAME%_%VERSION%_Portable.exe" >nul
    echo.
    echo [OK] 1. Portable Single-File Ready: publish\%APP_NAME%_%VERSION%_Portable.exe
)
if not exist "publish\%APP_NAME%.exe" (
    echo.
    echo [WARNING] Portable single-file compilation encountered an issue.
)

REM ====================================================================
REM [STEP 2] Compile Unpacked App for Windows Installer & SCM Service
REM ====================================================================
echo.
echo ====================================================================
echo [*] [2/2] Compiling Unpacked App for Setup Installer (Program Files)...
echo ====================================================================
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=false -o "./publish/app"

if exist "publish\app\%APP_NAME%.exe" echo [OK] 2. Unpacked Application Binaries Ready in: publish\app\
if not exist "publish\app\%APP_NAME%.exe" echo [WARNING] Unpacked application compilation encountered an issue.

REM ====================================================================
REM [STEP 3] Compile Windows Installer with Inno Setup (If Installed)
REM ====================================================================
echo.
echo ====================================================================
echo [*] Checking Inno Setup Compiler (ISCC.exe)...
echo ====================================================================

set "ISCC_PATH="
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC_PATH=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if exist "%ProgramFiles(x86)%\Inno Setup 5\ISCC.exe" set "ISCC_PATH=%ProgramFiles(x86)%\Inno Setup 5\ISCC.exe"

if "%ISCC_PATH%"=="" goto :INNO_NOT_FOUND

echo [*] Inno Setup Compiler found: "%ISCC_PATH%"
echo [*] Building Windows Installer (.exe)...
"%ISCC_PATH%" /DMyAppVersion="%VERSION%" /DMyAppOutputName="%APP_NAME%_%VERSION%_Setup" "installer.iss"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] 3. Windows Setup Installer Ready: publish\%APP_NAME%_%VERSION%_Setup.exe
)
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Inno Setup compilation encountered an issue.
)
goto :FINAL_SUMMARY

:INNO_NOT_FOUND
echo [INFO] Inno Setup (ISCC.exe) not found.
echo        To build the setup installer (.exe), download Inno Setup:
echo        https://jrsoftware.org/isdl.php

:FINAL_SUMMARY
echo.
echo ====================================================================
echo  [BUILD FINISHED] RoboBackup Studio Compilation Summary
echo ====================================================================
echo  Target Release Version: %VERSION%
echo.
echo  Available Artifacts in publish\ directory:
if exist "publish\%APP_NAME%_%VERSION%_Portable.exe" echo   [1] publish\%APP_NAME%_%VERSION%_Portable.exe  (Standalone Single-File)
if exist "publish\%APP_NAME%_%VERSION%_Setup.exe" echo   [2] publish\%APP_NAME%_%VERSION%_Setup.exe     (Inno Setup Installer)
if exist "publish\app\%APP_NAME%.exe" echo   [3] publish\app\%APP_NAME%.exe                (Unpacked Folder App)
echo ====================================================================
echo.
echo Press any key to exit...
pause >nul
