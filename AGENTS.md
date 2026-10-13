# RoboBackup Studio - 개발 가이드라인 및 영구 에이전트 지침 (AGENTS.md)

## 📌 1. 자동 버전 관리 및 패치노트 기록 규칙 (Version Control & Patch Notes Directive)

- **특이점 감지 시 자동 패치노트 기록**:
  - 신규 기능 추가, 아키텍처 변경, 플래그/옵션 확장, 중요 버그 수정, 파일 구조 개편 등 유의미한 코드 수정이 발생할 경우 **반드시 `docs/PATCH_NOTES.md` 상단에 새 버전(`[vX.Y.Z] - YYYY-MM-DD`)과 상세 변경 내역을 자동으로 기록**합니다.
- **버전 메타데이터 일괄 동기화 체크리스트**:
  1. `docs/PATCH_NOTES.md`: 최신 버전 섹션 추가 및 세부 구현 명세 기록
  2. `RoboBackupStudio.csproj`: `<Version>`, `<AssemblyVersion>`, `<FileVersion>` 일괄 갱신
  3. `build.bat`: 버전 기본값 및 `PATCH_NOTES.md` 파싱 기준 확인
  4. `MainWindow.xaml`: 타이틀, 헤더 배지, 푸터의 버전 텍스트 동기화
  5. `ViewModels/MainViewModel.cs`: 주석 및 버전 표기 동기화
  6. `src/utils/robocopy.ts`: C# WPF MVVM 템플릿 내 버전 정보 동기화

---

## 📌 2. 데스크탑 앱(C# WPF MVVM) 및 React 프리뷰 듀얼 동기화 절대 원칙 (Desktop-First Dual Architecture Sync)

- **🚨 데스크탑 앱 100% 필수 적용 (Desktop-First Implementation)**:
  - 사용자의 모든 요구사항과 신규 기능(옵션, 플래그, 마법사, 스케줄러, 서비스 연동, 테마 등)은 웹 화면(React)에만 머물러서는 안 되며, **반드시 실제 Windows 데스크탑 앱 파일(`MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Core/`, `Services/`, `App.xaml` 등)에 실질적인 C# 비즈니스 로직과 XAML UI 바인딩으로 동시에 100% 구현**되어야 합니다.
- **단순 웹 UI 모의(Mock) 금지**:
  - 웹과 C# WPF 데스크탑 앱 간 기능 불일치가 발생하지 않도록 비즈니스 로직, 상태 관리, 이벤트 커맨드를 상호 완전 동기화합니다.
- **`build.bat` 컴파일 무결성 보장**:
  - 사용자가 Windows 환경에서 `build.bat`를 실행했을 때 즉시 단일 독립 실행 파일(`publish/RoboBackupStudio_vX.Y.Z.exe`)로 에러 없이 완벽히 컴파일되어야 합니다.

---

## 📌 3. 개발자 및 프로젝트 정보

- **개발자**: AhBiYout
- **블로그**: ahbivibelog.blogspot.com
- **프로젝트 명**: RoboBackup Studio - High Performance Robocopy GUI & C# WPF Generator
