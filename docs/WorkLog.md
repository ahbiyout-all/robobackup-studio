# RoboBackup Studio 개발 및 유지보수 작업 로그 (WorkLog.md)

- **프로젝트 명**: RoboBackup Studio - High Performance Robocopy GUI & C# WPF Generator
- **개발자**: AhBiYout
- **블로그**: https://ahbiyoutvibe.blogspot.com/
- **GitHub**: https://github.com/AhBiYout-all/robobackup-studio
- **최신 릴리즈 버전**: v2.17.1 (2026-10-30)

---

## 📌 주요 릴리즈 및 개발 작업 히스토리

### [2026-10-13] - [v2.13.0] 6번째 순수 창작 코어 DLL (`RoboBandwidthThrottler`) 추가 및 기술 명세서 전면 갱신
- **6대 순수 창작 코어 DLL 모듈 완성 (`RoboBandwidthThrottler.cs`)**:
  - NAS / SMB 원격 공유 폴더 백업 시 네트워크 대역폭 독점을 방지하고 패킷 간격(`/IPG:ms`)을 동적으로 제어하여 시스템 안정성을 보장하는 고성능 스로틀링 엔진 추가.
- **기술 명세서 전면 개정 및 등록 (`docs/CORE_DLL_ARCHITECTURE.md`)**:
  - 5대 코어 DLL에서 6대 코어 DLL (`RoboDiffEngine`, `RoboVssProvider`, `RoboSyncWatch`, `RoboVault`, `RoboTimeMachine`, `RoboBandwidthThrottler`)으로 확장된 아키텍처와 세부 동작 원리, WPF MVVM 바인딩 명세를 v2.13.0 기준으로 문서화 및 등록.

### [2026-09-27] - 전체 앱 정보 및 버전 메타데이터 정합성 전수 감사 및 교정
- **검사 대상**: `index.html`, `package.json`, `metadata.json`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/TaskScheduler.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts`, `build.ps1`, `docs/` 전반
- **수정 및 동기화 내역**:
  1. `index.html`: `metadata.json` 명세에 부합하도록 `<title>`, `<meta name="description">`, `og:title`, `og:description` 동기화 및 누락 메타 태그 추가.
  2. `package.json`: 기본 placeholder(`react-example`, `0.0.0`)를 프로젝트 명칭 `robobackup-studio` 및 최신 버전 `2.12.4`로 교정.
  3. `MainWindow.xaml`: 하단 푸터 텍스트의 구버전 하드코딩(`v2.12.0`)을 `{Binding AppVersionBadgeText, FallbackValue='v2.12.4 (Dual)'}`로 변경, 방화벽 설명 및 모듈 뱃지 버전 텍스트를 `v2.12.4`로 일괄 동기화.
  4. `ViewModels/MainViewModel.cs`: 클래스 상단 요약 주석 내 버전 정보 `v2.12.4`로 동기화.
  5. `src/App.tsx`: 하단 푸터 뱃지 `v2.12.0` -> `v2.12.4` 동기화.
  6. `src/components/TaskScheduler.tsx`: 기본 방화벽 규칙 기준명(`v2.11.2`) 및 쿼리 작성자(`v2.6.1`)를 최신 `v2.12.4`로 동기화.
  7. `src/components/HelpAndLicense.tsx`: 상단 뱃지, 코어 DLL 명세 뱃지, 복사 템플릿의 `v2.7.2`를 `v2.12.4`로 갱신, 저작권 표기를 `AhBiYout`로 통일.
  8. `src/utils/robocopy.ts`: 인노셋업(.iss) 및 빌드 스크립트(.bat / .ps1) 템플릿 내 구버전(`v2.7.7`)을 `v2.12.4`로 동기화.
  9. `build.ps1`: 기본 버전값(`v2.6.1`)을 `v2.12.4`로 동기화.
  10. `docs/README.md`, `docs/THIRD_PARTY_LICENSES.md`, `docs/CORE_DLL_ARCHITECTURE.md`: 구버전 표기(`v2.5.7`, `v2.7.2`)를 `v2.12.4`로 갱신하고 최신 기능 명세 추가.

### [2026-09-22] - [v2.12.4] 초보자 마법사 5단계 시작 연동 및 NAS /ZB 프리징 방지
- 초보자 마법사 Step 5에서 '다음 단계 ▶' 버튼 클릭 시 즉시 백업 시작 액션 연동 (`EasyWizardApplyAndStart`)
- 대상 경로가 UNC 네트워크 경로이거나 용도가 NAS일 때 `/ZB` 플래그 자동 배제 (무한 대기 프리징 제거)
- 증분 백업 시 `/XC`(변경 파일 제외) 오설정 제거
- WPF 표준 입출력 파이프 비동기 BeginInvoke 전환으로 고속 파일 로깅 시 UI/입출력 데드락 방지

### [2026-09-22] - [v2.12.3] 런타임 ToggleButton.IsChecked 예외 해결
- `MainViewModel.cs`의 `IsModeIncremental` 및 `IsModeMirror`에 TwoWay 바인딩을 위한 `set` 접근자 구현
- XAML 로더 초기화 시 발생하던 `InvalidOperationException` 완벽 차단

---
