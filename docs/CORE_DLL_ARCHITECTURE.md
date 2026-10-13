# RoboBackup Studio 순수 창작 5대 코어 DLL 아키텍처 및 세부 동작 원리 기술 명세서

> **문서 버전**: v2.12.4  
> **작성자 / 총괄 개발**: AhBiYout (블로그: [ahbivibelog.blogspot.com](https://ahbivibelog.blogspot.com/))  
> **회사**: CISNET ([www.cisnet.co.kr](http://www.cisnet.co.kr/))  
> **네임스페이스**: `RoboBackupStudio.Core`  
> **대상 플랫폼**: Windows 10 / 11 / Windows Server 2016~2025 (x64 / ARM64, .NET 8 / .NET Framework 4.8 Dual Runtime)

---

## 📌 1. 아키텍처 개요 및 창작 배경

RoboBackup Studio는 Windows 표준 CLI인 `Robocopy.exe`의 막강한 전송 엔진을 기반으로 동작하지만, 전통적인 Robocopy 단독 실행 환경에서는 다음과 같은 치명적인 한계가 존재했습니다:
1. **사전 전송 바이트 및 시간 예측 불가**: 수백만 개의 파일 중 변경된 파일 수와 복사해야 할 총 바이트 수를 미리 알 수 없어, 실제 GUI의 0~100% 진행률 계산이 부정확함.
2. **독점 잠금 파일(Locked Files) 복제 실패**: 사용 중인 Office 문서, Outlook 메일함(`.pst`), 대용량 SQL DB(`.mdf/.ldf`), 가상 머신 디스크 파일 등이 Robocopy 실행 중 공유 위반(Sharing Violation, Error 32)으로 복사 누락됨.
3. **실시간 변경 감시의 이벤트 폭풍(Event Storm)**: 파일이 연속해서 쓰여지는 도중에 백업이 트리거되어 손상된 파일이 백업되거나 반복 실행으로 I/O가 고갈됨.
4. **네트워크 인증 자격 증명의 보안 취약성**: 배치 파일(`.bat`)이나 스케줄러 스크립트에 NAS 패스워드가 평문(Plaintext)으로 노출되어 보안 감사에 지적됨.
5. **다중 시점 백업 시 스토리지 용량 고갈**: 매일 전체 백업(Full Backup)을 유지할 경우 테라바이트급 스토리지가 수일 만에 고갈됨.

이를 해결하기 위해 **외부 서드파티 상용 라이브러리에 일절 의존하지 않고, Windows OS 네이티브 커널 API(Win32 P/Invoke, VSS, DPAPI, NTFS File System)를 직접 바인딩하여 100% 순수 창작된 5대 코어 DLL 모듈(Core DLL Suite)**을 독자 구축하였습니다.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           RoboBackup Studio Architecture                          │
├───────────────────────────────────────────────────────────────────────────────────┤
│  [UI Layer]                                                                       │
│    ├─ C# WPF MVVM Presentation (MainWindow.xaml / MainViewModel.cs)              │
│    └─ React 18 TypeScript Preview Studio (CoreDllStudio.tsx / App.tsx)            │
├───────────────────────────────────────────────────────────────────────────────────┤
│  [5대 순수 창작 코어 DLL 엔진 (RoboBackupStudio.Core)]                               │
│    ├─ [1] RoboDiffEngine.cs    : 초고속 파일 차이 사전 분석 & 바이트 예측 프리플라이트    │
│    ├─ [2] RoboVssProvider.cs   : VSS 섀도 복사본 잠금 파일 무중단 복제 엔진         │
│    ├─ [3] RoboSyncWatch.cs     : 스마트 디바운스 큐 기반 실시간 자동 동기화 엔진      │
│    ├─ [4] RoboVault.cs         : Windows DPAPI & Credential Manager 제로-로그인 볼트   │
│    └─ [5] RoboTimeMachine.cs   : NTFS 스마트 하드링크 기반 스냅샷 버전 보관소          │
├───────────────────────────────────────────────────────────────────────────────────┤
│  [Windows OS Native Subsystem]                                                    │
│    ├─ Win32 Kernel32 / Advapi32 P/Invoke (CreateHardLinkW, CredReadW, CredWriteW) │
│    ├─ Windows Volume Shadow Copy Service (VSS / vssadmin.exe)                     │
│    ├─ Win32 FileSystemWatcher & ReadDirectoryChangesW Event Kernel                │
│    └─ Robocopy.exe Native Binary Subprocess (/MIR /MT /ZB /FFT /NP /R:1 /W:1)     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 2. 5대 코어 DLL 모듈별 상세 기술 명세 및 동작 원리

---

### 1️⃣ `RoboDiffEngine.cs` - 초고속 사전 차이 분석 & 바이트 예측 프리플라이트

#### (1) 핵심 역할 및 설계 목적
Robocopy 실행 전, 원본(Source)과 대상(Target) 디렉터리의 구조를 **비동기 병렬 스캔(Parallel Directory Crawling)**하여 신규 파일, 변경된 파일, 동일한 파일(스킵 대상), 대상에만 존재하는 파일(삭제 대상)을 단 1~2초 만에 색인하고 **실제 전송이 필요한 정확한 바이트 수**를 사전에 산출합니다.

#### (2) 내부 동작 원리 및 알고리즘
1. **고속 메타데이터 트리 수집 (`ScanDirectoryFast`)**:
   - `Directory.EnumerateFileSystemEntries` 대신 파일 시스템의 고속 메타데이터 검색 구조를 적용하여 파일 이름, 크기(`Length`), 최종 수정 일시(`LastWriteTime`)를 키-값 쌍(`Dictionary<string, FileMeta>`)으로 메모리에 매핑합니다.
   - 대소문자를 구분하지 않는 Windows 파일 시스템 규격에 맞춰 `StringComparer.OrdinalIgnoreCase`를 적용합니다.
2. **2초 타임스탬프 허용 오차 보정 (FAT/NTFS 상호 정규화)**:
   - FAT32/exFAT(2초 단위 타임스탬프)와 NTFS(100나노초 단위) 간의 백업 시 발생하는 미세 시간 불일치를 해결하기 위해 `Math.Abs((src.LastWriteTime - tgt.LastWriteTime).TotalSeconds) > 2` 기준을 채택하여 불필요한 재전송을 완벽히 방지합니다.
3. **다중 스레드 병렬 비교 (`Parallel.ForEach`)**:
   - `ConcurrentBag<DiffItem>`에 수집 결과를 스레드-안전(Thread-Safe)하게 병합하여 멀티코어 CPU 자원을 100% 활용합니다.
4. **전송량 집계 및 리포팅 (`DiffReport`)**:
   - `TotalBytesToTransfer = Items.Where(i => i.ChangeType == New || Modified).Sum(i => i.SourceSize)` 공식을 통해 Robocopy 실제 작업 시 표시할 **정확한 전송량(GB/MB)**을 사전에 확정합니다.

#### (3) 주요 클래스 및 API 정의
```csharp
public class RoboDiffEngine
{
    public enum DiffChangeType { New, Modified, Identical, Extra }
    
    public class DiffItem {
        public string RelativePath { get; set; }
        public DiffChangeType ChangeType { get; set; }
        public long SourceSize { get; set; }
        public long TargetSize { get; set; }
        public DateTime? SourceTime { get; set; }
        public DateTime? TargetTime { get; set; }
        public string StatusBadge { get; }
    }

    public class DiffReport {
        public int TotalSourceFiles { get; set; }
        public int TotalTargetFiles { get; set; }
        public int NewFilesCount { get; set; }
        public int ModifiedFilesCount { get; set; }
        public int IdenticalFilesCount { get; set; }
        public int ExtraFilesCount { get; set; }
        public long TotalBytesToTransfer { get; set; }
        public List<DiffItem> Items { get; set; }
    }

    public Task<DiffReport> AnalyzeDiffAsync(string sourceDir, string targetDir, CancellationToken cancellationToken, IProgress<string>? progress);
}
```

---

### 2️⃣ `RoboVssProvider.cs` - Windows 볼륨 섀도 복사본(VSS) 스냅샷 프로바이더

#### (1) 핵심 역할 및 설계 목적
일반적인 파일 복사 유틸리티는 직원이 열어두고 작업 중인 Microsoft Excel/Word 문서, Outlook의 개인 폴더 파일(`.pst`), 실행 중인 SQL Server 데이터베이스 파일(`.mdf`, `.ldf`), Hyper-V 가상 머신 가상 디스크(`.vhdx`)에 접근할 때 **"다른 프로세스가 파일을 사용 중이므로 프로세스가 파일에 액세스할 수 없습니다(Sharing Violation)"** 에러가 발생하며 백업에 실패합니다.  
`RoboVssProvider`는 Windows의 **VSS(Volume Shadow Copy Service)**를 제어하여 특정 시점(Point-in-Time)의 볼륨 스냅샷을 즉각 생성하고, Robocopy가 해당 잠금 없는 섀도 볼륨에서 100% 무결점 복제를 수행할 수 있도록 지원합니다.

#### (2) 내부 동작 원리 및 알고리즘
1. **스냅샷 볼륨 생성 (`CreateSnapshotAsync`)**:
   - 원본 드라이브(예: `C:`)에 대해 백그라운드 관리자 권한 프로세스로 `vssadmin create shadow /for=C:`를 실행합니다.
   - 표준 출력 스트림을 실시간 정규표현식으로 파싱하여 Windows 글로벌 루트 주소를 캡처합니다:
     ```
     Shadow Copy Volume Name: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
     Shadow Copy ID: {b5c1a742-88d4-48f5-932b-9860b29ce37f}
     ```
2. **동적 경로 변환 (`GetVssPath`)**:
   - 사용자가 요청한 원본 경로(예: `C:\Database\HR_Data.mdf`)의 드라이브 루트를 감지하여 VSS 섀도 볼륨 주소로 실시간 치환합니다:
     `\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Database\HR_Data.mdf`
   - 이 가상 경로는 커널 레벨에서 파일 쓰기가 완전히 동결된 읽기 전용 스냅샷이므로, 실제 애플리케이션이 원본 파일에 락(Lock)을 걸고 있더라도 **100% 충돌 없이 고속 복사**됩니다.
3. **자원 정리 및 자동 환수 (`ReleaseSnapshotAsync` / `IDisposable`)**:
   - Robocopy 백업이 완료되거나 오류 발생 시, `vssadmin delete shadows /shadow={ShadowId} /quiet`를 안전하게 실행하여 스토리지의 임시 Copy-On-Write 영역을 즉시 해제합니다.
   - 객체 소멸 시 미반환 스냅샷이 남지 않도록 `IDisposable` 패턴을 완벽히 준수합니다.

#### (3) 주요 클래스 및 API 정의
```csharp
public class RoboVssProvider : IDisposable
{
    public class VssSnapshotInfo {
        public string SourceDrive { get; set; }
        public string ShadowCopyVolume { get; set; } // \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX
        public string ShadowId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive => !string.IsNullOrEmpty(ShadowCopyVolume);
    }

    public Task<VssSnapshotInfo> CreateSnapshotAsync(string driveLetter);
    public string GetVssPath(string originalFullPath);
    public Task ReleaseSnapshotAsync();
    public void Dispose();
}
```

---

### 3️⃣ `RoboSyncWatch.cs` - 스마트 디바운스 큐 기반 실시간 자동 동기화 감시 엔진

#### (1) 핵심 역할 및 설계 목적
Robocopy의 내장 감시 플래그인 `/MON:n`과 `/MOT:m`은 단순 시간/변경 수 카운터에 의존하여, 대용량 파일이 아직 디스크에 쓰여지는 도중에 복사를 시작하여 파일이 깨지거나, 수천 개의 파일이 순차적으로 생성될 때 무한 루프로 복사 프로세스가 중복 기동되는 결함이 있습니다.  
`RoboSyncWatch`는 **스마트 디바운스(Adaptive Debounce) 완충 큐**를 통해 파일 수정이 완전히 멈춘 '조용한 상태(Quiet Period)'를 감지하여 안전하고 최적화된 시점에 Robocopy를 트리거합니다.

#### (2) 내부 동작 원리 및 알고리즘
1. **OS 커널 이벤트 감시 (`FileSystemWatcher`)**:
   - `NotifyFilters.FileName | NotifyFilters.LastWrite | NotifyFilters.Size`를 감시 필터로 설정하고 64KB의 대용량 내부 버퍼(`InternalBufferSize = 65536`)를 할당하여 고속 I/O 환경에서도 이벤트 유실(Buffer Overflow)을 차단합니다.
2. **노이즈 및 임시 파일 자동 필터링**:
   - Office 임시 파일(`~$*.docx`), 다운로드 임시 파일(`.crdownload`, `.part`), 일반 임시 파일(`.tmp`)을 실시간 패턴 매칭으로 즉시 제외하여 리소스 낭비를 방지합니다.
3. **적응형 디바운스 타이머 (`_debounceTimer`)**:
   - 파일 변경 이벤트가 들어올 때마다 대기 큐(`ConcurrentDictionary<string, WatchEventItem>`)에 적재하고, 기존에 돌고 있던 디바운스 타이머를 리셋(Reset)합니다.
   - 사용자가 지정한 유예 시간(기본 5초, 1초~60초 설정 가능) 동안 추가적인 파일 변경이 발생하지 않으면, 파일 쓰기가 완전히 완료된 것으로 판정하여 `SyncTriggered` 이벤트를 발생시키고 수집된 변경 배치 목록을 단 한 번의 Robocopy 백업 세션으로 전송합니다.

#### (3) 주요 클래스 및 API 정의
```csharp
public class RoboSyncWatch : IDisposable
{
    public class WatchEventItem {
        public DateTime Timestamp { get; set; }
        public string ChangeType { get; set; } // Created, Changed, Deleted, Renamed
        public string FullPath { get; set; }
        public string RelativePath { get; set; }
    }

    public event EventHandler<WatchEventItem>? FileActivityDetected;
    public event EventHandler<IReadOnlyList<WatchEventItem>>? SyncTriggered;

    public void Start(string directoryPath, int debounceSeconds = 5);
    public void Stop();
    public void Dispose();
}
```

---

### 4️⃣ `RoboVault.cs` - DPAPI 기반 제로-로그인 NAS 보안 볼트

#### (1) 핵심 역할 및 설계 목적
사내 NAS(Synology, QNAP)나 Windows 파일 서버로 백업할 때, 자동화 스크립트나 배치 파일에 계정과 비밀번호를 평문(Plaintext)으로 하드코딩해두는 것은 중대한 정보보안 감사 지적 사항입니다.  
`RoboVault`는 Windows 커널 보안 하위 시스템인 **DPAPI (Data Protection API)** 및 **Windows Credential Manager**의 네이티브 P/Invoke 인터페이스를 직접 호출하여, 자격 증명을 운영체제 보호 메모리 및 로컬 머신 암호화 영역에 안전하게 저장하고 무인 백업 세션을 지원합니다.

#### (2) 내부 동작 원리 및 보안 메커니즘
1. **Windows Credential Manager 네이티브 P/Invoke**:
   - `Advapi32.dll`의 `CredWriteW`, `CredReadW`, `CredDeleteW`, `CredFree` 함수를 선언하여 Windows 제어판의 "자격 증명 관리자"와 100% 네이티브로 연동됩니다.
2. **제로-로그인 및 메모리 즉시 소거 (ZeroMemory)**:
   - 비밀번호 문자열을 바이트 배열로 변환하여 언매니지드 메모리(`Marshal.AllocHGlobal`)에 복사한 후 구조체를 전달합니다.
   - API 호출 직후 `finally` 블록에서 `Array.Clear(passBytes, 0, passBytes.Length)` 및 `Marshal.FreeHGlobal`을 즉각 실행하여, 메모리 덤프나 디버거 공격에도 비밀번호 흔적이 남지 않도록 차단합니다.
3. **UNC 경로 자동 정규화**:
   - `\\192.168.1.100\Backup`과 같은 UNC 경로에서 서버 호스트명 또는 IP(`192.168.1.100`)를 지능적으로 분리 정규화하여 Windows 인증 체계와 완벽히 호환되도록 만듭니다.

#### (3) 주요 클래스 및 API 정의
```csharp
public class RoboVault
{
    public class VaultCredentialInfo {
        public string Target { get; set; }
        public string UserName { get; set; }
        public DateTime LastModified { get; set; }
        public bool IsEncryptedWithDpapi { get; set; }
    }

    public static bool SaveCredential(string target, string userName, string password);
    public static bool TryGetCredential(string target, out string userName, out string password);
    public static bool DeleteCredential(string target);
    public static string NormalizeTarget(string target);
}
```

---

### 5️⃣ `RoboTimeMachine.cs` - NTFS 스마트 하드링크 기반 타임머신 버전 보관소

#### (1) 핵심 역할 및 설계 목적
전체 백업(Full Backup)을 매일 보관하면 스토리지 용량이 급격히 고갈되고, 증분 백업(Incremental Backup)은 복원 시 과거의 모든 백업본을 순차적으로 병합해야 하는 번거로움이 있습니다.  
`RoboTimeMachine`은 macOS의 Apple Time Machine 원리를 Windows NTFS 파일 시스템에 이식한 엔진입니다. **Win32 `CreateHardLinkW` 네이티브 API**를 호출하여, 직전 스냅샷과 내용 및 타임스탬프가 동일한 파일은 추가 물리 디스크 공간을 전혀 소모하지 않는 **NTFS 하드링크(HardLink)**로 연결하고, 오직 신규/수정된 파일만 실물 복사합니다.

#### (2) 내부 동작 원리 및 공간 절감 효과
1. **스냅샷 폴더 타임스탬프 생성**:
   - 백업 대상 저장소 루트 하위에 `2026-09-05_040000`, `2026-09-06_040000` 형태의 완전 독립된 디렉터리를 생성합니다.
2. **이전 최신 스냅샷 자동 탐색 및 차등 판별**:
   - 저장소 내에서 직전에 생성된 스냅샷 폴더를 역순으로 조회하여 기준선(Baseline)을 식별합니다.
3. **NTFS 하드링크 생성 (`Kernel32.dll` -> `CreateHardLinkW`)**:
   - 원본 파일의 크기와 최종 수정 시간이 이전 스냅샷의 해당 파일과 정확히 일치하면, 파일 데이터를 새로 쓰는 대신 `CreateHardLink(destFile, prevFile, IntPtr.Zero)`를 호출하여 동일한 NTFS MFT(Master File Table) 데이터 클러스터를 가리키는 링크를 생성합니다.
   - 이 하드링크 파일은 **디스크 물리 사용량 0바이트**를 차지하면서도 파일 탐색기에서는 완전한 원본 파일로 표시됩니다.
4. **결과 및 공간 절감율 산출**:
   - 가상 전체 용량(`VirtualSizeBytes`) 대비 실제 기록된 물리 용량(`ActualPhysicalBytes`)을 계산하여 **80%~95% 이상의 스토리지 절감율**을 달성합니다.
   - 사용자는 복원 시 어떤 복잡한 복원 유틸리티도 필요 없이, 원하는 날짜의 폴더로 이동하여 일반 폴더처럼 즉시 파일을 열람하거나 복원할 수 있습니다.

#### (3) 주요 클래스 및 API 정의
```csharp
public class RoboTimeMachine
{
    public class SnapshotResult {
        public string SnapshotPath { get; set; }
        public DateTime Timestamp { get; set; }
        public int TotalFilesCount { get; set; }
        public int HardLinkedFilesCount { get; set; }
        public int NewlyCopiedFilesCount { get; set; }
        public long VirtualSizeBytes { get; set; }
        public long ActualPhysicalBytes { get; set; }
        public double SpaceSavedPercent { get; }
        public TimeSpan Elapsed { get; set; }
    }

    public Task<SnapshotResult> CreateTimeMachineSnapshotAsync(
        string sourceDir, 
        string targetRootRepo, 
        CancellationToken cancellationToken, 
        IProgress<string>? progress);

    public List<string> GetExistingSnapshots(string targetRootRepo);
}
```

---

## 🖥️ 3. C# WPF MVVM 및 React 프리뷰 듀얼 연동 구조

| 기능 항목 | C# WPF MVVM 바인딩 | React TypeScript 컴포넌트 | 비고 |
| :--- | :--- | :--- | :--- |
| **코어 DLL 관리 탭** | `MainWindow.xaml` -> `🧩 코어 DLL 스튜디오` | `src/components/CoreDllStudio.tsx` | 5개 모듈 통합 제어판 |
| **사전 차이 분석기** | `MainViewModel.RunDiffScanCommand` | `CoreDllStudio` -> "초고속 차이 분석기" | `RoboDiffEngine` 연동 |
| **VSS 섀도 스냅샷** | `MainViewModel.CreateVssSnapshotCommand` | `CoreDllStudio` -> "VSS 섀도 복사본" | `RoboVssProvider` 연동 |
| **실시간 감시 엔진** | `MainViewModel.ToggleSyncWatchCommand` | `CoreDllStudio` -> "스마트 큐 실시간 감시" | `RoboSyncWatch` 연동 |
| **보안 자격 증명 볼트**| `MainViewModel.SaveVaultCredentialCommand` | `CoreDllStudio` -> "DPAPI 제로-로그인 볼트" | `RoboVault` 연동 |
| **타임머신 버전 보관** | `MainViewModel.CreateTimeMachineSnapshotCommand` | `CoreDllStudio` -> "NTFS 타임머신 스냅샷" | `RoboTimeMachine` 연동 |

---

## 🛠️ 4. 컴파일 무결성 및 시스템 요구사항

1. **외부 종속성 완전 배제 (Zero External Dependency)**:
   - Nuget 외부 패키지를 일절 사용하지 않고 .NET 표준 BCL(Base Class Library) 및 Windows Native API만을 사용하여, 빌드 호환성 문제가 원천 차단됩니다.
2. **`build.bat` 자동 빌드 지원**:
   - `build.bat` 실행 시 .NET SDK가 `RoboBackupStudio.csproj`를 단일 실행 파일(`RoboBackupStudio_v2.12.4.exe`)로 컴파일하고 Inno Setup 설치 패키지까지 단번에 빌드합니다.
3. **최소 실행 권한**:
   - VSS 스냅샷 생성(`RoboVssProvider`) 및 시스템 볼륨 하드링크 구성(`RoboTimeMachine`) 시에는 Windows 관리자 권한(UAC 승인)이 권장되며, 이는 `app.manifest`에 `<requestedExecutionLevel level="requireAdministrator" />`로 사전에 내장되어 있습니다.

---

### 📌 요약 및 문의
본 순수 창작 5대 코어 DLL은 RoboBackup Studio의 고유 지적 자산이며, 고성능 엔터프라이즈 환경에서의 무중단·초고속·초절약 파일 백업 인프라 구축을 완벽히 지원합니다.  
기술 문의 및 라이선스 관련 사항은 개발자 블로그([ahbivibelog.blogspot.com](https://ahbivibelog.blogspot.com/)) 또는 회사 공식 웹사이트([www.cisnet.co.kr](http://www.cisnet.co.kr/))를 참조하십시오.
