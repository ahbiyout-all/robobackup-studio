# Windows 작업 스케줄러(Task Scheduler) 연동 가이드 (v1.5.0)

RoboBackup Studio는 Windows OS 내장 **작업 스케줄러 (schtasks.exe)**를 완벽하게 활용하여 앱 실행 여부와 무관하게 백업 및 아카이브 정리 작업을 무인으로 자동 실행할 수 있습니다.
v1.5.0부터는 **사용자 지정 스케줄러 작업 이름(Task Name)**을 지원하여 다중 백업 및 정리 작업을 목적별로 분리 관리할 수 있습니다.

---

## 1. 정기 백업 스케줄러 CLI 자동 등록 (`schtasks.exe`)

관리자 권한의 CMD/PowerShell에서 생성되는 정기 백업 등록 명령어 구문입니다.

```cmd
schtasks /create /tn "RoboBackupStudio_AutoSync" /tr "cmd.exe /c robocopy \"C:\Source\" \"D:\Target\" /MIR /MT:16 /ZB /FFT /R:2 /W:5" /sc DAILY /st 03:00 /rl HIGHEST /f
```

- `/tn`: 작업 스케줄러 이름 (**사용자 지정 가능**, 예: `Finance_Nightly_Backup`)
- `/sc DAILY`: 매일 반복 실행 (`WEEKLY`, `MONTHLY`, `HOURLY` 지원)
- `/st 03:00`: 매일 새벽 3시 실행
- `/rl HIGHEST`: 최고 관리자 권한으로 실행 (UAC 프롬프트 무인 통과 및 SeBackupPrivilege 권한 획득)
- `/sd`: 시작 날짜 지정 (`yyyy/MM/dd`)
- `/f`: 기존 동일 이름 작업 덮어쓰기

---

## 2. 사용자 지정 스케줄러 명칭(Task Name) 다중 관리 (v1.5.0 신규)

기존에는 `RoboBackupStudio_AutoSync` 단일 이름으로만 등록되었으나, v1.5.0부터는 사용자가 원하는 작업 명칭을 자유롭게 지정할 수 있습니다.

### 활용 예시:
- **업무용 문서 백업**: `/tn "OfficeDocs_AutoSync"`
- **서버 야간 마이그레이션**: `/tn "Server_Migration_Nightly"`
- **D드라이브 아카이브 정리**: `/tn "DriveD_Monthly_Purge"`

스케줄러 탭에서 작업 명칭을 변경하면 현황 조회(`/query`) 및 작업 삭제(`/delete`)도 해당 작업 이름을 기준으로 정확하게 연동됩니다.

---

## 3. 오래된 파일 자동정리 스케줄러 등록 (Auto Cleanup Scheduler)

지정된 보관 기간(N일) 또는 용량 한계치(N GB)를 초과하는 백업/아카이브 파일을 Windows 작업 스케줄러가 정기적으로 무인 삭제하도록 예약합니다.

### 1) 기간 기준 자동정리 (예: 30일 경과 파일 매주 일요일 새벽 4시 자동 삭제):
```cmd
schtasks /create /tn "RoboBackupStudio_AutoCleanup" /tr "\"powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"\"Get-ChildItem -Path 'D:\Backup_Storage\Public_Documents' -Recurse -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force\"\"\"" /sc WEEKLY /sd 2026/08/15 /st 04:00 /rl HIGHEST /f
```

### 2) 용량 기준 자동정리 (예: 총 50GB 초과 시 오래된 파일부터 자동 정리):
```cmd
schtasks /create /tn "RoboBackupStudio_AutoCleanup" /tr "\"powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"\"$maxBytes=50GB; $files=Get-ChildItem -Path 'D:\Backup_Storage\Public_Documents' -Recurse -File | Sort-Object LastWriteTime; $total=($files | Measure-Object -Property Length -Sum).Sum; if($total -gt $maxBytes){ $purge=$total-$maxBytes; $acc=0; foreach($f in $files){ if($acc -ge $purge){break}; Remove-Item $f.FullName -Force; $acc+=$f.Length } }\"\"\"" /sc WEEKLY /sd 2026/08/15 /st 04:00 /rl HIGHEST /f
```

---

## 4. 작업 스케줄러 현황 조회 (`schtasks /query`)

등록된 스케줄 작업의 상태 및 실행 이력을 CLI로 즉시 조회할 수 있습니다.

```cmd
REM 백업 동기화 작업 조회 (지정한 이름으로 조회)
schtasks /query /tn "RoboBackupStudio_AutoSync" /fo LIST

REM 자동정리 작업 조회
schtasks /query /tn "RoboBackupStudio_AutoCleanup" /fo LIST
```

RoboBackup Studio 앱 내 **⏰ 작업 스케줄러** 탭 및 **🧹 오래된 파일 자동정리** 탭에서 **`📋 작업 스케줄러 등록 현황`** 카드 뷰를 통해 다음 실행 시간, 마지막 실행 결과, 활성 상태를 실시간으로 직접 확인하실 수 있습니다.

---

## 5. 작업 스케줄러 원클릭 삭제 (`schtasks /delete`)

스케줄 작업을 삭제하고자 할 때는 아래 명령어를 통해 강제 삭제할 수 있습니다.

```cmd
REM 백업 동기화 작업 삭제
schtasks /delete /tn "RoboBackupStudio_AutoSync" /f

REM 자동정리 작업 삭제
schtasks /delete /tn "RoboBackupStudio_AutoCleanup" /f
```

RoboBackup Studio UI에서 **`🗑️ 작업 스케줄 삭제`** 버튼을 누르면 지정된 작업 이름에 맞는 삭제 명령어가 백그라운드에서 즉시 수행됩니다.

---

## 6. XML 스키마 임포트 방법

1. RoboBackup Studio의 **예약 백업 관리** 탭에서 **Task Scheduler XML**을 복사합니다.
2. `RoboTask.xml` 파일로 저장합니다.
3. 윈도우 실행창(`Win + R`) ➔ `taskschd.msc` 입력 후 실행.
4. 작업 스케줄러 오른쪽 메뉴에서 **'작업 가져오기(Import Task...)'** 선택 후 XML 파일 등록.
