# C# WPF MVVM 개발 언어 및 프레임워크 추천서

윈도우(Windows) 환경에서 Robocopy 기반 전용 백업 앱을 구축할 때 **C#과 WPF(MVVM 패턴)**를 추천하는 기술적 이유와 아키텍처 분석 문서입니다.

---

## 1. 프레임워크 비교 분석

| 평가 항목 | C# .NET 8 + WPF (권장) | Electron (Web-Tech) | Python + PyQt |
| :--- | :--- | :--- | :--- |
| **RAM 메모리 사용량** | **~ 35 MB** | ~ 200 MB+ | ~ 70 MB |
| **앱 초기 실행 속도** | **< 0.1 초 (즉시 실행)** | 1.5 ~ 2.5 초 | ~ 0.8 초 |
| **실행 파일 크기** | **~ 15 MB (SingleFile)** | ~ 80 MB+ | ~ 35 MB |
| **Windows API/COM 연동**| **완벽 (Native Interop)** | 제한적 (Node.js IPC) | 중간 (pywin32 필요) |
| **프로세스 스트림 캡처** | **Native Async Pipeline** | ChildProcess Event | subprocess.Popen |

---

## 2. C# + WPF 선정이 최적인 5가지 이유

### ① 초경량 메모리 및 0.1초 즉시 구동 (High Performance)
- C# .NET 8/9 기반 단일 파일(Single File Publish)로 빌드하면 실행 메모리가 약 **30~40MB**에 불과합니다.
- 백그라운드 트레이 모드로 상시 대기하더라도 시스템 리소스(CPU/RAM) 점유율이 거의 없습니다.

### ② Robocopy.exe 프로세스 스트림 직결 (Native Process Piping)
- `System.Diagnostics.Process`의 `RedirectStandardOutput` 이벤트를 비동기로 수신하여, Robocopy의 퍼센트 진행률(`%`)과 전송 속도(`MB/s`)를 UI 프레임 드랍 없이 실시간 파싱합니다.

### ③ 윈도우 작업 스케줄러 (Task Scheduler) 완벽 연동
- Windows OS 내부의 `schtasks.exe` 및 `Microsoft.Win32.TaskScheduler` COM API를 직접 제어하여, 백업 앱이 꺼진 상태에서도 윈도우 OS 수준에서 무인 예약 백업이 작동합니다.

### ④ MVVM 패턴을 통한 UI와 비즈니스 로직의 완벽 분리
- **View (XAML)**: UI 디자인, 다크모드, 드래그 앤 드롭 이벤트를 전담.
- **ViewModel (C#)**: `INotifyPropertyChanged` 및 `RelayCommand`를 통해 데이터 바인딩.
- **RobocopyService (C#)**: 프로세스 실행, 정규식 로그 파싱, 스레드 안전성 보장.

### ⑤ 드래그 앤 드롭 및 윈도우 탐색기 통합
- WPF XAML의 `AllowDrop="True"` 이벤트 핸들러를 통해 탐색기 폴더를 UI로 직접 드래그하여 원본/대상 경로를 설정할 수 있습니다.
