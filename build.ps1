# ====================================================================
# RoboBackup Studio - High Performance PowerShell Build Pipeline
# Developer: AhBiYout
# Blog: ahbivibelog.blogspot.com
# ====================================================================
$ErrorActionPreference = "Continue"

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " [RoboBackup Studio] Starting Automatic Build Pipeline (PowerShell)" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

$AppName = "RoboBackupStudio"
$PatchFile = "docs\PATCH_NOTES.md"
$Version = "v2.13.0"

if (Test-Path $PatchFile) {
    $lines = Get-Content $PatchFile
    foreach ($line in $lines) {
        if ($line -match '##\s+📌\s+\[(v[0-9\.]+)\]') {
            $Version = $matches[1]
            break
        }
    }
}

Write-Host "[*] Target Release Version: $Version" -ForegroundColor Yellow

if (!(Test-Path "publish")) { New-Item -ItemType Directory -Path "publish" | Out-Null }
if (!(Test-Path "publish\app")) { New-Item -ItemType Directory -Path "publish\app" | Out-Null }

# 1. Compile Single-File Portable
Write-Host "`n[*] [1/2] Compiling Portable Single-File EXE..." -ForegroundColor Green
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true -o "./publish"

if (Test-Path "publish\$AppName.exe") {
    Copy-Item -Force "publish\$AppName.exe" "publish\${AppName}_${Version}_Portable.exe"
    Write-Host "[OK] 1. Portable Executable: publish\${AppName}_${Version}_Portable.exe" -ForegroundColor Green
}

# 2. Compile Unpacked App
Write-Host "`n[*] [2/2] Compiling Unpacked App for Installer & SCM Service..." -ForegroundColor Green
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=false -o "./publish/app" | Out-Null

if (Test-Path "publish\app\$AppName.exe") {
    Write-Host "[OK] 2. Unpacked Binaries Ready: publish\app\" -ForegroundColor Green
}

# 3. Inno Setup
Write-Host "`n[*] Checking Inno Setup Compiler (ISCC.exe)..." -ForegroundColor Green
$isccPaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 5\ISCC.exe"
)

$iscc = $null
foreach ($path in $isccPaths) {
    if (Test-Path $path) { $iscc = $path; break }
}

if ($iscc) {
    Write-Host "[*] Inno Setup found at: $iscc" -ForegroundColor Green
    & $iscc "/DMyAppVersion=$Version" "/DMyAppOutputName=${AppName}_${Version}_Setup" "installer.iss"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] 3. Setup Installer Created: publish\${AppName}_${Version}_Setup.exe" -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] Inno Setup not found. Download from https://jrsoftware.org/isdl.php to build Setup.exe" -ForegroundColor Yellow
}

Write-Host "`n====================================================================" -ForegroundColor Cyan
Write-Host " [FINISHED] Build Summary" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Get-ChildItem "publish\*.exe" | Select-Object Name, Length | Format-Table -AutoSize
Read-Host "Press Enter to exit..."
