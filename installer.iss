; ====================================================================
; RoboBackup Studio - Inno Setup 6 Installation Script
; High Performance Robocopy GUI & C# WPF Generator
; Developer: AhBiYout
; Blog: https://ahbiyoutvibe.blogspot.com/
; ====================================================================

#define MyAppName "RoboBackup Studio"
#define MyAppVersion "v2.17.0"
#define MyAppPublisher "AhBiYout"
#define MyAppURL "http://www.cisnet.co.kr/"
#define MyAppExeName "RoboBackupStudio.exe"
#define MyAppOutputName "RoboBackupStudio_" + MyAppVersion + "_Setup"

[Setup]
; AppId uniquely identifies this application in Windows Registry
AppId={{8B237C9F-3F1E-4E2F-A5C0-9A2E12F3D9A1}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=docs\LICENSE.txt
OutputDir=publish
OutputBaseFilename={#MyAppOutputName}
SetupIconFile=robocopy.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "serviceinstall"; Description: "Windows 서비스로 자동 등록하여 부팅 시 백그라운드 무인 백업 실행 (권장)"; GroupDescription: "동작 모드 및 서비스 설정:"
Name: "firewallrule"; Description: "Windows Defender 방화벽에 버전 정보 포함 예외 규칙({#MyAppName} {#MyAppVersion}) 자동 등록 (권장)"; GroupDescription: "네트워크 및 방화벽 보안 설정:"

[Files]
; Install all application binaries and dependencies unpacked in {app} (폴더 풀림 설치)
Source: "publish\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Documentation files
Source: "docs\PATCH_NOTES.md"; DestDir: "{app}\docs"; Flags: ignoreversion skipifsourcedoesntexist
Source: "docs\LICENSE.txt"; DestDir: "{app}\docs"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Auto-Register Windows Service if task selected (Valid Windows SCM sc.exe syntax with properly escaped quotes)
Filename: "{sys}\sc.exe"; Parameters: "create RoboBackupService binPath= ""\""{app}\{#MyAppExeName}\"" --service"" start= auto DisplayName= ""RoboBackup Studio Automation Service"""; Tasks: serviceinstall; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "description RoboBackupService ""RoboBackup Studio High Performance Robocopy Background Service"""; Tasks: serviceinstall; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "start RoboBackupService"; Tasks: serviceinstall; Flags: runhidden
; Auto-Register Windows Defender Firewall Rules with explicit Version Info in Rule Name (Inbound & Outbound)
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppName} {#MyAppVersion} (Inbound)"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any description=""{#MyAppName} {#MyAppVersion} High-Speed Robocopy Network Inbound Access"""; Tasks: firewallrule; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppName} {#MyAppVersion} (Outbound)"" dir=out action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any description=""{#MyAppName} {#MyAppVersion} High-Speed Robocopy Network Outbound Access"""; Tasks: firewallrule; Flags: runhidden
; Launch GUI App with Administrator privileges (runascurrentuser prevents Error 740 elevation failure)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent runascurrentuser

[UninstallRun]
Filename: "{sys}\sc.exe"; Parameters: "stop RoboBackupService"; Flags: runhidden; RunOnceId: "StopRoboBackupService"
Filename: "{sys}\sc.exe"; Parameters: "delete RoboBackupService"; Flags: runhidden; RunOnceId: "DeleteRoboBackupService"
; Remove Windows Defender Firewall Rules on Uninstall
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName} {#MyAppVersion} (Inbound)"""; Flags: runhidden; RunOnceId: "DelFirewallIn"
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName} {#MyAppVersion} (Outbound)"""; Flags: runhidden; RunOnceId: "DelFirewallOut"
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName} {#MyAppVersion}"""; Flags: runhidden; RunOnceId: "DelFirewallCommon"
