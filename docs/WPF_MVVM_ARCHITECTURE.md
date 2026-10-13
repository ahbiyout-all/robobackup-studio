# WPF + MVVM Robocopy 백업 애플리케이션 아키텍처 및 구현 가이드

Windows 환경에서 Robocopy 유틸리티를 GUI 기반으로 래핑하고, **WPF + MVVM (Model-View-ViewModel)** 패턴으로 구축하는 전체 시스템 구조 및 핵심 코드 설계 문서입니다.

---

## 1. Robocopy 기반 백업 솔루션의 핵심 장점

1. **고성능 멀티스레드 복사**
   - Windows 내장 `robocopy.exe`는 `/MT:n` (1~128 스레드) 옵션을 지원하여, 일반 탐색기 파일 복사보다 대용량 및 다수 소형 파일 전송 속도가 최대 몇 배 이상 빠릅니다.
2. **정확하고 완벽한 1:1 동기화 (`/MIR`)**
   - 원본 변경 사항을 대상 폴더에 완벽 반영하며, 원본에서 삭제된 파일도 안전하게 정리하여 동기화 유지가 용이합니다.
3. **네트워크 및 오류 복원력 (`/ZB`, `/R`, `/W`)**
   - 네트워크 NAS 단락 시 자동 재시도 및 재개 가능 백업 모드(`/ZB`)를 지원하여 안정적인 파일 복사를 보장합니다.
4. **C# `System.Diagnostics.Process` 프로세스 자동화**
   - 백그라운드 콘솔 프로세스 비동기 파이프라인으로 백업 작업을 제어하여 UI 응답성을 유지합니다.

---

## 2. WPF + MVVM 구현 시 구조 및 역할 분담

| 구성 요소 | 역할 | 상세 설명 |
| :--- | :--- | :--- |
| **Model** | 데이터 및 설정을 표현하는 클래스 | `BackupJob`, `CopyOption`, `LogEntry` 등 경로, 옵션, 로그 상태를 관리 |
| **View (XAML)** | 사용자 인터페이스 | `TextBox`, `CheckBox`, `Button`, `ListView`를 통해 사용자 입력을 받고 ViewModel과 바인딩 |
| **ViewModel** | UI와 백엔드 로직 연결 | `ICommand` (RelayCommand)로 동작 제어, `ObservableCollection<string>`으로 실시간 로그 바인딩 |
| **Service** | Robocopy 프로세스 비동기 제어 | `Process.Start()`, `StandardOutput.ReadLineAsync()` 스트림 파싱 담당 |

### 🧩 메커니즘 상세
- **명령 바인딩 (Command Binding)**: "복사 시작", "복사 중지", "로그 파일 저장", "로그 청소" 등 버튼 동작을 ViewModel의 `ICommand`로 연결합니다.
- **실시간 로그 스트리밍**: Robocopy의 콘솔 출력을 비동기로 읽어 `ObservableCollection<string>`에 추가하고 UI에 반영합니다.
- **설정 저장 (Persistence)**: 사용자 지정 소스/대상 경로 및 옵션을 `Settings.json` 파일이나 `Properties.Settings`로 자동 저장 및 복원합니다.
- **비동기 처리 (`async/await`)**: `Process.StandardOutput.ReadLineAsync()`를 통해 백업 중에도 UI 멈춤(Freezing)이 없습니다.

---

## 3. C# WPF MVVM 구현 예시 코드

```csharp
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Input;

namespace RoboBackupStudio.ViewModels
{
    public class RobocopyViewModel : ViewModelBase
    {
        private string _sourcePath = @"C:\Source";
        private string _destinationPath = @"D:\Target";
        private string _options = "/MIR /MT:16 /ZB /FFT /R:2 /W:5";
        private bool _isBusy;

        public string SourcePath
        {
            get => _sourcePath;
            set { _sourcePath = value; OnPropertyChanged(); }
        }

        public string DestinationPath
        {
            get => _destinationPath;
            set { _destinationPath = value; OnPropertyChanged(); }
        }

        public string Options
        {
            get => _options;
            set { _options = value; OnPropertyChanged(); }
        }

        public bool IsBusy
        {
            get => _isBusy;
            set { _isBusy = value; OnPropertyChanged(); }
        }

        public ObservableCollection<string> Logs { get; } = new ObservableCollection<string>();

        public ICommand RunCommand { get; }
        public ICommand ClearLogCommand { get; }

        public RobocopyViewModel()
        {
            RunCommand = new RelayCommand(async () => await RunRobocopyAsync(), () => !IsBusy);
            ClearLogCommand = new RelayCommand(() => Logs.Clear());
        }

        private async Task RunRobocopyAsync()
        {
            if (string.IsNullOrWhiteSpace(SourcePath) || string.IsNullOrWhiteSpace(DestinationPath))
            {
                Logs.Add("[경고] 원본 및 대상 경로를 올바르게 입력해주세요.");
                return;
            }

            IsBusy = true;
            Logs.Add($"[{DateTime.Now:HH:mm:ss}] Robocopy 백업 시작...");

            // ⚠️ 경로 공백 예외 처리를 위해 쌍따옴표(" ")로 감싸기
            string safeSource = $"\"{SourcePath.TrimEnd('\\')}\"";
            string safeDest = $"\"{DestinationPath.TrimEnd('\\')}\"";
            string arguments = $"{safeSource} {safeDest} {Options}";

            try
            {
                var processInfo = new ProcessStartInfo
                {
                    FileName = "robocopy.exe",
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    StandardOutputEncoding = System.Text.Encoding.Default
                };

                using (var process = new Process { StartInfo = processInfo })
                {
                    process.Start();

                    while (!process.StandardOutput.EndOfStream)
                    {
                        string line = await process.StandardOutput.ReadLineAsync();
                        if (!string.IsNullOrEmpty(line))
                        {
                            // UI 스레드 보호 및 로그 출력
                            App.Current.Dispatcher.Invoke(() =>
                            {
                                Logs.Add(line);

                                // ⚠️ 로그 크기 과다 방지: 최대 1,000줄 유지 후 정리
                                if (Logs.Count > 1000)
                                {
                                    Logs.RemoveAt(0);
                                }
                            });
                        }
                    }

                    await Task.Run(() => process.WaitForExit());
                    Logs.Add($"[{DateTime.Now:HH:mm:ss}] 백업 작업 완료. Exit Code: {process.ExitCode}");
                }
            }
            catch (Exception ex)
            {
                Logs.Add($"[오류 발생] {ex.Message}");
            }
            finally
            {
                IsBusy = false;
            }
        }
    }
}
```

---

## 4. 구현 완료된 고급 기능 및 아키텍처 특성 (v1.2.0)

1. **오래된 파일 자동 정리 엔진 (Auto Cleanup Engine)**
   - `DirectoryInfo.GetFiles()` 수집 후 `LastWriteTime` 기준으로 오름차순 정렬(오래된 파일 순).
   - **기간 기준 (Days)**: `DateTime.Now.AddDays(-Days)` 보다 이전 파일 추출.
   - **용량 기준 (Size)**: 총 누적 파일 용량이 목표 GB 초과 시, 오래된 파일부터 순차적으로 차감 목록에 추가.
   - **미리보기 스캔 (`ScanCleanupFilesCommand`) & 안전 삭제 (`ExecuteCleanupCommand`)**로 사용자 실수 방지.

2. **윈도우 작업 스케줄러 상태 조회 및 원클릭 삭제**
   - `schtasks /query /tn "RoboBackupStudio_AutoSync" /fo LIST` 로 현재 등록 상태 비동기 파싱.
   - `schtasks /delete /tn "RoboBackupStudio_AutoSync" /f` 를 통해 UI 상에서 즉시 스케줄 제거.
   - `DatePicker` 및 `ComboBox` (시/분)를 통한 직관적인 시작 시점 연동.

3. **UAC Elevation & `/ZB` 백업 권한 에러 자동 감지**
   - `/ZB` 사용 시 `SeBackupPrivilege` 권한이 없으면 Robocopy Exit Code 16 리턴.
   - 이를 자동 감지하여 `/ZB` 해제 후 자동 재시도 팝업 제공 및 `RestartAsAdminCommand`로 `Verb = "runas"` 재시작 지원.
   - `app.manifest`에 `requireAdministrator` 명시하여 실행 파일 클릭 시 UAC 승인 창 자동 요청.

---

## 5. ⚠️ 주요 주의사항 및 해결 방안

### ① 관리자 권한 (UAC Elevation) 처리
- `/ZB` (재개 가능 및 백업 권한) 옵션 사용 시 윈도우 관리자 권한이 필수적입니다.
- **해결책**: Visual Studio 프로젝트 manifest (`app.manifest`) 설정에서 `<requestedExecutionLevel level="requireAdministrator" />`로 설정하고, `RoboBackupStudio.csproj`에 `<ApplicationManifest>app.manifest</ApplicationManifest>`를 포함합니다.

### ② 경로 공백 처리 (`" "`)
- 경로에 공백이 포함된 경우(`C:\Program Files\...`) Robocopy 인수가 분할되는 문제를 방지해야 합니다.
- **해결책**: 소스 및 대상 경로를 항상 `"{Path}"` 형태의 쌍따옴표로 감싸서 전달합니다.

### ③ 메모리 누수 방지 및 로그 자동 정리 (Log Buffer Management)
- 대용량 파일 수백만 개 복사 시 `ObservableCollection` 메모리가 계속 증가할 수 있습니다.
- **해결책**: UI 표시 로그의 최대 줄 수(예: 2,000줄)를 제한하고, 전체 로그는 디스크 파일(`robocopy_backup.log`)로 직접 스트리밍 저장합니다.
