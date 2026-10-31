# RoboBackup Studio 순수 창작 6대 코어 DLL 아키텍처 및 세부 동작 원리 기술 명세서

> **문서 버전**: v2.17.3  
> **작성자 / 총괄 개발**: AhBiYout (블로그: [ahbiyoutvibe.blogspot.com](https://ahbiyoutvibe.blogspot.com/) | GitHub: [github.com/AhBiYout-all](https://github.com/AhBiYout-all))  
> **네임스페이스**: `RoboBackupStudio.Core`  
> **대상 플랫폼**: Windows 10 / 11 / Windows Server 2016~2025 (x64 / ARM64, .NET 8 / .NET Framework 4.8 Dual Runtime)

---

## 📌 1. 아키텍처 개요 및 창작 배경

RoboBackup Studio는 Windows 표준 CLI인 `Robocopy.exe`의 막강한 전송 엔진을 기반으로 동작하지만, 전통적인 Robocopy 단독 실행 환경에서는 다음과 같은 한계가 존재했습니다:
1. **사전 전송 바이트 및 시간 예측 불가**: 수백만 개의 파일 중 변경된 파일 수와 복사해야 할 총 바이트 수를 미리 알 수 없어, GUI의 0~100% 진행률 계산이 부정확함.
2. **독점 잠금 파일(Locked Files) 복제 실패**: 사용 중인 Office 문서, Outlook 메일함(`.pst`), 대용량 SQL DB(`.mdf/.ldf`), 가상 머신 디스크 파일 등이 Robocopy 실행 중 공유 위반(Sharing Violation, Error 32)으로 복사 누락됨.
3. **실시간 변경 감시의 이벤트 폭풍(Event Storm)**: 파일이 연속해서 쓰여지는 도중에 백업이 트리거되어 손상된 파일이 백업되거나 반복 실행으로 I/O가 고갈됨.
4. **네트워크 인증 자격 증명의 보안 취약성**: 배치 파일(`.bat`)이나 스케줄러 스크립트에 NAS 패스워드가 평문(Plaintext)으로 노출되어 보안 감사에 지적됨.
5. **다중 시점 백업 시 스토리지 용량 고갈**: 매일 전체 백업(Full Backup)을 유지할 경우 테라바이트급 스토리지가 수일 만에 고갈됨.
6. **네트워크 대역폭 독점 및 전송 지연**: 원격 NAS 백업 시 사내 네트워크 대역폭을 100% 점유하여 다른 업무용 트래픽이 마비됨.

이를 해결하기 위해 **외부 서드파티 상용 라이브러리에 일절 의존하지 않고, Windows OS 네이티브 커널 API(Win32 P/Invoke, VSS, DPAPI, NTFS File System)를 직접 바인딩하여 100% 순수 창작된 6대 코어 DLL 모듈(Core DLL Suite)**을 독자 구축하였습니다.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           RoboBackup Studio Architecture                          │
├───────────────────────────────────────────────────────────────────────────────────┤
│  [UI Layer]                                                                       │
│    ├─ C# WPF MVVM Presentation (MainWindow.xaml / MainViewModel.cs)              │
│    └─ React 18 TypeScript Preview Studio (CoreDllStudio.tsx / App.tsx)            │
├───────────────────────────────────────────────────────────────────────────────────┤
│  [6대 순수 창작 코어 DLL 엔진 (RoboBackupStudio.Core)]                               │
│    ├─ [1] RoboDiffEngine.cs        : 초고속 파일 차이 사전 분석 & 바이트 예측 프리플라이트    │
│    ├─ [2] RoboVssProvider.cs       : VSS 섀도 복사본 잠금 파일 무중단 복제 엔진         │
│    ├─ [3] RoboSyncWatch.cs         : 스마트 디바운스 큐 기반 실시간 자동 동기화 엔진      │
│    ├─ [4] RoboVault.cs             : Windows DPAPI & Credential Manager 제로-로그인 볼트   │
│    ├─ [5] RoboTimeMachine.cs       : NTFS 스마트 하드링크 기반 스냅샷 버전 보관소          │
│    └─ [6] RoboBandwidthThrottler.cs: 네트워크 대역폭 스로틀링 및 패킷 간격 조절(/IPG) 엔진  │
├───────────────────────────────────────────────────────────────────────────────────┤
│  [Windows OS Native Subsystem]                                                    │
│    ├─ Win32 Kernel32 / Advapi32 P/Invoke (CreateHardLinkW, CredReadW, CredWriteW) │
│    ├─ Windows Volume Shadow Copy Service (VSS / vssadmin.exe)                     │
│    ├─ Win32 FileSystemWatcher & ReadDirectoryChangesW Event Kernel                │
│    └─ Windows Data Protection API (DPAPI / CryptProtectData)                      │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📌 2. 6대 코어 DLL 모듈별 상세 동작 원리 및 명세

---

### [1] RoboDiffEngine.cs — 초고속 파일 차이 사전 분석 & 바이트 예측 엔진
- **역할**: Robocopy 실행 전 원본(Source) 디렉터리를 재귀 스캔하여 총 파일 수, 총 바이트 크기, 변경 여부를 미리 분석하고 GUI 진행률 바 및 ETA(남은 예상 시간) 산출의 기준 데이터를 제공합니다.
- **동작 원리**:
  1. `Directory.GetFiles` 및 다중 스레드 병렬 순회를 통해 파일 메타데이터(`FileInfo`, `Length`, `LastWriteTimeUtc`)를 고속 수집합니다.
  2. Robocopy 플래그 규칙(`/XF`, `/XD`, `/MIN`, `/MAX`, `/XO`, `/XN`)을 자체 내장된 필터 엔진으로 사전 평가하여 제외될 파일을 미리 걸러냅니다.
  3. 스캔 완료 즉시 `EffectiveTotalBytes`와 `EffectiveTotalFiles`를 산출하여 MainViewModel에 바인딩합니다.

---

### [2] RoboVssProvider.cs — VSS 섀도 복사본 잠금 파일 무중단 복제 엔진
- **역할**: 운영 체제나 다른 프로세스(SQL Server, Outlook, Excel 등)가 독점 잠금(Exclusive Lock)하고 있는 파일을 원본 중단 없이 백업합니다.
- **동작 원리**:
  1. `vssadmin` 및 COM Interop을 통해 대상 드라이브(예: `C:\`)의 볼륨 섀도 복사본(Shadow Copy Snapshot)을 백그라운드에 생성합니다.
  2. 생성된 심볼릭 링크 경로(`\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX\...`)를 Robocopy 소스 경로로 동적 치환합니다.
  3. 잠긴 파일들도 섀도 스냅쉽을 통해 읽기 전용으로 완벽하게 복제한 후, 백업 종료 직후 VSS 스냅샷을 안전하게 자동 해제(Cleanup)합니다.

---

### [3] RoboSyncWatch.cs — 스마트 디바운스 큐 기반 실시간 자동 동기화 엔진
- **역할**: 지정된 폴더의 파일 생성, 수정, 삭제 이벤트를 실시간 모니터링하되, 연속적인 디스크 쓰기(예: 대용량 압축 해제, 파일 대량 복사)로 인한 **이벤트 폭풍(Event Storm)**을 디바운스(Debounce) 알고리즘으로 흡수합니다.
- **동작 원리**:
  1. 표준 `FileSystemWatcher`를 기반으로 하되, 파일 변경 이벤트 발생 시 타이머를 재설정(Reset Timer)합니다.
  2. 지정된 안정화 시간(예: 2,000ms) 동안 추가 변경 이벤트가 발생하지 않을 때만 최종 동기화 트리거를 호출합니다.
  3. 중복 트리거를 방지하고 시스템 리소스 낭비를 원천 차단합니다.

---

### [4] RoboVault.cs — Windows DPAPI & Credential Manager 제로-로그인 볼트
- **역할**: 네트워크 공유 폴더(NAS, SMB) 접속에 필요한 계정 ID와 비밀번호를 디스크에 평문 저장하지 않고 Windows 자격 증명 관리자 및 DPAPI(Data Protection API)에 안전하게 암호화 보관합니다.
- **동작 원리**:
  1. `CredWriteW` Win32 API를 호출하여 Windows OS 고유의 자격 증명 저장소에 제네릭 자격 증명으로 등록합니다.
  2. 민감한 문자열은 `ProtectedData.Protect` (DPAPI)를 통해 현재 윈도우 로그인 사용자 자격 증명으로 암호화하여 메모리 및 설정 파일에 보호합니다.
  3. 백업 실행 시 `CredReadW`를 통해 안전하게 복호화하여 임시 세션 인증을 수행합니다.

---

### [5] RoboTimeMachine.cs — NTFS 스마트 하드링크 기반 스냅샷 버전 보관소
- **역할**: 매일 백업을 수행할 때 변경되지 않은 파일은 실제 용량을 중복 차지하지 않고 NTFS 하드링크(Hard Link)로 연결하고, 변경된 파일만 새로 복사하여 **테라바이트급 백업 스토리지 용량을 90% 이상 절감**합니다.
- **동작 원리**:
  1. 이전 백업본과 현재 백업본 간의 파일 해시/수정 시각을 비교합니다.
  2. 동일한 파일은 추가 디스크 공간을 소비하는 대신 `CreateHardLinkW` Win32 API를 호출하여 동일한 NTFS 클러스터를 가리키는 하드링크를 생성합니다.
  3. 사용자는 탐색기에서 마치 매일 전체 백업이 수행된 것처럼 완벽한 독립 폴더 구조를 조회할 수 있으면서도 실제 디스크 용량은 변경된 부분만 점유합니다.

---

### [6] RoboBandwidthThrottler.cs — 네트워크 대역폭 스로틀링 및 패킷 간격 조절 엔진 (New v2.13.0)
- **역할**: 원격 NAS 및 SMB 공유 폴더 백업 시 사내 네트워크 대역폭을 독점하여 다른 업무용 네트워크를 마비시키는 현상을 방지합니다.
- **동작 원리**:
  1. 최대 허용 대역폭(Mbps) 및 패킷 간격 밀리초(`/IPG:ms`)를 설정하여 전송 패킷의 흐름을 부드럽게 스로틀링합니다.
  2. 1초 단위 윈도우 버퍼를 모니터링하여 설정된 대역폭 초과 시 가벼운 비동기 지연(`Task.Delay` / `Thread.Sleep`)을 적용합니다.
  3. Robocopy 명령어 인자에 `/IPG:n` 옵션을 자동으로 조합하여 안정적인 네트워크 전송을 보장합니다.

---

## 📌 3. 빌드 및 배포 무결성 검증

1. **외부 종속성 완전 배제 (Zero External Dependency)**:
   - Nuget 외부 패키지를 일절 사용하지 않고 .NET 표준 BCL 및 Windows Native API만을 사용하여 빌드 호환성 문제가 원천 차단됩니다.
2. **`build.bat` 자동 빌드 지원**:
   - `build.bat` 실행 시 .NET SDK가 `RoboBackupStudio.csproj`를 단일 실행 파일(`RoboBackupStudio_v2.13.0.exe`)로 컴파일하고 Inno Setup 설치 패키지까지 단번에 빌드합니다.
3. **최소 실행 권한**:
   - VSS 스냅샷 생성(`RoboVssProvider`) 및 시스템 볼륨 하드링크 구성(`RoboTimeMachine`) 시에는 Windows 관리자 권한(UAC 승인)이 권장되며, 이는 `app.manifest`에 `<requestedExecutionLevel level="requireAdministrator" />`로 사전에 내장되어 있습니다.
