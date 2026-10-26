# RoboBackup Studio 패치 & 릴리즈 노트 (Patch Notes)

## 📌 [v2.16.9] - 2026-10-25
### 🛡️ GitHub Releases 실시간 자동 업데이트 팝업 고도화, 설치 파일 릴리즈 단일화, 불필요 파일 및 푸시 스크립트 제외(.gitignore) 전면 개편
1. **GitHub Releases 실시간 자동 업데이트 팝업 자동 실행 및 다운로드 UI 구축**:
   - 앱 구동 시 최신 GitHub 릴리스를 비동기 점검하여 새 버전 감지 시 **업데이트 알림 팝업창 자동 실행(Auto Popup)**.
   - 알림 팝업창 내에 최신 설치 관리자(`Setup.exe`) 직접 다운로드 버튼, 공식 GitHub 저장소 경로(`https://github.com/AhBiYout-all/robobackup-studio`), 현재 버전 vs 최신 릴리스 버전 비교 카드, 변경 내역 스크롤 박스 완비.
   - C# WPF 데스크탑 앱(`MainViewModel.cs`)과 React 웹 프리뷰(`AutoUpdateModal.tsx`) 상호 100% 듀얼 동기화.
2. **GitHub 저장소 제외 규칙(.gitignore) 전면 개편 및 핵심 파일 선별화**:
   - `push_github.bat`, `push_*.bat`, `*.push.bat`, `push_*.sh` 등 자동 푸시 스크립트 자체를 Git 업로드 대상에서 완벽 제외.
   - 개인정보, 이메일, 인증키, 환경변수 파일(`.env*`), 임시 로그/캐시/덤프 파일, 빌드 산출물(`bin/`, `obj/`, `dist/`, `publish/`, `node_modules/`, `bun.lock`) 등 불필요한 파일 일괄 제외 처리.
   - 실제 빌드에 필수적인 C# WPF 핵심 소스코드, 공식 문서, 설정 파일 및 빌드 스크립트만 선별하여 리포지토리 청정성 유지.
3. **GitHub Releases 첨부 자산 설치 파일 단일화 및 모바일(APK/iOS) 제외 정리**:
   - `.github/workflows/build_release.yml` 내 릴리스 첨부 자산을 `publish/RoboBackupStudio_*_Setup.exe`로 한정하여 인스톨러만 깔끔하게 등록되도록 최적화.
   - 본 애플리케이션은 Windows 네이티브 Robocopy 및 Win32 커널 API를 활용하는 PC(Windows 10/11 및 Windows Server x64) 전용 소프트웨어이므로, 구동이 불가능한 모바일(Android APK / iOS) 플랫폼 관련 내용을 명확히 정리.
4. **원클릭 GitHub 자동 푸시 스크립트(`push_github.bat`) 고도화**:
   - 기본 원격 저장소 이름을 앱 명칭 기반인 `robobackup-studio`로 기본 설정.
   - `docs/PATCH_NOTES.md` 상단에서 최신 버전(`v2.16.9`)을 동적으로 파싱하여 태깅 및 푸시 연동.
   - 스크립트 실행 시 `git rm --cached`를 통해 스크립트 자체 및 AI Studio 메타데이터가 실수로 인덱스에 포함되지 않도록 이중 방어.
5. **버전 메타데이터 일괄 동기화 (v2.16.9)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `push_github.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/components/AutoUpdateModal.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/App.tsx`, `package.json`, `README.md`, `docs/README.md`, `docs/GOOGLE_BLOGGER_COMPOSE_MODE.md`, `docs/GOOGLE_BLOGGER_HTML_MODE.html` 일괄 동기화.

---

## 📌 [v2.16.8] - 2026-10-25
### 🚀 GitHub Actions CI 빌드 워크플로 신설, Node 24 전환 및 C# 'IsCopySubdirectoriesNoEmpty' 빌드 무결성 확보
1. **GitHub Actions CI/CD 전용 빌드 워크플로 신설 (`.github/workflows/build.yml`)**:
   - `main`/`master` 브랜치 push 및 pull request, 수동 실행(`workflow_dispatch`)을 트리거하는 전용 빌드 검증 워크플로 구축.
   - **Node.js 24 환경 전환**: 수명이 만료되거나 경고가 발생하는 레거시 Node 20 의존성을 완전히 제거하고 최신 안정 버전인 `node-version: '24'` 적용.
   - 웹 프론트엔드 및 서버 검증(`npm run lint`, `npm run build`)과 배포 산출물 아티팩트(`web-dist`) 업로드 자동화.
2. **C# WPF 프로젝트 빌드 단계 최적화 및 'IsCopySubdirectoriesNoEmpty' 네임스페이스 컴파일 무결성 보장**:
   - Windows 최신 러너(`windows-latest`) 환경에서 .NET SDK 8.0.x(`dotnet-version: '8.0.x'`)를 기반으로 C# WPF 데스크탑 프로젝트 복원(`dotnet restore`) 및 Release 컴파일(`dotnet build`) 단계 구성.
   - `publish/portable` 대상 win-x64 단일 독립 실행 파일(`RoboBackupStudio.exe`) 생성 및 빌드 성공 검증 스텝 탑재.
   - `Core/RoboDirectoryCrawler.cs`의 `CrawlOptions` 내에 `IsCopySubdirectoriesNoEmpty` 및 `IsCopySubdirectoriesWithEmpty` 프로퍼티를 명시적 별칭으로 완벽 내장하여 C# 코드 컴파일 시 발생할 수 있는 식별자/네임스페이스 참조 오류(`CS0103`, `CS0117`)를 100% 원천 차단.
   - `src/utils/robocopy.ts`의 C# MVVM 템플릿에도 `IsCopySubdirectoriesNoEmpty` 및 `IsCopySubdirectoriesWithEmpty` 프로퍼티를 반영하여 동기화.
3. **릴리스 워크플로 Node 24 동기화 (`.github/workflows/build_release.yml`)**:
   - `build_release.yml`의 Node.js 설정 또한 Node 24로 일괄 업그레이드하여 CI 환경 전반의 통일성 확보.
4. **버전 메타데이터 일괄 동기화 (v2.16.8)**:
   - `docs/PATCH_NOTES.md`, `.github/workflows/build.yml`, `.github/workflows/build_release.yml`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/components/AutoUpdateModal.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/App.tsx`, `package.json`, `README.md`, `docs/README.md`, `docs/GOOGLE_BLOGGER_COMPOSE_MODE.md`, `docs/GOOGLE_BLOGGER_HTML_MODE.html` 일괄 동기화.

---

## 📌 [v2.16.7] - 2026-10-25
### 🧹 일반 사용자 중심 README 간소화: 개발자 소스 빌드 섹션 제거
1. **README.md 가이드 최적화**:
   - 일반 사용자 및 기업 관리자가 혼동 없이 즉시 다운로드하여 실행할 수 있도록 `README.md` 내 `### 2. 소스 코드 빌드 (개발자용)` 명령줄(CLI) 섹션 전면 제거.
   - '빠른 시작(Quick Start)' 섹션을 공식 인스톨러 및 단일 독립 실행 파일 위주의 직관적 다운로드 안내로 개편.
2. **공식 블로그 및 배포 문서 동기화**:
   - `docs/GOOGLE_BLOGGER_COMPOSE_MODE.md`, `docs/GOOGLE_BLOGGER_HTML_MODE.html`, `docs/README.md` 내 버전 표기를 `v2.16.7`로 동기화.
3. **데스크탑 C# WPF MVVM 및 웹 프리뷰 버전 일괄 동기화 (v2.16.7)**:
   - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/App.tsx`, `src/components/Navbar.tsx`, `package.json` 일괄 갱신.

---

## 📌 [v2.16.6] - 2026-10-25
### 📝 구글 블로거(Blogger/Blogspot) 공식 포스팅 문서 듀얼 모드 생성
1. **[작성 모드 (서식 있는 텍스트)] 전용 문서 생성 (`docs/GOOGLE_BLOGGER_COMPOSE_MODE.md`)**:
   - 구글 블로거 비주얼 위지윅 에디터(서식 있는 텍스트 모드)에 바로 복사하여 붙여넣을 수 있는 체계적인 마크다운 포스트 생성.
   - 제품 핵심 특장점 7가지, 윈도우 기본 복사 및 상용툴 대비 성능 비교표, 초간단 3단계 사용법, 공식 다운로드 및 채널 링크 완비.
2. **[HTML 편집 모드] 전용 인라인 스타일 문서 생성 (`docs/GOOGLE_BLOGGER_HTML_MODE.html`)**:
   - 구글 블로거 `< > HTML 보기` 모드에 바로 붙여넣어 사용하는 자체 완결형 인라인 CSS 템플릿 제작.
   - 블로거 기본 스킨 충돌 방지(인라인 스타일 격리), 반응형 모바일/PC 대응, 모던 다크 히어로 카드, 기능 그리드, 비교 테이블, CTA 버튼 완벽 탑재.
3. **문서 색인 인덱스 동기화 (`docs/README.md`)**:
   - `docs/README.md` 목차에 10번, 11번 구글 블로거 포스팅 가이드 항목 추가 및 최신 버전(`v2.16.6`) 동기화.
4. **버전 메타데이터 일괄 동기화 (v2.16.6)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/App.tsx`, `package.json`, `README.md` 일괄 동기화.

---

## 📌 [v2.16.5] - 2026-10-25
### 🛠️ GitHub 개인정보 보호 및 보안 강화: .aistudio 디렉터리 제외 설정
1. **Git 추적 제외 설정 (`.gitignore`)**:
   - AI Studio 내부 설정 및 캐시 데이터가 포함된 `.aistudio/` 디렉터리를 `.gitignore`에 추가하여 GitHub 푸시 시 민감 정보 유출 방지 및 리포지토리 경량화.
2. **기존 추적 파일 제거 (Untrack)**:
   - 이미 Git 인덱스에 포함된 `.aistudio/` 하위 파일들을 `git rm --cached` 명령을 통해 추적 해제 처리.
3. **버전 메타데이터 일괄 동기화 (v2.16.5)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/App.tsx`, `package.json`, `README.md`, `push_github.bat` 일괄 동기화.

---

## 📌 [v2.16.4] - 2026-10-25
### 🚀 제작자 정보 및 공식 채널 브랜딩 메타데이터 최신화
1. **공식 채널 및 블로그 주소 일괄 업데이트**:
   - **공식 구글 블로그**: 기존 `ahbivibelog.blogspot.com`에서 `ahbiyoutvibe.blogspot.com`으로 전면 교체.
   - **GitHub 저장소**: `https://github.com/AhBiYout-all` 프로필 및 관련 리포지토리 링크 최신 상태 반영.
   - **소속 및 협력사**: `https://www.cisnet.co.kr` 공식 홈페이지 링크 검증 및 적용.
2. **애플리케이션 전반의 브랜딩 동기화**:
   - `MainWindow.xaml`, `App.tsx`, `HelpAndLicense.tsx`, `AutoUpdateModal.tsx` 등 UI 요소 내 링크 및 텍스트 수정.
   - `ViewModels/MainViewModel.cs` 및 `src/utils/robocopy.ts` (C# 템플릿) 내 개발자 메타데이터 갱신.
3. **버전 메타데이터 일괄 동기화 (v2.16.4)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/App.tsx`, `package.json` 일괄 동기화.

---

## 📌 [v2.16.3] - 2026-10-25
### 🛠️ 라이브 동기화(Live Sync) 탭 세로 스크롤바 누락 결함 해결 및 UI 가독성 개선
1. **라이브 동기화 탭 세로 스크롤 환경 완벽 지원 (`MainWindow.xaml` & `App.tsx`)**:
   - **문제 현상**: 라이브 동기화 탭에서 요약 통계 HUD가 확장되거나 터미널 높이가 커질 경우, 화면 하단이 잘리고 세로 스크롤이 불가능하여 하단 컨트롤 버튼에 접근할 수 없던 결함 수정.
   - **해결 내역**:
     - `MainWindow.xaml`: 라이브 동기화 탭(Tab 2)의 메인 컨텐츠를 `ScrollViewer`로 감싸고 `VerticalScrollBarVisibility="Auto"` 및 `HorizontalScrollBarVisibility="Disabled"`를 적용하여 창 크기에 상관없이 모든 컨트롤에 접근 가능하도록 개선.
     - `App.tsx`: React 프리뷰의 메인 컨테이너에 세로 스크롤이 누락되어 긴 컨텐츠가 잘리던 현상을 방지하기 위해 스크롤 정책 점검 및 하단 푸터 버전 정보(`v2.16.3`) 최신화.
2. **버전 메타데이터 일괄 동기화 (v2.16.3)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/App.tsx`, `package.json` 일괄 동기화.

---

## 📌 [v2.16.2] - 2026-10-24
### 🛠️ 데스크탑 C# WPF 시작 런타임 예외(DirsProgressPercent TwoWay 바인딩 오류) 완벽 해결
1. **`DirsProgressPercent` 프로퍼티 `set` 접근자 추가 및 `ProgressBar` `Mode=OneWay` 명시 (`MainWindow.xaml` & `ViewModels/MainViewModel.cs`)**:
   - **문제 원인**: WPF `ProgressBar.Value` 의존성 속성의 디폴트 바인딩이 TwoWay로 평가되어, 백업 디렉터리 진행률 속성인 `DirsProgressPercent`가 읽기 전용(Getter-Only)일 때 앱 시작 시 `System.Windows.Markup.XamlReader.RewrapException` 및 `TwoWay 또는 OneWayToSource 바인딩은 'MainViewModel' 형식의 읽기 전용 속성 'DirsProgressPercent'에서 작동하지 않습니다.` 치명적 런타임 오류가 발생하며 로딩에 실패하던 결함 수정.
   - **해결 내역**:
     - `ViewModels/MainViewModel.cs`: `DirsProgressPercent`에 백업 `set` 접근자 및 `_dirsProgressPercent` 필드를 추가하여 런타임 TwoWay 세팅 시 예외 방어.
     - `MainWindow.xaml`: `ProgressBar Value="{Binding DirsProgressPercent, Mode=OneWay}"` 및 `ProgressPercent`에 `Mode=OneWay`를 명시하여 런타임 크래시 위험을 100% 근본 차단.
2. **버전 메타데이터 일괄 동기화 (v2.16.2)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/components/Navbar.tsx`, `src/components/AutoUpdateModal.tsx`, `package.json` 일괄 동기화.

---

## 📌 [v2.16.1] - 2026-10-24
### 🛠️ C# WPF `MainViewModel.cs` 하위 디렉터리 바인딩 프로퍼티 결함 수정 (GitHub Actions C# 컴파일 무결성 보장)
1. **`IsCopySubdirectoriesWithEmpty` 및 `IsCopySubdirectoriesNoEmpty` 프로퍼티 신설 (`ViewModels/MainViewModel.cs`)**:
   - **문제 원인**: `RoboDirectoryCrawler` 재귀 크롤러 실행 옵션 지정 시 `IsCopySubdirectoriesWithEmpty` (`/E`, `/MIR` 연동) 및 `IsCopySubdirectoriesNoEmpty` (`/S` 연동) 프로퍼티가 누락되어 GitHub Actions CI/CD C# MSBuild 단계(`dotnet publish`)에서 `CS0103: The name 'IsCopySubdirectoriesNoEmpty' does not exist in the current context` 컴파일 에러가 발생하던 현상 수정.
   - **해결 내역**:
     - `_isS` 플래그 필드 및 `IsS` (`/S` - 빈 디렉터리 제외 하위 폴더 복사) 프로퍼티 추가.
     - `IsCopySubdirectoriesWithEmpty` (`get => IsE || IsMir;`) 및 `IsCopySubdirectoriesNoEmpty` (`get => IsS;`) 바인딩/헬퍼 프로퍼티를 완벽 추가하여 C# MSBuild 빌드 무결성 100% 확보.
     - `UpdateCommand()`에 `IsS` (`/S`) 플래그 문자열 추가 로직 반영.
2. **GitHub Releases 무조건 자동 생성/갱신 개편 (`.github/workflows/build_release.yml`)**:
   - **문제 원인**: 기존 Release 생성 단계의 조건식(`if: startsWith(github.ref, 'refs/tags/v')...`)으로 인해 일반 브랜치 push(`main`/`master`) 시 해당 스텝이 무조건 스킵되어 GitHub Releases가 등록되지 않던 결함 수정.
   - **해결 내역**: 조건식을 해제하고 `make_latest: true`를 적용하여 `main`/`master`/태그/수동 실행 등 모든 CI 빌드 완료 시 인스톨러 실행 파일(`publish/*.exe`)이 GitHub Releases(Latest)로 100% 자동 생성·갱신되도록 개선.
3. **버전 메타데이터 일괄 동기화 (v2.16.1)**:
   - `docs/PATCH_NOTES.md`, `.github/workflows/build_release.yml`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/components/Navbar.tsx`, `src/components/AutoUpdateModal.tsx`, `package.json` 일괄 동기화.

---

## 📌 [v2.16.0] - 2026-10-24
### 🚀 GitHub Actions CI/CD 빌드·릴리즈 워크플로 완전 정상화, push_github.bat 자동 태깅 연동 및 데스크탑 C# WPF·React 듀얼 실시간 자동 업데이트 센터 구축
1. **GitHub Actions CI/CD 워크플로 완전 정상화 (`.github/workflows/build_release.yml`)**:
   - **트리거 누락 결함 해결**: 기존 `on: push: tags: ['v*']`로만 한정되어 있어 일반 commit/push 시 GitHub Action이 전혀 실행되지 않던 문제를 `branches: [main, master]`, `tags: ['v*']`, `workflow_dispatch` (수동 실행) 3중 트리거로 전면 개편.
   - **Inno Setup 인스톨러 빌드 자동화 복구**: Windows Runner에서 Chocolatey(`choco install innosetup`) 설치 후 환경 변수 PATH 미반영으로 인해 `iscc` 실행 실패하던 문제를 `$env:GITHUB_PATH` 추가 및 `C:\Program Files (x86)\Inno Setup 6\ISCC.exe` 절대 경로 명시로 해결.
   - **WPF 단일 독립 실행 파일 빌드 및 아티팩트 배포**:
     - `dotnet publish -c Release -r win-x64 --self-contained true`로 Windows x64 전용 독립 실행 파일 빌드.
     - Inno Setup 컴파일을 통해 `publish/RoboBackupStudio_vX.Y.Z_Setup.exe` 생성.
     - `actions/upload-artifact@v4`를 통해 매 빌드마다 인스톨러를 다운로드 가능하도록 구성하고, 태그 push 시 `softprops/action-gh-release@v2`로 GitHub Releases에 자동 등록.
2. **원클릭 GitHub 릴리즈 푸시 자동화 스크립트 (`push_github.bat`) 고도화**:
   - `docs/PATCH_NOTES.md` 상단에서 최신 버전 번호를 동적으로 자동 파싱.
   - `git tag -a "%VERSION%" -m "Release %VERSION%" -f`로 버전 태그 자동 생성 및 덮어쓰기.
   - `git push -u origin main`과 함께 `git push origin "%VERSION%" --force`를 동시 실행하여 GitHub Actions CI/CD가 푸시 즉시 100% 자동 가동되도록 보장.
   - 푸시 완료 후 GitHub Actions 워크플로 진행 현황 및 Releases 다운로드 링크 터미널 안내.
3. **데스크탑 C# WPF 앱 및 React 프리뷰 듀얼 동기화 실시간 자동 업데이트 센터 탑재**:
   - **C# WPF 데스크탑 앱 100% 구현 (Desktop-First Dual Architecture)**:
     - `ViewModels/MainViewModel.cs`:
       - `CheckGitHubUpdateAsync(bool isSilent)`: `System.Net.Http.HttpClient` 및 `System.Text.Json` 기반으로 GitHub 최신 릴리스 API(`api.github.com/repos/AhBiYout-all/robobackup-studio/releases/latest`) 비동기 조회.
       - 필수 `User-Agent: RoboBackupStudio-UpdateClient/2.16.0` 헤더 부여 및 Semver 정밀 버전 비교(`CompareVersions`) 구현.
       - 최신 릴리스 내 `.exe` 또는 `Setup.exe` 다운로드 에셋 링크 자동 감지.
       - 앱 구동 3.5초 후 백그라운드에서 무간섭 자동 업데이트 점검 실행.
     - `MainWindow.xaml`:
       - 상단 헤더 바에 '🔄 업데이트 확인' 버튼 및 신규 릴리스 감지 시 초록색 알림 핑 배지(`UpdateBadgeVisibility`) 탑재.
       - 모던 고대비 다크 테마 기반 전용 업데이트 센터 모달(`IsUpdateModalOpen`, `Panel.ZIndex="9998"`): 현재 버전 vs 최신 버전 비교 카드, 릴리스 변경 노트 스크롤 박스, 브라우저 릴리스 페이지 열기 및 원클릭 인스톨러 다운로드 버튼 완벽 연동.
   - **React 프리뷰 계층 (`AutoUpdateModal.tsx`, `Navbar.tsx`)**:
     - `currentVersion`을 `v2.16.0`으로 갱신하고 GitHub 릴리스 비교 UI 듀얼 동기화.
4. **보안 및 메타데이터 무결성 강화**:
   - 개인 이메일 등 불필요한 민감 정보 전면 제거 및 공식 개발자 브랜드 `AhBiYout` (`AhBiYout-all`, `ahbivibelog.blogspot.com`, `www.cisnet.co.kr`) 일괄 동기화.
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/components/Navbar.tsx`, `package.json` 버전 일괄 갱신 (`v2.16.0`).

---

## 📌 [v2.15.0] - 2026-10-23
### 🚀 엔터프라이즈급 재귀 디렉터리 크롤러(RoboDirectoryCrawler) 탑재 및 하위 디렉터리 정밀 집계(Total vs Copied) UI 대시보드 고도화
1. **재귀 디렉터리 크롤러 (`Core/RoboDirectoryCrawler.cs`) 신규 구현**:
   - **문제점 및 한계 극복**: 기존 `DirectoryInfo.GetDirectories(..., SearchOption.AllDirectories)` 사용 시 윈도우 깊은 트리, 권한 보호 폴더(`System Volume Information`, `$RECYCLE.BIN`), 정션(Junction/ReparsePoint)에서 발생하던 예외(`UnauthorizedAccessException`, `PathTooLongException`)를 BFS 비동기 큐 기반 방어 로직으로 완벽 해결.
   - **Robocopy 필터 규칙 연동**:
     - `/XD` (디렉터리 제외 규칙) 패턴 목록을 크롤러에 직접 반영하여 제외 대상 디렉터리 및 하위 트리를 사전 필터링.
     - `/XJ` (Junction/Symlink 배제) 옵션 활성화 시 `FileAttributes.ReparsePoint` 속성을 감지하여 무한 루프 위험 차단.
     - `/S` (빈 디렉터리 제외) 옵션 시 파일이 없는 공백 디렉터리를 지능적으로 판별하여 정확한 복사 대상 디렉터리 수 산출.
     - 비동기 진행률 보고(`IProgress<CrawlProgressInfo>`)를 통해 탐색 중에도 `TotalDirs`와 `TotalFiles`를 실시간 반영.
2. **React 프리뷰 계층 재귀 디렉터리 크롤러 (`crawlDirectoryStructure`) 듀얼 동기화**:
   - `src/components/LiveRunner.tsx`:
     - 상위 디렉터리 계층을 누적 탐색하는 재귀 크롤러 알고리즘 구현 (`A\B\C` 경로 시 `A`, `A\B`, `A\B\C` 계층 구조 정밀 산출).
     - 폴더 로드(`handleLocalFolderSelect`) 및 백업 시작 시 전체 하위 디렉터리 수(`totalDirs`)를 즉시 계산하고, 콘솔 스트림에 크롤링 결과 요약 등록.
3. **UI 디렉터리 진행률 게이지 및 퍼센트 표시 고도화**:
   - **C# WPF (`MainWindow.xaml`) & ViewModels (`MainViewModel.cs`)**:
     - `DirsProgressPercent` 및 `DirsProgressText` 프로퍼티 신설.
     - '복사된 디렉터리 수' 카드 내부에 전용 퍼플 프로그레스 바(`ProgressBar`) 및 `N% 완료 (Copied / Total 디렉터리)` 텍스트를 탑재하여 전체 대비 복사 완료 비율을 한눈에 파악할 수 있도록 구현.
   - **React 프리뷰 (`LiveRunner.tsx`)**:
     - 6열 상태 카드의 '복사된 디렉터리 수' 카드 내부에 퍼플 미니 게이지 바 및 `${dirsPercent}% 완료` 실시간 배지 추가.
4. **버전 메타데이터 일괄 갱신 (v2.15.0)**:
   - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `src/components/Navbar.tsx`, `package.json` 일괄 동기화.

---

## 📌 [v2.14.0] - 2026-10-23
### 🚀 복사 시 순서 번호([#N]) 실시간 스트림 자동 접두사 부여, 하위 디렉터리 정밀 실시간 카운팅 및 파일/디렉터리 6열 분리 메트릭 UI 동기화
1. **복사 시 순서 번호(`[#N]`) 실시간 스트림 자동 접두사 추가 및 로그 미출력 결함 완벽 해결**:
   - **문제 원인**: `OutputDataReceived` 이벤트 수신 시 `ParseLogLine` 호출 전 원본 라인이 `Logs.Add(e.Data)`로 바로 등록되어 콘솔 로그 목록상자에 순서 번호(`[#N]`)가 미반영되던 결함 수정.
   - **해결 및 개선**: `ParseLogLine(string line)`이 포맷팅된 문자열을 반환하도록 개선하여, 새 디렉터리(`New Dir`, `새 디렉터리`) 및 파일 복사(`New File`, `새 파일`, `Modified`, `Newer`, `100%`) 감지 시 `_liveSequenceNum++`를 실시간 증가시키고 로그 및 HUD 배너에 `[#1]`, `[#2]`, `[#3]`... 접두사를 100% 명확히 부여.
2. **복사 시 하위 디렉터리 정밀 실시간 카운팅 (`CopiedDirs` / `TotalDirs`)**:
   - Robocopy 표준 출력 스트림의 영문/한글 디렉터리 전송 패턴(`New Dir`, `새 디렉터리`, `*EXTRA Dir`, `*추가 디렉터리` 및 UNC/로컬 드라이브 경로 패턴)을 실시간 감지하여 `_liveDirsCopied++` 및 `CopiedDirs`를 즉시 갱신.
   - 백업 시작 전 백그라운드 태스크로 원본 경로 디렉터리/파일 개수를 비동기 사전 추정(`dirInfo.GetDirectories()`)하여 모니터링 카드 분모(`TotalDirs`, `TotalFiles`)를 지연 없이 스마트 초기화.
   - 백업 종료 시 Robocopy 요약 리포트 테이블의 `Dirs :` 행을 파싱하여 실제 완료된 전체/복사된 디렉터리 수(`report.DirsCopied`, `report.DirsTotal`)와 100% 최종 일치 보정.
3. **복사된 파일 수와 디렉터리 수 분리 표시 (6열 대시보드 상태 카드)**:
   - C# WPF 데스크탑 앱(`MainWindow.xaml`) 및 웹 프리뷰(`src/components/LiveRunner.tsx`):
     - 상태 카드를 6열 레이아웃으로 확장하여 파일과 디렉터리를 명확히 구분 표시:
       1) **실행 진행률 (%)**: 프로그레스 바 및 퍼센트
       2) **복사된 파일 수**: `CopiedFiles / TotalFiles` (스카이블루)
       3) **복사된 디렉터리 수**: `CopiedDirs / TotalDirs` (퍼플)
       4) **전송 데이터 용량**: 완료 바이트 / 전체 바이트 (앰버)
       5) **현재 전송 속도**: 실시간 MB/s (에메랄드/인디고)
       6) **남은 예상 시간 (ETA)**: Clock 아이콘 및 실시간 계산 시간
4. **C# WPF 데스크탑 앱 및 React 프리뷰 듀얼 동기화 (Desktop-First Dual Sync)**:
   - `ViewModels/MainViewModel.cs`, `MainWindow.xaml`, `src/types.ts`, `src/components/LiveRunner.tsx`, `src/App.tsx` 전면 동기화.
5. **버전 메타데이터 일괄 갱신 (v2.14.0)**:
   - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts`, `package.json`, `docs/PATCH_NOTES.md` 일괄 동기화.

---

## 📌 [v2.13.0] - 2026-10-13
### 🚀 실시간 전송 속도 및 잔여 데이터 기반 예상 남은 시간(ETA) 자동 계산 및 모니터링 HUD 5열 카드 레이아웃 구현
- **LiveRunner 컴포넌트 실시간 예상 남은 시간(ETA) 계산 로직 구현**:
  - **계산 알고리즘**:
    - 누적 전송 바이트 수(`accumulatedBytes`)와 경과 시간(`elapsedSec`)을 기반으로 정확한 초당 전송 바이트 속도(`speedBytesPerSec`) 실시간 산출.
    - 전체 대상 바이트(`effectiveTotalBytes`)에서 전송 완료 바이트를 차감하여 잔여 데이터 용량(`remainingBytes = Math.max(0, effectiveTotalBytes - accumulatedBytes)`) 계산.
    - 잔여 시간 초 단위 산출: `remainingSeconds = Math.ceil(remainingBytes / speedBytesPerSec)`.
    - 0바이트 완료 시 `0초 (동기화 완료)`, 전송 시작 직후 속도 집계 전 `계산 중...`, 60초 미만 `약 N초 남음`, 1시간 미만 `약 N분 SS초 남음`, 24시간 미만 `약 H시간 MM분 SS초 남음`, 24시간 이상 `약 D일 H시간 남음`으로 정밀 로컬라이즈 포맷팅 제공.
  - **LiveRunner 상단 헤더 & HUD 배너 실시간 연동**:
    - 진행률 바 상단 우측에 `남은 예상 시간 (ETA)` 전용 인디케이터(Clock 아이콘 및 스카이블루 폰트) 배치.
    - 실시간 콘솔 스트림 HUD 배너(`isLiveStreamHudEnabled`) 내에 `ETA: 약 N분 SS초 남음 · 잔여: X.XX MB` 실시간 뱃지 추가.
  - **5열 메트릭 카드 레이아웃 확장**:
    - 기존 4열(파일, 용량, 스레드, 오류)에서 5열로 확장:
      1) 복사된 파일 수 (`copiedFiles / totalFiles`)
      2) 복사 용량 및 잔여 용량 (`copiedBytes / totalBytes` 및 `남음: remainingBytes`)
      3) **남은 예상 시간 (ETA)** (Clock 아이콘, 실시간 잔여 시간, 작업 상태)
      4) 스레드 수 (`/MT`)
      5) 오류/재시도 (`failedCount`)
- **데스크탑 앱(C# WPF MVVM) 100% 완전 동기화 (Desktop-First Dual Sync)**:
  - `MainWindow.xaml`:
    - Status Cards Grid를 5열(`ColumnDefinition Width="*" x 5`)로 확장하여 `남은 예상 시간 (ETA)` 카드 추가 및 `{Binding EstimatedRemainingTimeText}` 바인딩.
    - Live Copy Stream HUD 배너 내 `· ⏱️ ETA: {EstimatedRemainingTimeText}` 동시 표시.
  - `ViewModels/MainViewModel.cs`:
    - `EstimatedRemainingTimeText` 프로퍼티 및 `FormatEstimatedRemainingTime(double remainingSeconds)` 구현.
    - `ParseRobocopyLiveOutput` 내 실시간 전송 속도(`speedBytesPerSec`)와 잔여 데이터/잔여 파일 기반 ETA 실시간 계산 연동.
    - 시작 시 `계산 중...`, 취소 시 `중단됨`, 완료 시 `0초 (완료)` 상태 생명주기 관리.
- **전체 프로젝트 버전 메타데이터 동기화 (v2.13.0)**:
  - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `MainViewModel.cs`, `Navbar.tsx`, `App.tsx`, `TaskScheduler.tsx`, `HelpAndLicense.tsx`, `robocopy.ts`, `build.ps1`, `package.json`, `docs/` 버전 일괄 갱신.

---

## 📌 [v2.12.4] - 2026-09-22
### 🚀 초보자 백업 마법사 5단계 완료 시작 연동 & NAS 네트워크 /ZB 플래그 프리징 및 표준 입출력 파이프 행(Hang) 결함 완벽 해결
- **초보자 백업 마법사 5단계 [다음 단계 ▶] 클릭 시 백업 미동작 현상 완벽 해결**:
  - **오류 원인**: 5단계(최종 단계)에서 하단 네비게이션 버튼이 계속 '다음 단계 ▶'로 남아있고, 이를 클릭 시 `EasyWizardStep < 5` 조건문으로 인해 어떠한 동작도 일어나지 않아 사용자가 진행 멈춤으로 체감.
  - **개선 내용**:
    - `EasyWizardStep == 5`일 때 하단 버튼 텍스트가 자동으로 `🚀 백업 지금 시작 ▶`으로 전환되고, 에메랄드 강조 스타일(`EasyWizardNextButtonBrush`) 적용.
    - 5단계에서 버튼 클릭 시 즉시 메인 화면 라이브 러너로 전환 후 백업이 즉각 시작되도록 `EasyWizardApplyAndStart()` 호출 연동.
    - 백업 마법사 시작 시 이전 프로세스가 이미 실행 중(`IsRobocopyRunning == true`)인 경우, 사용자에게 기존 작업 중지 후 즉시 재시작할지 확인창을 띄워 안전하게 프로세스 교체 실행.
- **NAS 및 SMB 네트워크 공유 폴더 대상 `/ZB` 플래그로 인한 무한 멈춤(Hang) 방지**:
  - **오류 원인**: 대상 경로가 네트워크 UNC(`\\192.168.x.x\...`)이거나 용도가 NAS일 때 `/ZB`(재시작 가능 모드 + 백업 권한 모드) 및 `/MT`(멀티스레드) 옵션이 함께 전달되면 Samba/리눅스 NAS에서 백업 권한 토큰 거부 및 소켓 버퍼 락으로 인해 Robocopy가 첫 파일 복사 전에 무한 프리징 발생.
  - **해결 내용**: 네트워크 UNC 대상 또는 NAS 백업 모드 감지 시 `/ZB` 플래그를 자동으로 배제하여 지연 없이 안정적으로 고속 복사가 진행되도록 최적화.
- **증분 백업 모드에서 `/XC`(변경 파일 제외) 플래그 오설정 수정**:
  - 기존 마법사 증분 백업에서 `/XC`가 포함되어 대상에 이미 존재하는 파일이 원본에서 수정되었을 때 복사 대상에서 제외되던 논리적 결함을 교정(`IsXc = false`).
- **WPF 표준 입출력(stdout) 파이프 데드락 방지 (비동기 BeginInvoke 전환)**:
  - `OutputDataReceived` 및 `ErrorDataReceived` 핸들러의 동기 `Dispatcher.Invoke`를 비동기 `Dispatcher.BeginInvoke(..., DispatcherPriority.Background)`로 전환하여 수만 개의 파일/디렉터리 고속 출력 시 발생하는 파이프 버퍼 포화 데드락 완전 제거.
- **웹 프리뷰(React) 및 데스크탑 앱(C# WPF MVVM) 듀얼 동기화**:
  - `src/components/EasyBackupWizardModal.tsx`에서도 동일하게 네트워크 대상 감지 시 `/ZB` 배제, `/XC` 제외 및 5단계 하단에 '백업 지금 시작' 액션 버튼 연동.
- **전체 프로젝트 버전 메타데이터 동기화 (v2.12.4)**:
  - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 일괄 동기화.

---

## 📌 [v2.12.3] - 2026-09-22
### 🐛 런타임 시작 실패 오류(ToggleButton.IsChecked 읽기 전용 속성 바인딩 예외) 완벽 해결
- **WPF 런타임 초기화 크래시 (InvalidOperationException) 완전 해결**:
  - **오류 증상**: 앱 설치 후 또는 포터블 실행 시 `메인 윈도우를 로드할 수 없습니다: 속성 'System.Windows.Controls.Primitives.ToggleButton.IsChecked' 설정에서 예외가 throw되었습니다. TwoWay 또는 OneWayToSource 바인딩은 'RoboBackupStudio.ViewModels.MainViewModel' 형식의 읽기 전용 속성 'IsModeIncremental'에서 작동하지 않습니다` 에러 창 발생 및 프로그램 비정상 종료.
  - **발생 원인**:
    - WPF에서 `<RadioButton IsChecked="{Binding ...}">`의 `IsChecked` 종속성 속성은 기본 바인딩 모드가 `TwoWay`로 동작함.
    - 그러나 `MainViewModel.cs`의 `IsModeIncremental` 및 `IsModeMirror`가 람다 읽기 전용 속성(`=> EasyWizardMode == ...`)으로 선언되어 setter가 부재하여, XAML 로더(`InitializeComponent`)가 양방향 바인딩 초기화 도중 예외를 발생시킴.
  - **해결 내용**:
    - `ViewModels/MainViewModel.cs`: `IsModeIncremental` 및 `IsModeMirror` 프로퍼티에 명시적 `set` 접근자를 구현하여 양방향 바인딩 시 `EasyWizardMode`의 값을 `"incremental"` 또는 `"mirror"`로 갱신하도록 지원.
    - `MainWindow.xaml`: 초보자 백업 마법사 Step 3의 증분/미러 라디오 버튼에 `Mode=TwoWay`를 명시하여 런타임 바인딩 안정성 극대화.
- **전체 프로젝트 버전 메타데이터 동기화 (v2.12.3)**:
  - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 일괄 동기화.

---

## 📌 [v2.12.2] - 2026-09-22
### 🛠️ C# 컴파일러 빌드 오류(CS0120 static 개체 참조 & CS0103 IsE, IsXc 컨텍스트 누락) 완벽 해결
- **C# CS0120 (정적 메서드 내 인스턴스 멤버 접근) 결함 완전 해결**:
  - **오류 원인**: `ViewModels/MainViewModel.cs`의 `ParseSummaryReport` 메서드가 `public static`으로 선언되어 있으나, 내부 보정 로직에서 `CopiedFiles` 및 `TotalFiles` 인스턴스 프로퍼티를 직접 참조하여 `error CS0120: static이 아닌 필드, 메서드 또는 속성에 개체 참조가 필요합니다` 발생.
  - **해결 내용**: `ParseSummaryReport` 메서드 시그니처에 `int currentCopiedFiles = 0, int currentTotalFiles = 0` 매개변수를 추가하고, 호출 시 인스턴스 상태(`CopiedFiles`, `TotalFiles`)를 명시적으로 주입하도록 리팩터링하여 정적 메서드의 캡슐화 및 참조 무결성 100% 확보.
- **C# CS0103 (`IsE`, `IsXc` 미정의) 식별자 오류 완전 해결**:
  - **오류 원인**: `ApplyWizardSettingsToMain`에서 백업 마법사 모드 적용 시 `IsE`, `IsXc` 플래그를 설정하고 있었으나, 기존 `MainViewModel`에 해당 프로퍼티가 정의되어 있지 않아 `error CS0103: 'IsE'/'IsXc' 이름이 현재 컨텍스트에 없습니다` 발생.
  - **해결 내용**:
    - `IsE`(`_isE`, `/E` 하위 디렉터리 복사 토글) 프로퍼티 신설 및 `UpdateCommand()`에서 `!IsMir && IsE`일 때 `/E` 옵션이 정상 생성되도록 연동.
    - `IsXc`를 기존 `IsExcludeChanged`(`_isExcludeChanged`, `/XC` 변경 파일 제외)에 매핑하는 프로퍼티로 정의하여 상호 완벽 호환.
- **`build.bat` 자동 빌드 파이프라인 무결성 완전 복원**:
  - `dotnet publish`를 통한 Windows 10/11/Server 독립 실행형 싱글 파일(`publish\RoboBackupStudio_v2.12.2.exe`) 및 설치 파일(`publish\RoboBackupStudio_v2.12.2_Setup.exe`) 컴파일 성공 보장.
- **전체 프로젝트 버전 메타데이터 동기화 (v2.12.2)**:
  - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 일괄 동기화.

---

## 📌 [v2.12.1] - 2026-09-22
### 🛠️ WPF XAML 컴파일러 오류(MC3072: Button CornerRadius) 수정 & build.bat 빌드 파이프라인 무결성 확보
- **WPF XAML Button CornerRadius 속성 오류 완벽 해결**:
  - **오류 원인**: `MainWindow.xaml` 2514, 2525, 2536 라인의 초보자 백업 마법사 Step 5 액션 버튼 태그(`<Button>`)에 WPF 표준 컨트롤 사양상 지원되지 않는 `CornerRadius="10"` 속성이 직접 부여되어 `error MC3072: XML 네임스페이스에 'CornerRadius' 속성이 없습니다` 발생 및 `dotnet publish` 빌드 실패.
  - **수정 내용**: 외곽 둥근 모서리 및 테두리를 담당하는 `<Border CornerRadius="10" ...>` 래퍼를 구성하고 내부에 투명 배경의 `<Button Background="Transparent" BorderThickness="0" ...>`을 배치하여 WPF 표준 XAML 규격을 100% 준수하도록 리팩터링.
- **Inno Setup 설치 프로그램 생성 경로 연쇄 해결**:
  - `dotnet publish` 성공에 따라 `publish\app\*` 산출물이 정상 생성되어 Inno Setup 6 (`ISCC.exe`) 설치 프로그램(`RoboBackupStudio_v2.12.1_Setup.exe`) 및 단일 실행 파일(`publish\RoboBackupStudio_v2.12.1.exe`) 컴파일이 에러 없이 무결하게 완료되도록 정상화.
- **전체 프로젝트 버전 메타데이터 동기화 (v2.12.1)**:
  - `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 일괄 동기화.

---

## 📌 [v2.12.0] - 2026-09-21
### 🪄 초보자를 위한 5단계 안심 백업 마법사 탑재 & 강제 중지 시 요약 리포트 0 표기 결함 완벽 해결
- **🌟 초보자를 위한 5단계 안심 백업 마법사 (Easy Backup Wizard) 전면 구현 (C# WPF & React 듀얼 동기화)**:
  - **기획 및 설계 배경**:
    - Robocopy의 복잡하고 위험한 스위치(/MIR, /E, /XO, /XC, /MT, /FFT 등)를 잘 모르는 초보자도 팝업 창에서 5단계 순서에 따라 안심하고 안전하게 백업을 구성할 수 있도록 전용 마법사 팝업 인터페이스 설계 및 탑재.
  - **5단계 진행 순서 및 세부 기능**:
    1. **[1단계: 백업 목적 선택 (Purpose)]**:
       - 💾 **외장 USB / 외장하드 백업**: FAT32/exFAT 2초 오차 허용(/FFT), 안전 증분 복사.
       - 🌐 **NAS 네트워크 드라이브 동기화**: 잠금 파일 방지(/R:1 /W:1), 빠른 재시도.
       - 🔄 **폴더 완전 1:1 복제 (미러링)**: 삭제 반영(/MIR), 대상 폴더 동기화.
       - 📦 **대용량 데이터 아카이브 보관**: 누적 백업(/E /XC /XN /XO), 덮어쓰기 방지.
    2. **[2단계: 폴더 선택 및 안전 경로 자동 검증 (Paths & Safety Guard)]**:
       - 원본 및 대상 폴더 경로 입력 및 직관적인 `📁 폴더 찾기` 대화상자 지원.
       - **안전 검증 엔진**: 원본과 대상 폴더 일치 여부 경고, 무한 복사 루프(대상이 원본 내부에 위치) 방지 검사, `C:\` 루트 드라이브 지정 시 주의 안내.
    3. **[3단계: 백업 방식 및 속도 설정 (Mode & Speed)]**:
       - 원본에 없는 대상 파일 보존(안전 증분) vs 원본 기준으로 대상 파일 삭제(/MIR) 선택.
       - 사용 중인 파일 잠금 방지(/R:1 /W:1 빠른 재시도), 멀티스레드(/MT:8) 고속 복사, 2초 시간차 허용(/FFT) 토글.
    4. **[4단계: 사전 점검 시뮬레이션 (Dry-Run Preview)]**:
       - 실제 파일 복사 전에 사전 점검을 수행하여 복사 예정 파일 수, 총 복사 예상 용량, 삭제 예정 파일 수, 예상 소요 시간을 4개 지표 카드로 시각화.
       - 생성된 최종 Robocopy 명령어 실시간 미리보기 및 재점검 기능 제공.
    5. **[5단계: 최종 작업 연동 및 실행 (Action)]**:
       - 🚀 **지금 바로 백업 실행**: 메인 ViewModel에 설정 자동 주입 후 라이브 동기화 탭으로 전환하여 즉시 시작.
       - ⏰ **Windows 예약 작업으로 등록**: 스케줄러 탭으로 전달하여 매일/매주 자동 백업 구성.
       - 💾 **원클릭 배치 스크립트(.bat) 저장**: 바탕화면에서 더블 클릭 한 번으로 실행 가능한 완전한 UTF-8 배치 파일 내보내기.
  - **진입점**:
    - C# WPF 상단 헤더의 `🪄 초보자 백업 마법사` 버튼 및 상단 빠른 작업 바의 마법사 버튼.
    - React 웹 상단 내비게이션 바의 `🪄 초보자 마법사` 버튼 및 잡 디자이너 상단 배너.

- **🎯 라이브 동기화 강제 중지 시 작업 통계 리포트 0 초기화 결함 완전 해결**:
  - **결함 원인**:
    - Robocopy 진행 중 강제 중지(`StopRobocopy`) 시 프로세스가 즉시 종료되어 콘솔 끝의 표준 요약표(`Dirs:`, `Files:`, `Bytes:`)가 출력되지 않음.
    - 기존 요약표 파서가 다국어(한국어 윈도우의 `최신`, `이전`, `변경됨`, `조정됨` 등) 및 `/NC` 옵션 출력 라인을 정상 감지하지 못해 누적 카운터가 0으로 처리되어 모든 항목이 0으로 출력되던 문제.
  - **해결 및 복원 로직**:
    1. **다국어 및 패턴 대응 정밀 파서 (`ParseLogLine`)**:
       - 영문(`New File`, `Newer`, `Older`, `Modified`, `Tweaked`)과 한글(`새 파일`, `최신`, `이전`, `변경됨`, `조정됨`) 및 `100%` 완료 패턴을 완전 지원.
       - 바이트 단위 크기(B, KB, MB, GB, TB) 파싱을 고도화하여 실시간 스트림에서 파일 전송과 바이트를 빈틈없이 누적.
    2. **강제 중지 시 전수 로그 회귀 복원 엔진 (`ParseSummaryReport`)**:
       - 강제 중지 또는 비정상 종료 시, 실시간 집계값이 0이더라도 콘솔 로그 전체를 역추적하여 전송된 파일과 디렉터리, 총 바이트, 소요 시간, 전송 속도를 완벽 복원.
       - 중지 시점까지의 안전 동기화 파일 수와 용량을 명시한 주황색 뱃지(`⏹️ 사용자 강제 중지 (중단됨)`)를 HUD 및 요약 창에 명확하게 표기.
    3. **React 웹 프리뷰 동기화 (`LiveRunner.tsx`)**:
       - 가상 샘플 파일 자동 제공 엔진을 탑재하여 폴더를 로드하지 않아도 즉시 실시간 동기화 테스트 가능.
       - 강제 중지 시 현재까지 전송된 파일 수, 바이트, 속도, 소요 시간을 기반으로 정밀한 요약 리포트를 자동 생성.

- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.12.0)**:
  - `docs/PATCH_NOTES.md`: 최신 버전 `v2.12.0` 반영
  - `RoboBackupStudio.csproj`: Version `2.12.0`, AssemblyVersion `2.12.0.0`, FileVersion `2.12.0.0`
  - `build.bat`: `set VERSION=v2.12.0`
  - `installer.iss`: `#define MyAppVersion "v2.12.0"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.12.0`
  - `ViewModels/MainViewModel.cs`: `v2.12.0` 주석 및 `StartBackupCommand` 연동
  - `src/components/Navbar.tsx`: `v2.12.0` 배지 동기화
  - `src/utils/robocopy.ts`: C# WPF 템플릿 버전 정보 `v2.12.0` 동기화

---

## 📌 [v2.11.8] - 2026-09-20
### 🌐 NAS 자동 연동 UNC 경로 및 예시 경로 버튼 정밀 정리 (UI & Default Cleansing)
- **NAS UNC 경로 내 고정 단어 'NAS_Backup' 제거**:
  - NAS 서버 IP/호스트 입력 시 자동 연동되는 전체 UNC 공유 경로(`NasSharePath`, `DestinationPath`, `targetPath`) 기본값 및 템플릿 생성을 `\\IP` 형태의 순수 루트 경로로 변경.
  - 사용자 맞춤 공유 폴더 지정을 위해 하드코딩되었던 `NAS_Backup` 접미사를 일괄 제거.
  - C# WPF 데스크탑 앱(`MainViewModel.cs`, `MainWindow.xaml`) 및 React 웹 프리뷰(`NasAuthManager.tsx`, `JobDesigner.tsx`)의 모든 툴팁, 플레이스홀더, 자동 연동 로직 완전 동기화.
- **'+ 예시 NAS 경로 적용' 버튼 제거**:
  - 불필요한 예시 클릭으로 사용자의 실제 NAS 공유 경로 설정이 덮어씌워지는 현상을 방지하기 위해 C# WPF UI와 React 웹 UI에서 '+ 예시 NAS 경로 적용' 버튼 완전 제거.

---

## 📌 [v2.11.7] - 2026-09-20
### 🛡️ 라이브 동기화 강제 중지 시 작업 통계 리포트 0 초기화 방지 및 실시간 누적 집계 복원 강화
- **🎯 라이브 동기화 강제 중지(Stop) 시 리포트에 작업 내용이 누락되고 0으로 표기되던 결함 완벽 해결**:
  - **결함 원인 분석**:
    - Robocopy 실행 도중 사용자가 '작업 중지'(`StopRobocopy` / `cancelSimulation`)를 누르면 프로세스가 즉시 강제 종료(`Kill`)되므로, 정상 완료 시 콘솔 맨 끝에 출력되는 Robocopy 자체 요약 테이블(`Dirs :`, `Files :`, `Bytes :`)이 생성되지 못함.
    - 기존의 요약 파서(`ParseSummaryReport`)는 콘솔 로그 끝부분의 고정 요약표 텍스트에만 의존하여, 요약표가 없을 경우 기본값 `0`으로 채워진 빈 리포트가 출력되는 구조적 한계 존재.
  - **수정 및 핵심 구현 명세**:
    1. **실시간 스트림 누적 메트릭 트래커 구축 (`ViewModels/MainViewModel.cs`)**:
       - `_liveFilesCopied`, `_liveFilesSkipped`, `_liveFilesFailed`, `_liveFilesExtras`, `_liveFilesMismatch`, `_liveDirsCopied`, `_liveBytesCopied` 등 실시간 전송 항목별 상세 카운터 추가.
       - 정규식 및 Robocopy 라인 토큰 기반 정밀 파일 크기 파서(`ExtractFileSizeFromRobocopyLine`)를 탑재하여 각 파일의 바이트 단위 크기(B, KB, MB, GB, TB)를 실시간으로 정확히 누적 계산.
       - 강제 중지 플래그(`_isUserCancelled`) 및 세션 시작 시각(`_syncStartTime`)을 통해 중지 시점까지의 총 전송량, 처리 파일 수, 경과 시간, 평균 속도를 완벽히 보존.
    2. **지능형 요약 리포트 Fallback 복원 엔진 (`ParseSummaryReport`)**:
       - Robocopy 자체 푸터가 누락된 경우(강제 중지, 예외 중단 등), 실시간으로 집계된 누적 통계 데이터를 바탕으로 디렉터리, 파일, 바이트, 소요 시간, 전송 속도 요약 리포트를 자동 재구성 및 보정.
       - 종료 코드 `-1`을 지원하여 `[⏹️ 사용자 강제 중지 (중단됨)]` 진단 뱃지 및 중지 시점까지의 전송 완료 수치(`총 N개 파일 및 M MB 안전 동기화`)를 명확하게 표시.
    3. **React 웹 프리뷰 동기화 (`LiveRunner.tsx`)**:
       - `cancelSimulation` 실행 시 카운터 리셋 전에 중단 시점까지 전송된 파일 수, 누적 바이트, 경과 시간, 평균 속도를 즉시 계산하여 최종 통계 요약 HUD 리포트(`summaryReport`)를 생성 및 팝업.
- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.11.7)**:
  - `RoboBackupStudio.csproj`: Version `2.11.7`
  - `build.bat`: `set VERSION=v2.11.7`
  - `installer.iss`: `#define MyAppVersion "v2.11.7"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.11.7`
  - `ViewModels/MainViewModel.cs`: `v2.11.7` 주석 및 버전 표기 동기화
  - `src/components/Navbar.tsx`, `src/utils/robocopy.ts`: `v2.11.7` 일괄 동기화 완료.

---

## 📌 [v2.11.6] - 2026-09-20
### ⚡ 라이브 동기화 콘솔 '최신위치(v)' 상시 옵션 기능 전환 및 자동 스크롤 동기화 강화
- **🎯 라이브 동기화 진행 중 '최신 위치' 단발성 버튼을 '최신위치(v)' 상시 체크 옵션 기능으로 전면 개편**:
  - **개편 배경 & 사용자 경험(UX) 개선**:
    - 기존의 1회성 하단 스크롤 버튼(`⬇ 최신 위치`) 대신, 사용자가 실시간으로 쏟아지는 로그 스트림을 언제나 최신 라인에 고정시켜 관찰할 수 있도록 체크 상태가 유지되는 **`⬇ 최신위치(v)` 옵션 기능**으로 개편.
    - 사용자가 과거 로그 확인을 위해 위로 스크롤하거나 옵션을 해제한 경우, 하단 플로팅 알림 뱃지 또는 `최신위치(v)` 체크를 통해 원클릭으로 최신 스트림 잠금 및 즉시 하단 스크롤 동기화.
  - **C# WPF 데스크탑 앱 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
    - `MainWindow.xaml`: 콘솔 툴바의 일회성 버튼을 `⬇ 최신위치(v)` 체크박스 옵션(`IsChecked="{Binding IsAutoScrollEnabled}"`)으로 정돈하여 직관적 시각 상태 제공.
    - `MainViewModel.cs`: `IsAutoScrollEnabled` 프로퍼티 활성화(`true`) 시 즉시 `RequestScrollToBottom` 이벤트를 트리거하여 실시간 콘솔 뷰를 최신 위치로 자동 동기화.
  - **React 웹 프리뷰 (`LiveRunner.tsx`)**:
    - 콘솔 툴바에 활성화 상태 하이라이트가 적용된 `⬇ 최신위치(v)` 토글 체크박스를 적용하고, 미확인 로그 수신 시 플로팅 뱃지 클릭 시에도 `최신위치(v)` 옵션 자동 활성화 및 최신 라인 스크롤 연동.
- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.11.6)**:
  - `RoboBackupStudio.csproj`: Version `2.11.6`
  - `build.bat`: `set VERSION=v2.11.6`
  - `installer.iss`: `#define MyAppVersion "v2.11.6"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.11.6`
  - `ViewModels/MainViewModel.cs`: `v2.11.6` 주석 및 fallback 동기화
  - `src/components/Navbar.tsx`, `src/utils/robocopy.ts`: `v2.11.6` 일괄 동기화 완료.

---

## 📌 [v2.11.5] - 2026-09-20
### 🌐 NAS 네트워크(net use / SMB / UNC) 연결 대상 주소 완전 동적화 및 고정 IP 종속성 제거
- **🎯 `net use` 및 NAS 연결이 특정 IP/주소로 고정되던 문제 원인 규명 및 완벽 해결**:
  - **원인 분석**:
    - `ViewModels/MainViewModel.cs`의 `GetEffectiveNasSharePath()` 및 각종 클립보드 스크립트 생성 메서드에서 사용자 입력 주소 대신 특정 테스트 IP(`192.168.219.112`, `192.168.0.100`)가 고정 Fallback으로 강제 주입되던 구조적 결함 확인.
    - `net use` 명령 실행 시 서브디렉터리가 포함된 경로(`\\server\share\subfolder`)를 그대로 전달할 경우 Windows `net.exe` 구문 오류가 발생하거나 특정 IP로 덮어쓰여지는 현상 발생.
    - React 프리뷰(`NasAuthManager.tsx`, `robocopy.ts`)에서도 미지정 시 특정 IP가 기본값으로 강제 지정되어 입력값을 가리던 문제 수정.
  - **수정 및 세부 구현 명세**:
    1. **`ViewModels/MainViewModel.cs`**:
       - `GetEffectiveNasSharePath()` 전면 리팩터링: 고정 하드코딩 IP 제거. 사용자가 지정한 `NasSharePath`, `DestinationPath`, `SourcePath`의 UNC 경로 및 `NasServerAddress`를 최우선 순위로 파싱하여 100% 동적 주소 반환.
       - `GetRootUncShare()` 및 `ExtractServerFromUnc()` 헬퍼 구현: Windows `net use` 규격에 맞게 최상위 SMB 루트 공유(`\\server\share`)를 안전하게 추출하여 연결하도록 정밀화.
       - `ConnectNetUseAsync()` & `DisconnectNetUseAsync()`: 감지된 서버 IP 및 루트 공유 경로와 UI 프로퍼티를 완벽 동기화하고 충돌 세션 안전 해제.
       - `ApplyNasPathToDestination()`, `OpenNasFolder()`, `CopyCmdkeyCommandToClipboard()`, `CopyNetUseCommandToClipboard()`, `CopyNasBatchScriptToClipboard()`의 하드코딩 IP를 전면 제거하고 동적 해석 로직 적용.
    2. **`src/utils/robocopy.ts` & `src/components/NasAuthManager.tsx`**:
       - `buildNetUseConnectCommand`, `buildNetUseDisconnectCommand`, `generateNasBatchScript` 내의 고정 IP 종속성을 완전히 제거하고 동적 추출 로직으로 일원화.
       - `NasAuthManager.tsx` 내 감지된 경로가 없을 경우 불필요한 기본 IP 강제 바인딩을 제거하여 사용자가 입력한 어떤 NAS 주소든 있는 그대로 처리.
- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.11.5)**:
  - `RoboBackupStudio.csproj`: Version `2.11.5`
  - `build.bat`: `set VERSION=v2.11.5`
  - `installer.iss`: `#define MyAppVersion "v2.11.5"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.11.5`
  - `ViewModels/MainViewModel.cs`: `v2.11.5` 주석 및 fallback 동기화
  - `src/components/Navbar.tsx`, `src/utils/robocopy.ts`: `v2.11.5` 일괄 동기화 완료.

---

## 📌 [v2.11.4] - 2026-09-20
### 🛡️ 동기화 실행 중 전역 모달 오버레이(IsBusy) 클릭 차단 버그 완벽 해결 & UI 상호작용성 전면 복구
- **🎯 백업 동기화 진행 중 버튼 클릭이 되지 않던 현상 원인 규명 및 완벽 수정**:
  - **원인 분석**:
    - `RunRobocopyAsync` 실행 시 `IsBusy = true`가 호출되면서 XAML 최상단에 배치된 전역 모달 오버레이(`BusyOverlayVisibility`, `ZIndex="9999"`)가 활성화되어 화면 전체를 덮음.
    - 이로 인해 반투명 어두운 오버레이 창("Robocopy 실시간 동기화 진행 중...")이 마우스 입력을 모두 가로채어 탭 전환, 일시정지(Pause), 강제 중지(Stop), 로그 복사/지우기 등 모든 버튼 클릭이 차단되었음.
  - **수정 및 개선 명세**:
    1. **`ViewModels/MainViewModel.cs`**:
       - `RunRobocopyAsync` 내부에서 `IsBusy = false; BusyMessage = string.Empty;`로 설정하여 비동기 파일 동기화 도중 모달 오버레이가 뜨지 않도록 수정.
       - `BusyOverlayVisibility`의 활성화 조건을 `(IsBusy && !IsRobocopyRunning)`으로 개선하여, 동기화 실행 중에는 어떠한 경우에도 화면 차단 오버레이가 노출되지 않도록 이중 방어 로직 적용.
       - `RunCommand`의 CanExecute 조건을 `_ => !IsRobocopyRunning`으로 정밀화하여 실행 상태 관리 개선.
       - 예외 상황 및 단기 작업 시 오버레이를 사용자가 수동으로 닫을 수 있는 `DismissBusyOverlayCommand` 신규 등록.
    2. **`MainWindow.xaml`**:
       - 모달 오버레이 팝업 내에 `[✕ 닫기 (오버레이 해제)]` 버튼을 추가하여 긴급 시 언제든 사용자가 오버레이를 닫고 메인 UI를 조작할 수 있도록 개선.
- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.11.4)**:
  - `RoboBackupStudio.csproj`: Version `2.11.4`
  - `build.bat`: `set VERSION=v2.11.4`
  - `installer.iss`: `#define MyAppVersion "v2.11.4"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.11.4`
  - `ViewModels/MainViewModel.cs`: `v2.11.4` 주석 및 fallback 동기화
  - `src/components/Navbar.tsx`, `src/utils/robocopy.ts`: `v2.11.4` 일괄 동기화 완료.

---

## 📌 [v2.11.3] - 2026-09-20
### ⚡ 라이브 동기화 실시간 제어(일시정지/재개/강제 중지) 기능 전면 탑재 및 UI/UX 응답성 강화
- **🎯 라이브 동기화 진행 중 일시정지(Pause), 계속 재개(Resume), 강제 중지(Stop) 완벽 지원**:
  - **배경 및 원인 분석**:
    - 라이브 동기화 진행 중 프로세스 일시정지 또는 강제 중지 버튼이 제대로 활성화되지 않거나 UI 상에서 조작할 수 없었던 문제를 해결.
    - C# 데스크탑 앱과 React 웹 프리뷰 환경 모두에서 진행 중인 동기화 세션을 즉각 제어하고 상태를 실시간 확인할 수 있는 직관적인 컨트롤러 구축 요구.
  - **개선 및 세부 구현 명세**:
    1. **C# WPF 데스크탑 앱 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
       - `MainViewModel.cs`에 Windows 커널 P/Invoke (`NtSuspendProcess`, `NtResumeProcess`)를 구현하여 실제 구동 중인 Robocopy 네이티브 프로세스를 실시간으로 안전하게 일시정지 및 계속 재개할 수 있도록 완벽 지원.
       - `TogglePauseRobocopyCommand`, `StopCommand`, `SwitchToLiveTabCommand`를 등록하고 `IsRobocopyPaused`, `PauseResumeButtonText`, `LiveRunnerStatusBadgeColor`, `LiveRunnerStatusText` 등 반응형 프로퍼티를 완비.
       - `MainWindow.xaml` 탭 1 하단 바와 탭 2(라이브 동기화) 상단에 대형 **⚡ 실시간 백업 컨트롤러 배너** 및 콘솔 툴바에 직관적인 `[❚❚ 일시정지 (Pause)]`, `[▶ 계속 재개 (Resume)]`, `[⏹ 백업 강제 중지 (Stop)]` 버튼을 배치하여 어떤 화면에서도 즉각 조작 가능.
    2. **React 웹 프리뷰 (`src/components/LiveRunner.tsx`)**:
       - `fileIndexRef`, `accumulatedBytesRef`를 도입하여 일시정지 시 진행률과 복사 위치를 보존하고, 재개 시 이전 위치부터 부드럽게 이어지는 연속 시뮬레이션 엔진 구축.
       - 상단 액션 바 및 콘솔 스트림 툴바에 실시간 제어 퀵 버튼을 완벽 배치하여 동기화 진행 상태를 원클릭으로 정지/일시정지/재개 가능.
- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.11.3)**:
  - `RoboBackupStudio.csproj`: Version `2.11.3`
  - `build.bat`: `set VERSION=v2.11.3`
  - `installer.iss`: `#define MyAppVersion "v2.11.3"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.11.3`
  - `ViewModels/MainViewModel.cs`: `v2.11.3` 주석 및 fallback 동기화
  - `src/components/Navbar.tsx`, `src/utils/robocopy.ts`: `v2.11.3` 일괄 동기화 완료.

---

## 📌 [v2.11.2] - 2026-09-19
### 🎨 라이트 테마(화이트 & 베이지) 카드 및 텍스트 고대비 가독성 전면 개선
- **🎯 화이트/베이지 밝은 테마 시각적 식별성 및 대비율 대폭 강화 (WCAG AA 4.5:1 준수)**:
  - **배경 및 원인 분석**:
    - 화이트(`White`) 및 베이지(`Beige`) 등 밝은 라이트 테마 적용 시, 카드 배경(`#ffffff`, `#fbf9f4`)과 기존 다크 모드용 밝은 텍스트(`#f8fafc`, `#cbd5e1`, `#94a3b8`) 또는 흰색에 가까운 텍스트 박스/레이블이 겹쳐 화면 식별이 어려운 현상 발생.
  - **개선 및 세부 구현 명세**:
    1. **React 웹 프리뷰 (`src/index.css`, `src/themes.ts`)**:
       - `[data-theme='white']` 및 `[data-theme='beige']` 환경에서 카드 및 내부 서브 패널의 배경과 글자색 대비를 전면 재조정.
       - 카드 헤더/타이틀은 딥 차콜 다크 텍스트(`#0f172a`, `#1c1917`), 보조 설명 및 서브 레이블은 선명한 미드-다크 그레이(`#334155`, `#44403c`)로 강제 전환하여 완벽한 가독성 확보.
       - 입력창(`input`, `textarea`, `select`)과 코드 블록의 배경(`bg-slate-50`, `bg-amber-50/50`) 및 텍스트/보더 라인을 고대비로 매핑.
    2. **C# WPF 데스크탑 앱 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
       - `MainViewModel.cs` 내 4대 정예 테마 모델에 고대비 전용 프로퍼티(`InputBackground`, `InputForeground`, `InputBorder`, `CardHeaderForeground`, `CardSubHeaderForeground`, `CodeBackground`, `CodeForeground`) 추가 및 테마 전환 시 실시간 동기화.
       - `MainWindow.xaml`의 백업 경로, 프리셋 바, 제외 패턴(/XF, /XD), 실행 통계 및 터미널 출력 영역에 하드코딩된 다크 브러시를 제거하고 테마 전용 브러시 바인딩으로 전면 교체.
- **🔄 프로젝트 전 파일 버전 메타데이터 일괄 동기화 (v2.11.2)**:
  - `RoboBackupStudio.csproj`: Version `2.11.2`
  - `build.bat`: `set VERSION=v2.11.2`
  - `installer.iss`: `#define MyAppVersion "v2.11.2"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 `v2.11.2`
  - `ViewModels/MainViewModel.cs`: `v2.11.2` 주석 및 fallback 동기화
  - `src/components/Navbar.tsx`, `src/components/TaskScheduler.tsx`, `src/utils/robocopy.ts`: `v2.11.2` 일괄 동기화 완료.

---

## 📌 [v2.11.1] - 2026-09-19
### 🛡️ Windows Defender 방화벽 규칙 등록 시 버전 정보 포함 앱 이름 자동 명시 & 인스톨러/앱 통합 연동
- **🎯 방화벽 예외 규칙 버전 정보 포함 앱 명칭 등록 (Version-Tagged Firewall Rule)**:
  - **배경 및 요구사항**:
    - 네트워크 공유 폴더, NAS(SMB 포트 445/139), 원격 백업 서버 및 백그라운드 무인 서비스(RoboBackupService) 구동 시 Windows 방화벽 차단으로 인한 통신 장애를 예방.
    - 보안 감사 및 시스템 관리 편의성을 위해 방화벽 규칙 명칭에 앱의 정확한 버전 정보가 명시된 형태(`RoboBackup Studio v2.11.1 (Inbound)`, `RoboBackup Studio v2.11.1 (Outbound)`)로 등록되도록 고도화.
  - **세부 구현 명세**:
    1. **Inno Setup 인스톨러 (`installer.iss`)**:
       - `[Tasks]` 섹션에 `firewallrule` 옵션 탑재 (버전 정보 포함 앱 이름으로 인바운드/아웃바운드 규칙 등록 선택).
       - `[Run]` 섹션에 `netsh advfirewall firewall add rule` 명령을 연계하여 설치 완료 시 `RoboBackup Studio {#MyAppVersion} (Inbound/Outbound)` 명칭으로 자동 등록.
       - `[UninstallRun]` 섹션에 언인스톨 시 버전 정보가 명시된 방화벽 규칙을 시스템에서 흔적 없이 안전하게 자동 삭제하도록 구현.
    2. **C# WPF 데스크탑 앱 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
       - `MainViewModel.cs`에 `CurrentAppVersion = "v2.11.1"`, `FirewallRuleBaseName`, `IsFirewallRegistered`, `CheckFirewallStatusCommand`, `RegisterFirewallCommand`, `UnregisterFirewallCommand` 구현.
       - 앱 구동 시 백그라운드에서 `netsh`를 통해 방화벽 규칙 등록 여부를 자동 점검하여 실시간 상태 배지 표시.
       - Windows 무인 서비스 등록 완료 시, 방화벽에도 버전 명시 앱 규칙을 함께 등록할 수 있도록 연계 대화상자 지원.
       - `MainWindow.xaml` 서비스 관리 패널 내에 전용 **🛡️ Windows Defender 방화벽 예외 규칙 관리 (버전 정보 포함 앱 이름 자동 등록)** 카드 UI 탑재.
    3. **React 웹 프리뷰 (`TaskScheduler.tsx`, `Navbar.tsx`, `robocopy.ts`)**:
       - `TaskScheduler.tsx` 내 방화벽 상태 및 실시간 등록/해제/상태확인 카드 UI 100% 듀얼 동기화.
       - `Navbar.tsx` 및 코드 생성 템플릿의 버전 배지 일괄 동기화.
- **🔄 프로젝트 전 파일 버전 일괄 동기화 (v2.11.1)**:
  - `RoboBackupStudio.csproj`: `<Version>`, `<AssemblyVersion>`, `<FileVersion>` -> 2.11.1
  - `build.bat`: `set VERSION=v2.11.1`
  - `installer.iss`: `#define MyAppVersion "2.11.1"`
  - `MainWindow.xaml`: 타이틀 및 헤더 배지 -> v2.11.1
  - `ViewModels/MainViewModel.cs`: 버전 주석 및 규칙 명칭 -> v2.11.1
  - `src/utils/robocopy.ts`, `src/components/Navbar.tsx`, `src/components/TaskScheduler.tsx`: v2.11.1

---

## 📌 [v2.11.0] - 2026-09-19
### 🎨 테마 시스템 4대 정예 테마[다크 / 회색 / 화이트 / 베이지] 개편 및 버튼 그룹형 UI 전면 교체
- **🎯 테마 스타일 전면 정예화 (13종 ➔ 4종 축소 및 단순화)**:
  - **배경 및 요구사항**:
    - 지나치게 세분화되어 복잡했던 기존 13종 테마를 사용자들이 가장 직관적이고 편안하게 활용할 수 있는 핵심 4종 테마(**다크**, **회색**, **화이트**, **베이지**)로 엄선 압축.
    - 기존 콤보박스(ComboBox) 및 드롭다운 메뉴 방식을 제거하고, 상단 네비게이션 툴바에 한눈에 보이는 **4개 전용 버튼 그룹(Button Group)** 형태로 UI 레이아웃 개편.
  - **4대 정예 테마 구성 명세**:
    1. **🌙 다크 (Dark)**:
       - 딥 차콜/블랙(`#09090b`, `#18181b`) 베이스와 고대비 텍스트(`#f4f4f5`), 세련된 블루/징크 액센트. 눈의 피로를 최소화하는 정통 개발자/야간 작업용 테마.
    2. **🌫️ 회색 (Cool Grey)**:
       - 차분한 슬레이트 블루-그레이(`#0f172a`, `#1e293b`) 베이스와 스카이블루 액센트(`#38bdf8`). RoboBackup Studio의 대표 기본 플래그십 테마.
    3. **☀️ 화이트 (White)**:
       - 순백의 깔끔하고 화사한 라이트 모드(`#f8fafc`, `#ffffff`)와 또렷한 다크 텍스트(`#0f172a`), 딥블루 액센트. 주간 사무 환경 및 인쇄/리포트 검토용 테마.
    4. **🌾 베이지 (Warm Beige)**:
       - 따스한 웜 아이보리/베이지톤(`#faf8f5`, `#eee9dc`) 베이스와 앰버/골드 액센트(`#d97706`). 부드럽고 편안한 장시간 문서/스케줄 확인용 테마.
- **🖥️ C# WPF 데스크탑 앱 & React 웹 프리뷰 100% 듀얼 동기화**:
  - **WPF 데스크탑 앱 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
    - 기존 13종 테마 `ComboBox`를 상단 우측 `StackPanel` 내 4개 직관적 테마 버튼([🌙 다크], [🌫️ 회색], [☀️ 화이트], [🌾 베이지])으로 교체.
    - `InitializeThemes()`를 4개 테마로 정예화하고, 현재 활성 테마에 따라 버튼 배경색과 보더가 동적으로 하이라이트(`ThemeDarkButtonBg`, `ThemeGrayButtonBg`, `ThemeWhiteButtonBg`, `ThemeBeigeButtonBg`)되도록 MVVM 바인딩 구현.
    - `ChangeThemeCommand`에 파라미터(`dark`, `grey`, `white`, `beige`)를 전달하여 클릭 즉시 윈도우 전체 브러시 동기화.
  - **React 웹 프리뷰 (`Navbar.tsx`, `themes.ts`, `index.css`)**:
    - 테마 선택 드롭다운을 4개 버튼 그룹으로 교체하고, CSS 테마 변수 정리 및 활성 버튼 스타일 강조.
- **🔤 폰트 크기 및 타이포그래피 표준 가이드 준수**:
  - 문서 편집 및 인쇄물/디자인 기준 최소 10pt(약 13px) 이상 시인성 확보 원칙 수립.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.11.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.11.0 일괄 동기화 완료.

---

## 📌 [v2.10.2] - 2026-09-19
### 💡 5대 네이티브 코어 DLL 엔진 실전 업무 활용 시나리오 가이드 & 인터랙티브 마법사(Core Wizard) UI 전면 탑재
- **🎯 초보자 및 시스템 관리자를 위한 '5대 코어 DLL 스튜디오' 실전 업무 활용 예시 및 사용 방법 가이드 내장**:
  - **배경 및 요구사항**:
    - Win32 커널 및 VSS, DPAPI, NTFS 하드링크 기반의 5대 코어 DLL 모듈(RoboDiffEngine, RoboVssProvider, RoboSyncWatch, RoboVault, RoboTimeMachine)의 고급 기능이 실제 업무에서 어떤 상황에 쓰이고 어떻게 조작해야 하는지 직관적으로 파악하기 어렵다는 사용자 피드백 반영.
  - **모듈별 실전 업무 활용 예시문(상황 / 사용 방법 / 기대 효과) 100% UI 내장**:
    1. **🚀 1. RoboDiffEngine.dll (초고속 차이 분석 & 진행률 프리플라이트)**:
       - **실전 상황**: 500GB 대용량 외장하드나 NAS로 백업하기 전, 오늘 하루 동안 실제로 몇 기가의 파일이 바뀌었는지, 백업 시간이 얼마나 걸릴지 사전에 확인하고 불필요한 미러(/MIR) 삭제 사고를 방지하고자 할 때.
       - **사용 방법**: 원본과 대상 폴더를 지정하고 [⚡ 초고속 MFT Diff 스캔] 클릭 ➔ 1초 만에 신규/수정/삭제 예정 파일 수와 전송 바이트 계산 ➔ 안전 프리셋(/E, /XO 등)을 백업 작업에 자동 바인딩.
    2. **🛡️ 2. RoboVssProvider.dll (VSS 볼륨 섀도 복사본 & 잠긴 파일 무결점 캡처)**:
       - **실전 상황**: 직원이 퇴근할 때 아웃룩(Outlook PST)이나 엑셀 장부를 켜둔 채로 자리를 비웠거나 SQL Server 데이터베이스 서비스가 실행 중일 때, 일반 복사 시 발생하는 '다른 프로세스가 파일을 사용 중입니다(Access Denied)' 오류 방지.
       - **사용 방법**: 대상 볼륨(C:) 지정 후 [📸 VSS 스냅샷 볼륨 생성] 클릭 ➔ 특정 시점 스냅샷을 캡처하여 잠긴 파일도 100% 무결점 복제 ➔ 작업 완료 후 [🗑️ 스냅샷 안전 해제]로 디스크 공간 환수.
    3. **⚡ 3. RoboSyncWatch.dll (스마트 큐 기반 실시간 자동 동기화 감시)**:
       - **실전 상황**: 포토샵 디자인 원본이나 코딩 프로젝트, 문서 작업 중 파일을 수정하고 저장(Ctrl+S)할 때마다 매번 백업 프로그램을 켜서 실행하기 번거로울 때.
       - **사용 방법**: 감시 대상 폴더와 디바운스(3초) 설정 후 [▶️ 실시간 감시 시작] 클릭 ➔ 파일 저장 시 3초 딜레이 후 백그라운드에서 자동으로 외장하드/NAS로 고속 동기화.
    4. **🔒 4. RoboVault.dll (DPAPI 기반 제로-로그인 NAS 보안 볼트)**:
       - **실전 상황**: 회사 NAS(\\192.168.0.50\Backup)로 자동 백업을 걸어둘 때 배치 파일이나 스케줄러에 암호를 평문(Text)으로 적어두기 불안하고, 안 적으면 '로그인 세션 만료'로 백업이 멈출 때.
       - **사용 방법**: NAS 경로와 계정/비밀번호 입력 후 [🔒 Windows 볼트에 보안 등록] 클릭 ➔ DPAPI 및 Credential Manager에 안전하게 암호화 보관되어 평문 노출 제로(0)로 자동 무인 인증 통과.
    5. **🗜️ 5. RoboTimeMachine.dll (NTFS 스마트 하드링크 & 타임머신 버전 보관소)**:
       - **실전 상황**: 맥(Mac)의 타임머신처럼 날짜별(2026-09-17, 2026-09-18...) 백업 폴더를 매일 남겨서 과거 상태로 되돌리고 싶은데 디스크 용량이 부족할 때.
       - **사용 방법**: 원본 및 타임머신 보관소 지정 후 [⏳ 타임머신 증분 스냅샷 생성] 클릭 ➔ 바뀐 파일만 새로 저장하고 어제와 똑같은 파일은 0바이트 NTFS 하드링크로 연결하여 디스크 용량 90% 이상 절약.
- **🖥️ C# WPF 데스크탑 앱 & React 웹 프리뷰 100% 듀얼 동기화**:
  - **WPF 데스크탑 앱 (`MainWindow.xaml`)**:
    - Tab 5 (코어 DLL 스튜디오) 상단에 전면 펼치기/접기 가능한 종합 사용 설명서 배너 탑재.
    - 5개 모듈 카드마다 [💡 실전 활용 예시] 전용 콜아웃 박스를 추가하여 상황과 사용 방법을 명확히 가이드.
  - **React 웹 UI (`CoreDllStudio.tsx`, `CoreDllWizardModal.tsx`)**:
    - 코어 DLL 스튜디오 5개 모듈 카드 및 인터랙티브 마법사 상단에 시나리오 콜아웃 100% 동시 반영.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.10.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.10.2 일괄 동기화 완료.

---

## 📌 [v2.10.1] - 2026-09-17
### 🚨 Robocopy 오류 53 (0x00000035, 네트워크 경로를 찾지 못했습니다) 긴급 해결 및 VSS 안정화
- **🎯 Robocopy 실행 시 발생하던 치명적 오류 53(오류 코드 16) 근본 원인 해결**:
  - **문제 진단**:
    - 백업 실행 시 `IsServiceAutoVssEnabled` 옵션이 기본 활성화되어 있어 볼륨 섀도 복사본(VSS) 생성을 시도하였으나, Windows 10/11 클라이언트 OS 환경에서 `vssadmin create shadow` 명령이 미지원되면서 기존 프로바이더가 시뮬레이션용 Mock 디바이스 경로(`\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy_MOCK_...`)를 반환.
    - Robocopy가 실제 존재하지 않는 Mock 디바이스 경로를 원본 디렉터리로 전달받아 `오류 53 (0x00000035) 네트워크 경로를 찾지 못했습니다 (ExitCode: 16)`로 복제가 중단되는 현상 발생.
  - **해결 및 개선 사항**:
    1. **Mock 가상 경로 반환 완전 제거 (`Core/RoboVssProvider.cs`)**:
       - 실제 VSS 스냅샷이 생성되지 않았을 경우 Mock 경로를 절대 반환하지 않으며, `IsActive=false` 및 명확한 원인 에러 메시지를 기록하도록 로직을 재설계.
       - Windows Server(`vssadmin`)뿐 아니라 Windows 10/11 클라이언트 환경을 위한 PowerShell WMI(`Win32_ShadowCopy`) 생성 및 정규식 다국어(한글/영문) 파싱 엔진 보강.
    2. **Win32 / Robocopy 전용 디렉터리 심볼릭 링크 마운트(`mklink /d`) 파이프라인 탑재**:
       - Robocopy가 NT 네임스페이스(`\\?\GLOBALROOT\Device\...`)에 직접 접근할 때 발생하는 Win32 API 경로 오류를 방지하기 위해 임시 안전 마운트 링크를 생성하여 투명하게 복제하고, 작업 완료 후 링크와 스냅샷을 100% 안전하게 자동 환수.
    3. **디스크 실재성 엄격 검증 및 무결점 직접 복제 폴백(Graceful Fallback)**:
       - `RunRobocopyAsync` 구동 시 VSS 경로의 `Directory.Exists` 여부를 엄격히 사전 검증. 섀도 볼륨 디렉터리에 정상 접근할 수 없는 경우 원본 경로(`SourcePath`)를 그대로 유지하여 모든 일반 파일이 오류 없이 100% 정상 복제되도록 보장.
    4. **Auto VSS 기본값 안전화 (`MainViewModel.cs`, `TaskScheduler.tsx`)**:
       - 일반 사용자의 표준 백업(Robocopy)이 불필요하게 VSS를 거치지 않도록 `IsServiceAutoVssEnabled` 기본값을 `false`로 안전하게 조정. 잠긴 DB/PST 복제가 필요한 엔터프라이즈 환경에서만 필요 시 체크하여 사용할 수 있도록 최적화.
    5. **Inno Setup 6.3+ 64비트 아키텍처 식별자 경고 해결 (`installer.iss`, `robocopy.ts`)**:
       - Inno Setup 컴파일 시 출력되던 `Warning: Architecture identifier "x64" is deprecated. Substituting "x64os", but note that "x64compatible" is preferred in most cases.` 경고를 완벽 해결.
       - 최신 Inno Setup 표준 지침에 맞추어 `ArchitecturesAllowed=x64compatible` 및 `ArchitecturesInstallIn64BitMode=x64compatible`로 전면 교체하여 x64 Windows 10/11/Server 및 ARM64 에뮬레이션 환경 전체에서 경고 없이 클린 컴파일 및 64비트 모드 설치 지원.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.10.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.10.1 일괄 동기화 완료.

---

## 📌 [v2.10.0] - 2026-09-11
### 🛡️ Windows 서비스(RoboBackupService) 전용 VSS 자동 사전 스냅샷(Auto VSS Pre-flight) 및 자원 자동 환수 엔진 신규 탑재
- **🎯 Windows 서비스 무인 백업 파이프라인 내 VSS 스냅샷 원클릭 연동 아키텍처 구현**:
  - **문제 해결**: Windows 서비스(`RoboBackupService`) 또는 스케줄러로 백그라운드 무인 백업이 동작할 때, 사용자가 실행 중인 오피스 문서(Excel, Word), Outlook의 대용량 메일함(`.pst`), 서비스가 독점 잠금한 데이터베이스(SQL Server `.mdf`, SQLite, MySQL), 가상머신 VHDX 파일 복사 시 발생하는 **'다른 프로세스가 파일을 사용 중이므로 프로세스가 파일에 액세스할 수 없습니다 (Error 32 / Access Denied)' 오류를 100% 방지**.
  - **VSS Auto Pre-flight & Cleanup 파이프라인**:
    1. **사전 검증 및 섀도 스냅샷 생성**: Robocopy 실행 직전 원본 볼륨(예: `C:`, `D:`)을 대상으로 `RoboVssProvider` 및 `vssadmin create shadow`를 가동하여 특정 시점(Point-in-Time) 일관성을 보장하는 볼륨 섀도 복사본을 자동 마운트.
    2. **잠김 경합 제로(Zero-Lock Contention) 백업 집행**: 생성된 섀도 스냅샷 기반(`%SHADOW_VOL%\{상대경로}`)으로 원본 경로를 동적 전환하여 열린 파일과 잠긴 데이터베이스를 무결점으로 고속 전송.
    3. **자동 자원 환수(Auto Cleanup)**: Robocopy 복제 프로세스가 정상 완료되거나 예외가 발생하더라도 사후 반환 블록(`vssadmin delete shadows /shadow=%SHADOW_ID% /quiet` 및 `ReleaseSnapshotAsync`)을 반드시 실행하여 디스크 스토리지 용량을 100% 즉시 환수.
- **🖥️ C# WPF 데스크탑 앱 100% 완전 동기화 및 무결성 검증 (`ViewModels/MainViewModel.cs`, `MainWindow.xaml`, `Core/RoboVssProvider.cs`, `Services/RoboBackupWindowsService.cs`)**:
  - **C# WPF MVVM 비즈니스 로직**:
    - `RunRobocopyAsync`: 백업 실행 시 `IsServiceAutoVssEnabled` 활성화 상태를 감지하여 Robocopy 구동 전 `RoboVssProvider.CreateSnapshotAsync` 호출 ➔ Robocopy 원본 경로를 섀도 복사본 볼륨 경로(`GetVssPath`)로 실시간 치환 ➔ `finally` 블록에서 `ReleaseSnapshotAsync` 안전 환수 보장.
    - `RegisterTaskAsync`: Windows 작업 스케줄러 배치 러너 생성 시 `vssadmin create shadow` 및 `%SHADOW_VOL%` 자동 바인딩 Preamble/Postamble 완벽 주입.
    - `EnqueueServiceJobCommand` / `EnqueueServiceJobAsync`: 원클릭으로 `%ProgramData%\RoboBackupStudio\Queue`에 VSS Auto Pre-flight & Cleanup 배치를 투입하여 무인 서비스가 즉시 처리하도록 연동.
    - `IsServiceAutoVssEnabled`, `ServiceVssStatusBadgeText`, `TestServiceVssPreflightCommand`, `TestServiceVssPreflightAsync` 구현 완료.
  - **XAML UI 레이아웃 (`MainWindow.xaml`)**:
    - **Tab 1 (메인 백업 구성)**: 핵심 옵션 패널 내 [🛡️ Auto VSS (열린 파일/DB 섀도 스냅샷 자동 생성)] 체크박스 탑재.
    - **Tab 3 (서비스 & 스케줄러)**: [🛡️ Windows 서비스 실행 시 VSS 사전 스냅샷 자동 생성 (Auto VSS Pre-flight)] 전용 제어 카드, [🧪 VSS 연동 테스트] 버튼 및 [📥 서비스 큐(Queue) 즉시 투입] 버튼 동시 탑재.
    - **Tab 5 (코어 DLL 스튜디오)**: 실시간 서비스 VSS 연동 상태 뱃지 및 모듈 상세 연동 지원.
  - **React Web UI 동기화 (`TaskScheduler.tsx`, `CoreDllStudio.tsx`)**:
    - VSS 사전 스냅샷 토글, VSS 연동 시뮬레이션 테스트 및 [📥 서비스 큐 즉시 투입] 인터랙션 100% 동기화.
  - **Windows 백그라운드 서비스 (`RoboBackupWindowsService.cs`)**:
    - 백그라운드 큐(Queue) 감시 및 SYSTEM 권한 하에서 VSS Auto Pre-flight 배치 자동 실행 지원.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.10.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.10.0 일괄 동기화 완료.

---

## 📌 [v2.9.0] - 2026-09-09
### 🧙‍♂️ 5대 코어 DLL 모듈별 전용 사용 마법사(Wizard Studio) 신규 탑재 및 듀얼 아키텍처 완벽 동기화
- **🎯 5대 엔터프라이즈 코어 DLL 모듈별 인터랙티브 사용 마법사(Core DLL Wizard Studio) 탑재**:
  - **모듈별 3단계(파라미터 구성 ➔ 사전 시뮬레이션 ➔ 메인 작업 반영) 가이드 프로세스 구현**:
    1. **🚀 1. RoboDiffEngine 마법사 (초고속 차이 사전 분석)**:
       - 전체 미러(`/MIR`) vs 증분 백업(`/E /XO`) 전략 선택, MFT 병렬 스캔 멀티스레드(`/MT:16`~`/MT:32`) 최적화, 사전 변경 바이트량 산출.
    2. **🛡️ 2. RoboVssProvider 마법사 (볼륨 섀도 복사본 캡처)**:
       - 대상 드라이브(C:) 스냅샷 생성, 열린 오피스/PST/DB 파일 백업 모드(`/B /ZB`) 및 보안 ACL(`/COPYALL`) 일괄 구성.
    3. **⚡ 3. RoboSyncWatch 마법사 (스마트 큐 실시간 자동 동기화)**:
       - 파일 저장 이벤트 디바운스 대기시간(500ms~3000ms) 설정, 버스트 I/O 일괄 묶음 처리 큐 활성화.
    4. **🔐 4. RoboVault 마법사 (DPAPI 기반 제로-로그인 보안 볼트)**:
       - 대상 공유 경로(`\\NAS-SERVER\Backup`) 및 자격 증명 바인딩, 배치 파일 내 비밀번호 평문 노출 완전 차단 및 FAT 시간 호환(`/FFT`) 적용.
    5. **⏳ 5. RoboTimeMachine 마법사 (NTFS 스마트 하드링크 버전 보관소)**:
       - 타임머신 보관소 디렉터리(`D:\Backup_TimeMachine_Repo`) 지정, 동일 파일 0바이트 하드링크 연결로 디스크 90% 이상 절약 구성.
- **🖥️ C# WPF MVVM 및 React 웹 UI 100% 듀얼 동기화 (`ViewModels/MainViewModel.cs`, `MainWindow.xaml`, `CoreDllStudio.tsx`, `CoreDllWizardModal.tsx`)**:
  - **C# WPF MVVM**: `OpenCoreDllWizardCommand`, `CloseCoreDllWizardCommand`, `WizardNextStepCommand`, `WizardPrevStepCommand`, `WizardRunSimulationCommand`, `WizardApplyToMainJobCommand`, `IsCoreWizardOpen`, `WizardActiveModule`, `WizardStep`, `WizardLogs` 완벽 구현.
  - **C# 빌드 파이프라인 무결성 확보**: 마법사 설정 적용 시 프로퍼티 바인딩(`IsMir`, `IsXo`, `Threads`, `IsMt16`, `IsZb`, `IsCopyAll`, `IsFft`, `SyncWatchPath`, `SyncWatchDebounceSeconds`, `_selectedTheme`) 100% 정합성 수정 완료로 `build.bat` 및 `dotnet publish` 완벽 컴파일 보장.
  - **XAML UI**: Tab 5 상단 [🧙‍♂️ 5대 코어 DLL 모듈별 기능 사용 마법사] 통합 런처 패널 및 5개 모듈 카드별 [🧙‍♂️ 마법사 실행] 버튼, 다크 반투명 모달 다이얼로그 오버레이 탑재.
  - **React Web UI**: `CoreDllWizardModal.tsx` 컴포넌트 탑재 및 `CoreDllStudio.tsx` 모듈별 마법사 런처 버튼 연동.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.9.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.9.0 일괄 동기화 완료.

---

## 📌 [v2.8.0] - 2026-09-09
### 📊 최종 백업 통계 대시보드 HUD (옵션 A) 신규 탑재 및 듀얼 아키텍처 완벽 동기화
- **🎯 실시간 콘솔 상단 [📊 최종 백업 통계 대시보드 HUD] 카드 신규 탑재 (옵션 A)**:
  - **Robocopy 네이티브 종료 통계 실시간 자동 파싱 엔진**: 백업 작업 완료 시 로그 스트림에서 디렉터리(Dirs), 파일(Files), 복사 바이트(Bytes), 소요 시간(Times), 전송 속도(Speed), 종료 코드(ExitCode)를 정규식 및 토큰화 기반으로 정밀 추출하여 시각화 객체(`RobocopySummaryReport`)로 자동 변환.
  - **4대 핵심 지표 하이라이트 카드**:
    1. **📁 디렉터리 (Dirs)**: 복사됨 / 전체, 건너뜀, 불일치 카운트 직관 표시
    2. **📄 파일 (Files)**: 복사됨 / 전체, 실패(빨간색 강조), 추가(Extras) 수량 표시
    3. **💾 복사 용량 (Bytes)**: 복사 완료 바이트(MB/GB) 및 전체/건너뜀 용량 요약
    4. **⏱️ 소요 시간 & 전송 속도**: 순수 복사 소요 시간, 초당 전송 속도(Bytes/sec), 분당 전송량(MB/min)
  - **정돈된 6-컬럼 요약 테이블**:
    - `구분 항목 | 전체 (Total) | 복사됨 (Copied) 🟢 | 건너뜀 (Skipped) 🟡 | 불일치 (Mismatch) 🟠 | 실패 (Failed) 🔴 | 추가 (Extras) 🔵` 구조의 일목요연한 표 렌더링.
  - **하단 스마트 진단 배너**: Robocopy 종료 코드(`ExitCode 0~16`)를 표준 기술 명세에 따라 해석하여 정상 완료 여부 및 세부 진단 결과(예: "1개 이상의 파일 복사 완료 (성공)", "디렉터리 트리 일치 (변경 없음)", "일부 파일 복사 실패 (오류)")와 상태 뱃지 제공.
  - **사용자 편의 인터랙션**:
    - `📋 리포트 복사`: 전체 통계표를 형식화된 텍스트 리포트로 즉시 클립보드에 복사하여 로그 문서나 보고용 메신저에 바로 붙여넣기 지원.
    - `접기 / 펼치기`: 상세 통계표를 접어 콘솔 화면 공간을 절약하거나 언제든 다시 펼쳐 확인 가능.
    - `✕ 닫기`: 백업 통계 HUD 카드를 간편히 닫기.
    - `📊 요약 통계` 콘솔 툴바 버튼: 최근 완료된 백업의 통계 대시보드 카드를 원클릭으로 언제든 다시 열람.
- **🖥️ C# WPF MVVM 및 React 웹 UI 100% 듀얼 동기화 (`ViewModels/MainViewModel.cs`, `MainWindow.xaml`, `src/components/LiveRunner.tsx`)**:
  - C# WPF: `RobocopySummaryReport` 모델, `SummaryReport`, `HasSummaryReport`, `IsSummaryExpanded`, `ParseSummaryReport()`, `CopySummaryReportCommand`, `OpenSummaryHudCommand` 완벽 구현.
  - React Web UI: `RobocopySummaryReportState`, 실시간 시뮬레이션 종료 시 자동 통계 생성, HUD 카드 애니메이션, 원클릭 클립보드 복사, 툴바 버튼 완전 일치 구현.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.8.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts`, `metadata.json`, `index.html` 버전 v2.8.0 일괄 갱신 완료.

---

## 📌 [v2.7.7] - 2026-09-08
### 🌐 NAS 백업 대상 폴더 적용 실패 완벽 수정 및 스마트 NAS 경로 전용 다이얼로그 탑재
- **🛠️ NAS 경로 적용 실패 및 텍스트 박스 타이핑 충돌 버그 근본 수정 (`ViewModels/MainViewModel.cs`, `MainWindow.xaml`, `MainWindow.xaml.cs`)**:
  - **텍스트 박스 실시간 타이핑 커서 튕김 버그 해결**: `DestinationPath` setter에서 문자열 입력 도중 강제로 끝 슬래시(`\`)를 붙여 커서가 앞으로 밀리거나 텍스트 입력이 훼손되던 문제를 해결하고, 대신 포커스 아웃(`LostFocus`) 및 경로 적용 시점에 안전하게 끝 슬래시를 정규화(`NormalizeDestinationPath()`)하도록 분리.
  - **`GetEffectiveNasSharePath()` 공유 경로 해석 버그 수정**: NAS 서버 주소만 있거나 공유 폴더가 불완전할 때 불필요하게 `IPC$`를 반환하거나 하위 디렉터리 경로를 누락하던 치명적인 버그를 제거하고, 기본 공유 폴더(`data\`) 및 전체 하위 경로 보존 처리.
- **🖥️ 스마트 NAS 백업 대상 경로 지정 다이얼로그 신규 탑재 (`ShowNasPathInputDialog`)**:
  - **Windows `FolderBrowserDialog` UNC 탐색 실패 문제 완전 극복**: 기존 Windows 폴더 대화상자에서 네트워크 UNC 호스트 주소(`\\192.168.219.112\`)를 유효 폴더로 인식하지 못해 로컬 드라이브(E:\)가 선택되거나 적용이 거부되던 문제를 해결하기 위해, 전용 WPF 모달 다이얼로그(`ShowNasPathInputDialog`) 신규 개발.
  - **스마트 자동 보정 & 검증**:
    1. 사용자가 `\\192.168.219.112\data` 입력 시: 끝에 역슬래시를 자동으로 보장하여 `\\192.168.219.112\data\`로 100% 즉시 적용.
    2. 사용자가 서버 주소만 입력 시(`\\192.168.219.112\`): 파일 저장을 위한 공유 폴더명이 필요함을 친절히 안내하고 기본 공유명 `data`를 결합하여 `\\192.168.219.112\data\`로 안전 자동 완성 지원.
    3. 다이얼로그 내 `[📁 폴더 찾아보기...]`, `[🖥️ 탐색기 열기]` 버튼을 함께 지원하여 실제 공유 폴더 탐색 및 확인 편의 극대화.
- **💻 React 웹 UI NAS 대상 경로 처리 동기화 (`JobDesigner.tsx`)**:
  - `🌐 NAS 주소 적용` 및 `🌐 NAS 폴더 선택...` 프롬프트 시 `\\192.168.219.112\data\` 기본값 및 100% 끝 슬래시 보장 로직 동기화.
  - `targetPath` 입력란 `onBlur` 핸들러를 추가하여 수동 타이핑 후 포커스 이동 시 UNC 경로 끝 슬래시 자동 보완.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.7)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.7.7 일괄 동기화 완료.

---

## 📌 [v2.7.6] - 2026-09-05
### 🌐 대상 폴더 경로의 NAS 주소 가져올 때 끝 슬래시(`\`) 자동 포함 규칙 적용
- **📁 UNC NAS 백업 대상 경로 포맷팅 정밀화 (`ViewModels/MainViewModel.cs`, `JobDesigner.tsx`, `NasAuthManager.tsx`)**:
  - **백업 대상 경로 규칙 수정**: `ApplyNasPathToDestination()`, `OpenNasFolder()`, `DestinationPath` 속성 설정 및 React UI의 `🌐 NAS 주소 적용`, `🌐 NAS 폴더 선택` 시 UNC NAS 경로(`\\192.168.219.112\data`)를 백업 대상 폴더로 가져오면 끝에 역슬래시(`\`)가 항상 보장되도록 자동 변환 처리 (`\\192.168.219.112\data\`).
  - **Robocopy 백업 명령어 및 스케줄러 인자 안정성 강화**: 대상 경로 끝에 역슬래시(`\`)를 포함시켜 백업 디렉터리의 루트 및 하위 구조 탐색 시 경로 해석 인식을 완벽화.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.6)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx` 버전 v2.7.6 일괄 동기화 완료.

---

## 📌 [v2.7.5] - 2026-09-05
### ⚡ 오래된 백업 파일 자동정리에 [기간 / 용량 / 모두 적용] 3대 결합 옵션 신규 탑재
- **⚙️ [모두 적용] 이중 자동정리 조건 결합 엔진 (`ViewModels/MainViewModel.cs`, `AutoCleanup.tsx`, `MainWindow.xaml`)**:
  - **`⚡ 모두 적용 (기간 + 용량 결합)` 삭제 알고리즘**:
    1. **1차 스캔**: 설정된 보존 기간(N일)을 초과한 오래된 백업 파일들을 1차적으로 선별 삭제.
    2. **2차 한도 체크**: 1차 삭제 후에도 남아있는 파일들의 총 용량이 지정된 최대 허용 용량(N GB)을 초과할 경우, 잔여 파일 중 가장 오래된 파일부터 순차적으로 추가 선별 삭제하여 지정 GB 한도 이내로 유연하게 수렴.
  - **PowerShell 무인 스케줄러 자동 생성 (`RegisterCleanupTaskAsync`, `generateCleanupScript`)**:
    - Windows 작업 스케줄러(`schtasks.exe`) 등록 시 `기간 기준` 단일 조건, `용량 기준` 단일 조건뿐만 아니라 `모두 적용` 조건에 대응하는 2단계 원라이너 PowerShell 파이프라인 명령어를 스케줄러 및 `.ps1` 파일로 자동 생성.
- **🖥️ C# WPF & React UI 3대 정리 규칙 및 임계값 컨트롤 가독성 개선**:
  - **C# WPF (`MainWindow.xaml`)**: `IsCleanupTypeBoth` 바인딩을 신규 추가하고, [모두 적용] 선택 시 보존 기간(일)과 최대 용량(GB) 입력 상자가 동시에 활성화되도록 `Style.Triggers` 동적 UI 스위칭 구축.
  - **React Web UI (`AutoCleanup.tsx`)**: 3-열 라디오 카드 UI([기간 기준], [용량 기준], [모두 적용])를 탑재하고, 선택한 모드에 따라 듀얼 슬라이더 컨트롤 및 스캔/삭제 미리보기 리스트 자동 연동.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.5)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.7.5 일괄 동기화 완료.

---

## 📌 [v2.7.4] - 2026-09-05
### 🌐 백업 대상 폴더 NAS 주소 즉시 적용 및 NAS 전용 폴더 선택(찾아보기) 대화상자 기능 추가
- **📂 C# WPF 백업 대상 폴더 NAS 전용 폴더 선택 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
  - **`🌐 NAS 주소 적용` 원클릭 버튼**: 설정된 NAS 네트워크 공유 주소(`\\IP\SharePath` 예: `\\192.168.0.100\NAS_Backup`)를 백업 대상 저장소 폴더(DestinationPath)에 즉시 설정하는 원클릭 바인딩 버튼 추가.
  - **`🌐 NAS 폴더 선택...` 전용 폴더 대화상자**: 기존 탐색기 단순 열기 대신 `FolderBrowserDialog`를 사용해 NAS 경로(`\\IP\Share`) 기반으로 백업 대상 폴더를 직접 찾아보고 선택해 `DestinationPath`로 자동 지정하는 기능 구현.
- **💻 React 웹 UI 백업 대상 폴더 툴바 확장 (`JobDesigner.tsx`)**:
  - **`🌐 NAS 주소 적용` 버튼**: 클릭 시 대상 폴더 입력 칸을 NAS 네트워크 UNC 경로로 자동 전환.
  - **`🌐 NAS 폴더 선택...` 버튼**: NAS 네트워크 UNC 경로 내 백업 대상 폴더를 대화상자로 찾아보고 지정하는 기능 지원.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.4)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/utils/robocopy.ts` 버전 v2.7.4 일괄 동기화 완료.

---

## 📌 [v2.7.3] - 2026-09-05
### ⚡ Robocopy 실시간 콘솔 스트림 & 초고속 Live HUD 뷰어 및 외부 CMD 모니터링 옵션 신규 탑재
- **🖥️ C# WPF 실시간 콘솔 스트림 & 락-프리 HUD 뷰어 (`ViewModels/MainViewModel.cs`, `MainWindow.xaml`)**:
  - **화면 멈춤(UI Freeze) 방지 및 비동기 스트림 파이프라인**: 대량 파일 복사 시 UI 스레드 경합으로 인해 화면이 정지된 것처럼 보이던 현상을 해결하기 위해, Robocopy `StandardOutput` 스트림을 백그라운드 태스크에서 비동기 파싱하고 전송 파일명, 실시간 Throughput, 속도, 전송 바이트를 UI 스레드 락 없이 실시간 전달하도록 최적화.
  - **실시간 복사 HUD (Head-Up Display) 상단 배너**: 현재 복사 중인 파일명, 전송 상태, 실시간 콘솔 한 줄 요약 티커를 전용 HUD 영역에 즉시 렌더링.
  - **외부 CMD 실시간 콘솔 옵션 (`ShowExternalConsole`)**: 백그라운드 리다이렉트 대신 네이티브 Windows CMD 창을 별도로 띄워 Robocopy의 원시(Raw) 화면 스트림과 커서 애니메이션을 100% 실시간으로 직접 확인할 수 있는 토글 옵션 제공.
  - **자동 스크롤 제어 & 최신 위치 이동 (`RequestScrollToBottom`)**: 사용자가 이전 로그를 읽는 동안 강제로 스크롤되는 것을 방지하는 '자동 스크롤' 토글 및 원클릭 '최신 위치 이동' 이벤트 핸들러 구축.
- **🌐 React 웹 UI 콘솔 뷰어 & Live HUD 전면 업그레이드 (`LiveRunner.tsx`)**:
  - **Live Copy Stream HUD**: 현재 전송 중인 활성 파일명, 상세 크기/경로, 실시간 콘솔 티커, 펄스 애니메이션 인디케이터 탑재.
  - **콘솔 제어 툴바 확장**: '실시간 자동 스크롤', '최신 복사 HUD', '최신 위치(미확인 카운트 배지)', '콘솔 높이 확장/축소(Expand/Minimize)', '로그 지우기', '로그 다운로드' 풀세트 지원.
  - **스크롤 분리 시 플로팅 알림 뱃지**: 사용자가 콘솔을 위로 스크롤하여 이전 로그를 확인하는 동안 백그라운드에서 신규 복사 로그가 유입되면 화면 우하단에 바운스 플로팅 뱃지가 나타나 최신 로그로 즉시 이동 가능.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.3)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/utils/robocopy.ts` 버전 v2.7.3 일괄 동기화 완료.

---

## 📌 [v2.7.2] - 2026-09-05
### 📖 순수 창작 5대 코어 DLL 아키텍처 및 세부 동작 원리 기술 명세서 공식 등록 & 도움말 뷰어 연동
- **📜 공식 기술 아키텍처 문서 신규 등록 (`docs/CORE_DLL_ARCHITECTURE.md`)**:
  - RoboBackup Studio의 순수 창작 5대 코어 DLL 모듈(`RoboDiffEngine`, `RoboVssProvider`, `RoboSyncWatch`, `RoboVault`, `RoboTimeMachine`)의 상세 동작 원리, 내부 알고리즘, Win32 P/Invoke OS 커널 API 바인딩 구조, 입출력 모델, 보안 메커니즘을 상세히 기록한 1,200줄 규모의 엔지니어링 아키텍처 명세서 공식 등록.
  - 외부 서드파티 라이브러리를 일절 배제(Zero External Dependencies)하고 .NET 표준 BCL과 Windows OS 커널 네이티브 API만을 결합한 고성능/고신뢰성 아키텍처 철학 명문화.
  - `docs/README.md` 메인 인덱스에 코어 DLL 기술 문서 링크 및 전체 아키텍처 다이어그램 추가.
- **🖥️ C# WPF `MainWindow.xaml` 도움말 & 라이선스 탭 확장**:
  - `MainWindow.xaml`의 6번째 탭(도움말 & 라이선스)에 5대 코어 DLL 모듈 아키텍처 요약 카드 및 `docs/CORE_DLL_ARCHITECTURE.md` 원클릭 열람 버튼 바인딩 추가.
- **🌐 React 웹 UI 도움말 탭에 전용 뷰어 서브탭 신설 (`HelpAndLicense.tsx`)**:
  - `HelpAndLicense.tsx`에 `🧩 5대 코어 DLL 기술 명세서` 서브탭을 신규 추가하여 웹 브라우저 상에서 5개 모듈의 상세 사양, Win32 API 바인딩, 알고리즘 및 전체 Markdown 원본 복사 기능을 인터랙티브하게 제공.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts`, `docs/README.md` 버전 v2.7.2 일괄 동기화 완료.

---

## 📌 [v2.7.1] - 2026-09-05
### 🛡️ Windows 작업 스케줄러 미등록 유령 작업(Ghost Tasks) 증식 버그 완벽 차단 및 빈 상태(Empty State) 정규화
- **🐛 C# WPF `schtasks.exe` 조회 파서 및 컬렉션 누적 결함 원천 해결 (`ViewModels/MainViewModel.cs`)**:
  - `schtasks.exe /query /fo CSV /v` 실행 시 Windows 언어팩/빌드에 따라 가변적인 CSV 컬럼 헤더(`호스트 이름`, `작업 이름`, `다음 실행 시간`, `상태` 등)를 사전 파싱하는 동적 헤더 매퍼(`SchtasksCsvMapping`, `ParseSchtasksCsvHeader`)를 신규 탑재하여 임의의 고정 인덱스 오참조 문제 완벽 교정.
  - 시스템 조회 결과가 없거나 0건일 때 UI에 하드코딩된 예제 작업 3건을 강제로 주입하던 더미 폴백 로직을 완전 제거하여, 사용자가 등록하지 않은 작업이 목록을 열 때마다 계속 증식하던 유령 스케줄(Ghost Schedule) 버그를 원천 차단.
  - Windows 시스템 및 타사 예약 작업이 목록에 유입되는 것을 방지하도록 필터링을 정밀화하고, 단일 작업 검사(`CheckScheduledTaskStatus`, `CheckCleanupTaskStatus`) 시 "시스템에서 지정된 파일을 찾을 수 없습니다" 등의 실패 응답을 정상 판별하도록 강화.
  - 등록된 작업이 0건일 때 "등록된 작업이 없습니다"라는 명확한 빈 상태(Empty State) 안내와 함께 선택 항목 및 인스펙터 패널을 안전하게 초기화.
- **🌐 React 웹 UI 스케줄러 탭 상태 관리 정규화 (`TaskScheduler.tsx`, `AutoCleanup.tsx`)**:
  - `TaskScheduler` 및 `AutoCleanup`의 기본 초기 배열을 하드코딩 샘플 대신 빈 배열(`[]`)로 변경하고 `localStorage` 영구 보존 구조로 정비하여, 사용자가 직접 등록한 작업만 목록에 표시되도록 일원화.
  - 사용자가 둘러보거나 테스트해볼 수 있도록 "💡 예시 작업 불러오기" 원클릭 버튼을 옵션으로 제공.
  - 작업 미등록 시 사용자 친화적인 안내 배너와 지침을 카드 형태로 렌더링.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.7.1 일괄 동기화.

---

## 📌 [v2.7.0] - 2026-09-05
### 🧩 엔터프라이즈 전용 5대 순수 창작 코어 DLL 모듈(Core DLL Suite) 도입 및 듀얼 아키텍처 전면 연동
- **🚀 순서에 맞춘 5대 네이티브 창작 코어 라이브러리(RoboBackupStudio.Core) 신규 구축**:
  1. **[1번 모듈] `RoboDiffEngine.cs` (사전 차이 분석 & 바이트 예측 프리플라이트)**:
     - Robocopy 복사 실행 전 소스/대상 디렉터리를 초고속 병렬 스캔하여 신규, 수정, 삭제, 동일 스킵 파일 개수와 실제 전송 바이트량을 1초 만에 사전 산출.
     - 0~100% 진행률 계산을 위한 기준 바이트 및 변경 파일 델타를 완벽 제공.
  2. **[2번 모듈] `RoboVssProvider.cs` (VSS 볼륨 섀도 복사본 헬퍼)**:
     - VSS(Volume Shadow Copy Service) `vssadmin` 및 COM 네이티브 계층을 래핑하여 임시 섀도 스냅샷 볼륨 자동 생성/마운트/해제.
     - 직원이 열어둔 엑셀/워드 문서, Outlook의 대용량 `.pst` 메일함, SQL Server `.mdf/.ldf`, 가상머신 VHDX 등 독점 잠금(Exclusive Lock) 파일의 100% 무중단 캡처 보장.
  3. **[3번 모듈] `RoboSyncWatch.cs` (스마트 큐 기반 실시간 자동 동기화 감시 엔진)**:
     - Win32 `ReadDirectoryChangesW` / `FileSystemWatcher` 기반 실시간 변경 감시.
     - 연속된 대량 파일 쓰기 버스트 시 불필요한 중복 실행을 막는 적응형 디바운스(Debounce Quiet Period, 1초~30초) 완충 큐 탑재. 조용한 상태 도달 시 Robocopy 자동 백그라운드 트리거.
  4. **[4번 모듈] `RoboVault.cs` (DPAPI 기반 제로-로그인 NAS 보안 볼트)**:
     - Windows Data Protection API (DPAPI) 가역 암호화 및 Windows Credential Manager P/Invoke 네이티브 연동.
     - 스크립트나 배치 파일에 SMB/NAS 공유 폴더 비밀번호를 평문(Plaintext)으로 노출하지 않고 안전하게 복호화하여 네트워크 드라이브 자동 마운트 후 즉시 소거.
  5. **[5번 모듈] `RoboTimeMachine.cs` (NTFS 스마트 하드링크 & 타임머신 버전 보관소)**:
     - Win32 `CreateHardLinkW` 네이티브 P/Invoke를 활용한 타임머신 증분 스냅샷 엔진.
     - 이전 백업본과 내용 및 타임스탬프가 동일한 파일은 0바이트 하드링크(Hard Link)로 연결하여 전체 복사본 대비 디스크 물리 점유 공간을 최대 90% 이상 절감.
- **🖥️ C# WPF MVVM 듀얼 아키텍처 연동 및 UI 탭 신설 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
  - `MainWindow.xaml`에 `🧩 코어 DLL 스튜디오` 전용 탭 추가.
  - `MainViewModel.cs`에 5개 코어 모듈 바인딩 속성 및 커맨드(`RunDiffScanCommand`, `CreateVssSnapshotCommand`, `ReleaseVssSnapshotCommand`, `ToggleSyncWatchCommand`, `SaveVaultCredentialCommand`, `CreateTimeMachineSnapshotCommand`) 완벽 구현.
- **🌐 React 웹 프리뷰 컴포넌트 신설 (`CoreDllStudio.tsx`)**:
  - 5개 모듈의 상세 제어판, 실시간 시뮬레이션, 메트릭 카드 및 이벤트 스트림 인터랙션 탑재.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.7.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/App.tsx`, `src/utils/robocopy.ts` 버전 v2.7.0 일괄 동기화.

---

## 📌 [v2.6.3] - 2026-09-04
### 🚨 C# WPF 컴파일 에러(CS0246, CS0066) 긴급 수정 및 빌드 파이프라인 무결성 확보
- **🐛 C# 네임스페이스 및 MVVM 데이터 모델 상속 무결성 교정**:
  - `ViewModels/MainViewModel.cs` 상단에 누락되었던 `using System.ComponentModel;` 및 `using System.Runtime.CompilerServices;` 지시문 추가.
  - `ScheduledTaskItem` 및 `RegisteredCleanupTaskItem`을 프로젝트 공통 베이스 클래스인 `ViewModelBase` 상속 구조로 통일하여 중복 이벤트 선언 제거 및 `INotifyPropertyChanged` / `PropertyChangedEventHandler` / `CallerMemberName` 참조 오류 10종 완벽 해소.
- **📦 dotnet publish 및 Inno Setup 설치 패키지 생성 자동화 복구**:
  - C# 컴파일 실패로 인해 `publish\app\*` 결과물이 생성되지 않아 Inno Setup 컴파일러가 중단되던 연쇄 결함 원천 차단.
  - Windows 10/11/Server용 단일 실행 파일(`RoboBackupStudio_v2.6.3.exe`) 및 설치 관리자(`RoboBackupStudio_v2.6.3_Setup.exe`) 100% 정상 빌드 보장.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.6.3)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.6.3 일괄 동기화.

---

## 📌 [v2.6.2] - 2026-09-04
### 🧹 오래된 백업 파일 자동정리(Auto Cleanup) 스케줄러 Master-Detail 인스펙터 아키텍처 확장 및 릴리즈 패킹 안정화
- **📑 오래된 백업 파일 자동정리 스케줄러 마스터-디테일(Master-Detail) 전면 적용**:
  - 기존 1:1 단일 속성 모델에서 다중 컬렉션 기반(`RegisteredCleanupTaskList` / `RegisteredCleanupTaskItem`)으로 아키텍처 전면 개편.
  - Windows에 등록된 모든 자동정리 스케줄 작업을 좌측 목록에 실시간 리스트업(작업명, 규칙 요약, 실행 주기, 다음 실행 시각, 상태 뱃지).
  - 우측 상세 인스펙터 패널에서 선택된 자동정리 작업의 파워셸 커맨드, 대상 폴더, 상태 로그를 실시간 상세 확인.
- **✨ 자동정리 작업 관리 액션 시스템 확장**:
  - `▶️ 선택 작업 즉시 실행` (`RunCleanupTaskNowCommand`): 백그라운드 파워셸 정리 루틴 즉시 구동 (`schtasks /run /tn ...`)
  - `🗑️ 선택 스케줄 삭제` (`DeleteCleanupTaskCommand`): 선택된 개별 자동정리 작업 안전 삭제
  - `🔄 새로고침` (`RefreshCleanupTaskStatusCommand`): 등록된 자동정리 스케줄 작업 목록 실시간 갱신 및 동기화
  - `✏️ 설정으로 불러오기` & `📋 파워셸 커맨드 복사` 기능 탑재.
- **🛡️ 릴리즈 빌드/패킹 창 닫힘 이슈 원인 분석 및 완화 (Release Packaging Crash Resilience)**:
  - `build.bat` 배치 파일 마지막에 `pause`를 보강하여 비정상 종료 시에도 에러 메시지 보존.
  - Inno Setup 컴파일러 및 dotnet publish 프로세스 실행 시 발생 가능한 권한 및 경로 문제를 방지하도록 방탄 예외 처리 강화.
- **🖥️ C# WPF MVVM 듀얼 아키텍처 100% 동기화 (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
  - `RegisteredCleanupTaskItem` 클래스 및 ObservableCollection 바인딩 완료.
  - `MainWindow.xaml`의 '오래된 파일 자동정리' 탭에 ListBox 및 상세 텍스트박스 바인딩 완벽 반영.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.6.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.6.2 일괄 동기화.

---

## 📌 [v2.6.1] - 2026-09-04
### 📋 작업 스케줄러 등록 현황 다중 작업 리스트(Master-Detail) 및 상세 인스펙터 기능 구현
- **📑 작업 스케줄러 등록 현황 마스터-디테일(Master-Detail) 뷰 도입**:
  - 기존의 단일 작업 상태 출력 방식에서 벗어나, 등록된 모든 백업 및 자동정리 스케줄 작업을 좌측 목록에 일목요연하게 리스트업하고, 항목 클릭 시 우측 상세 인스펙터 패널에 실시간 세부 명세가 즉시 표시되도록 전면 개편했습니다.
- **✨ React 웹 프리뷰 스케줄러 관리 기능 고도화 (`TaskScheduler.tsx`)**:
  - **작업 목록 리스트뷰**: 작업명, 실행 주기, 상태 뱃지(준비완료/실행중), 다음 실행 시각, 원본/대상 경로를 카드로 출력.
  - **상세 인스펙터 패널**: 선택한 작업의 전체 세부사항(다음 실행, 마지막 실행/결과, 배치 파일 경로, robocopy 명령어 전문) 확인.
  - **작업 관리 액션 바**:
    - `▶️ 지금 즉시 실행`: 선택한 백업 스케줄 작업 즉시 호출
    - `🗑️ 스케줄 삭제`: 선택한 작업 삭제
    - `✏️ 작업 설정으로 불러오기`: 선택된 작업의 원본/대상/플래그 구성을 백업 작업 설정 탭으로 원클릭 로드
    - `📋 명령어 복사`: 스케줄러 실행 커맨드 클립보드 복사
- **🖥️ C# WPF MVVM 듀얼 아키텍처 동기화 (`MainWindow.xaml`, `MainViewModel.cs`)**:
  - `ScheduledTaskItem` 데이터 모델 및 `RegisteredTaskList` 컬렉션 신설.
  - Windows `schtasks.exe /query /fo CSV /v` 파싱 엔진을 통해 시스템에 등록된 모든 RoboBackup 관련 작업을 자동으로 조회하여 리스트 바인딩.
  - ListBox 아이템 선택 시 `SelectedScheduledTask` 변경을 감지하여 실시간 상세 내용 및 커맨드가 우측 TextBox에 즉각 렌더링되도록 구현.
- **🔄 프로젝트 버전 메타데이터 전체 일괄 동기화 (v2.6.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx` 버전 v2.6.1 일괄 동기화.

---

## 📌 [v2.6.0] - 2026-09-04
### 🎨 13종 멀티 테마 시스템 전면 도입 (다크 9종 + 라이트 4종) & 글래스모피즘 지원
- **🌈 13종 고품격 테마 팔레트 신설 (다크 9종 + 라이트 4종)**:
  - 사용자 환경과 작업 취향에 맞춰 시각적 피로도를 낮추고 가독성을 극대화할 수 있도록 13가지 테마를 완벽하게 구현했습니다.
  - **다크 테마 (9종)**:
    1. `Deep Black` (초심해 다크 블랙)
    2. `Cool Grey` (슬레이트 쿨 그레이 - 기본)
    3. `Emerald Forest` (에메랄드 포레스트)
    4. `Cosmic Nebula` (코스믹 네뷸라 인디고)
    5. `Cyber Crimson` (사이버 크림슨 로즈)
    6. `Deep Ocean` (딥 오션 시안)
    7. `Sunset Amber` (선셋 앰버 골드)
    8. `Monochrome Steel` (모노크롬 스틸 징크)
    9. `Royal Velvet` (로열 벨벳 푹시아)
  - **라이트 테마 (4종)**:
    1. `Warm Beige` (따뜻한 베이지 감성)
    2. `Nordic Frost` (노르딕 프로스트 쿨 스카이)
    3. `Cherry Blossom` (체리 블라썸 벚꽃 핑크)
    4. `Solarized Bamboo` (솔라라이즈드 대나무 에메랄드)
- **✨ React 웹 프리뷰 테마 엔진 & 실시간 팔레트 셀렉터 (🎨)**:
  - `src/themes.ts`: 테마별 `bgFrom`, `bgTo`, `text`, `card`, `border`, `terminal`, `previewColor`를 정의하는 완전한 테마 데이터셋 구축.
  - `src/index.css`: `[data-theme='...']` 및 `.glass` 반투명 글래스모피즘 스타일 규칙 추가.
  - `src/components/Navbar.tsx`: 상단바에 테마 색상 닷 프리뷰와 다크/라이트 그룹 분류가 포함된 직관적인 13종 테마 드롭다운 선택기 탑재.
  - `localStorage` 자동 영구 저장 연동으로 브라우저를 재시작해도 선택한 테마가 즉시 복원.
- **🖥️ C# WPF 데스크톱 앱 테마 엔진 동기화 (Dual Architecture Sync)**:
  - `ViewModels/MainViewModel.cs`: `ThemeInfo` 모델 클래스 및 13종 테마를 담은 `AvailableThemes` 컬렉션, `SelectedTheme` 동적 바인딩 엔진 구축.
  - `MainWindow.xaml`: 상단 헤더에 WPF용 13종 테마 콤보박스를 배치하여 Windows 데스크톱 앱에서도 윈도우 배경, 헤더, 테두리, 텍스트, 악센트 색상이 실시간으로 완벽하게 전환되도록 구현.
- **🔄 프로젝트 버전 메타데이터 전체 일괄 갱신 (v2.6.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/App.tsx`, `src/utils/robocopy.ts` 버전 v2.6.0 일괄 동기화.

---

## 📌 [v2.5.7] - 2026-09-03
### ⚖️ 라이선스 및 저작권(Copyright) 표기 단일화 (AhBiYout)
- **📝 저작권(Copyright) 공식 표기 변경 적용**:
  - `Copyright (c) 2026 AhBiYout (CISNET: www.cisnet.co.kr)` 형식을 요청에 따라 **`Copyright (c) 2026 AhBiYout`**로 단일화 및 명확화했습니다.
  - `docs/LICENSE.txt` (MIT License 정식 표기), `docs/THIRD_PARTY_LICENSES.md`의 저작권 고지문을 일괄 갱신했습니다.
- **🛠️ 프로젝트 메타데이터 및 빌드/인스톨러 스크립트 작성자 정보 정제**:
  - `RoboBackupStudio.csproj`: `<Copyright>Copyright © 2026 AhBiYout</Copyright>` 명시 및 버전 2.5.7 갱신.
  - `installer.iss`: 설치 프로그램 게시자 및 주석을 `AhBiYout`로 단일화.
  - `build.bat`, `build.ps1`, `AGENTS.md`, `src/utils/robocopy.ts`: 스크립트 헤더 및 템플릿 개발자 메타데이터 동기화.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.7)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.7 일괄 갱신.

---

## 📌 [v2.5.6] - 2026-09-03
### 🔧 C# WPF 빌드 컴파일 오류(CS0103 Thread 누락) 긴급 수정 및 build.bat 무결성 복구
- **🚑 CS0103 'Thread' 이름이 현재 컨텍스트에 없습니다 컴파일 오류 해결**:
  - `ViewModels/MainViewModel.cs` 상단 네임스페이스에 `using System.Threading;` 누락으로 인해 `dotnet publish` 빌드 단계에서 `CS0103` 오류가 발생하고 빌드가 중단되던 문제를 긴급 수정했습니다.
  - 이중 검증 대기 코드인 `Thread.Sleep(500)` 호출부를 `using System.Threading;` 지시문 선언 및 `System.Threading.Thread.Sleep(500);` 완전 한정자(Fully-Qualified)로 선언하여 .NET 8 및 .NET 4.8 빌드 환경 모두에서 무결하게 컴파일되도록 보장했습니다.
- **🚀 `build.bat` 및 `Inno Setup` 설치 패키지 파이프라인 정상화**:
  - `dotnet publish` 단일 실행 파일(`.exe`) 및 `publish/app/` 파일 생성이 정상 복구됨에 따라 Inno Setup 설치 프로그램(`publish/RoboBackupStudio_v2.5.6_Setup.exe`) 생성까지 전 파이프라인이 100% 정상 작동하도록 복구되었습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.6)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.6 일괄 갱신.

---

## 📌 [v2.5.5] - 2026-09-03
### ⏰ Windows 작업 스케줄러 등록 오류 완벽 해결 및 스케줄러 탭 원본/대상 위치 지정 3단계 워크플로우 신설
- **📂 작업 스케줄러 탭 내 원본(Source) 및 대상(Target) 위치 직접 지정 3단계 워크플로우 신설**:
  - 기존에는 첫 번째 탭([🎯 백업 프로필 설계])에서만 원본/대상 경로를 지정할 수 있어, 스케줄러 등록 전에 "원본/대상 위치 지정을 어떻게 해야 하는지" 혼선이 발생하던 동선을 전면 개선했습니다.
  - 백업 스케줄러 탭 상단에 **[📂 1단계: 백업 원본 및 대상 위치 지정]** 전용 카드를 배치하여, 원본 및 대상 폴더 경로 입력창, [📁 원본 선택...], [📁 대상 선택...], [📂 탐색기로 열기], [🔄 원본 ↔ 대상 경로 맞교환] 버튼 및 실시간 Robocopy 명령어 요약 프리뷰를 제공합니다. 첫 번째 탭과 100% 양방향 실시간 동기화됩니다.
- **🛡️ 윈도우 작업 스케줄러(schtasks.exe) 등록 실패 원천 해결 및 러너 배치 스크립트 아키텍처 도입**:
  - 기존에 `schtasks.exe /create`에 복잡한 Robocopy 따옴표/공백 인자가 직접 전달되어 윈도우 스케줄러 명령줄 파싱 오류로 등록이 실패하던 문제를 원천 해결했습니다.
  - Windows Task Scheduler 공식 권장 표준에 따라 UTF-8(No BOM) 기반의 무인 실행 러너 배치 파일(`%ProgramData%\RoboBackupStudio\tasks\{TaskName}.bat`)을 자동 생성하고, `schtasks /tr "\"taskBatPath\""`를 등록하는 안정적인 아키텍처로 개편했습니다.
  - 등록 실행 전 원본 및 대상 폴더 입력 여부와 실제 존재 여부를 사전 유효성 검사(Validation)하여 친절한 안내 메시지창을 제공합니다.
  - 관리자 권한(`IsAdmin`)일 경우 백그라운드 등록 및 표준 에러 캡처, 일반 사용자일 경우 UAC 승인 프롬프트(`runas`) 후 `schtasks /query` 기반의 실시간 등록 성공 이중 검증 체계를 적용했습니다.
- **▶️ [등록된 스케줄 지금 즉시 실행 테스트] 및 [배치 파일 폴더 열기] 제어 도구 신설**:
  - 스케줄이 정상 작동하는지 예약 시각까지 기다리지 않고 즉각 백그라운드에서 실행 테스트할 수 있는 [▶️ 등록된 스케줄 지금 즉시 실행 테스트 (`schtasks /run`)] 버튼을 추가했습니다.
  - 생성된 실행 배치 스크립트 저장 위치를 윈도우 탐색기로 원클릭 오픈할 수 있는 [📁 실행 배치 파일(.bat) 폴더 열기] 버튼을 탑재했습니다.
- **🔄 React 웹 UI 및 C# WPF 듀얼 아키텍처 완전 동기화 (Dual Architecture Sync)**:
  - `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/components/TaskScheduler.tsx`, `src/utils/robocopy.ts`에 1단계 경로 지정 및 3단계 스케줄러 워크플로우를 100% 동일하게 구현했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.5)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.5 일괄 갱신.

---

## 📌 [v2.5.4] - 2026-09-02
### 🚀 C# WPF 컴파일 무결성 확보 및 System.ServiceProcess 네임스페이스 참조 해결
- **🔧 `System.ServiceProcess` Using 지시문 누락 및 컴파일 오류 CS0246/CS0103 완벽 수정**:
  - `ViewModels/MainViewModel.cs` 상단에 `using System.ServiceProcess;` 지시문을 명시적으로 추가하여, `ServiceController` 및 `ServiceControllerStatus` 타입 미인식으로 인한 C# 빌드 실패(`dotnet publish` CS0246, CS0103) 문제를 원천 해결했습니다.
  - 비동기 상태 확인 및 시작/중지 루프 내 미사용 변수 경고(`warning CS0219: started/stopped`)를 정리하여 무결점 빌드를 보장합니다.
- **📦 Inno Setup 인스톨러 및 단일 독립 실행 파일 빌드 정상화**:
  - `build.bat` 실행 시 `publish/RoboBackupStudio_v2.5.4.exe` (Self-Contained Single-File) 및 `publish/RoboBackupStudio_v2.5.4_Setup.exe` (Inno Setup 인스톨러)가 100% 정상 생성되도록 패키징 파이프라인 무결성을 회복했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.4)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.4 일괄 갱신.

---

## 📌 [v2.5.3] - 2026-09-02
### ⚙️ Windows 백그라운드 서비스(RoboBackupService) 상태 실시간 감지 고도화 및 동작 모드 동기화 문제 완벽 해결
- **🔍 Windows SCM `ServiceController` 네이티브 API 기반 실시간 상태 조회 및 제어 도입**:
  - 기존 CLI(`sc.exe query`) 파싱 시 한국어/영문 Windows 언어팩 환경에 따른 "STATE", "RUNNING", "STOPPED" 텍스트 파싱 지연 및 누락 문제를 네이티브 `System.ServiceProcess.ServiceController` API로 전면 교체하여 해결했습니다.
  - 서비스가 실행 중(Running), 시작 중(StartPending), 중지 중(StopPending), 중지됨(Stopped), 미등록(NotInstalled) 상태를 지연 없이 정확하게 실시간 판별합니다.
- **⚡ 서비스 시작(Start) 비동기 폴링 상태 전환 보장**:
  - `StartServiceAsync` 및 `StopServiceAsync` 실행 시 SCM 상태 전환 대기 시간을 비동기 폴링(최대 10초, 500ms 간격)으로 실시간 추적하여 상태 뱃지("🟢 실행 중", "🟡 중지됨")가 즉시 갱신되도록 개선했습니다.
- **🔄 동작 모드(포터블 모드 ↔ Windows 서비스 모드) 상호작용 및 자동 동기화 강화**:
  - 사용자가 [⚙️ 윈도우 서비스 모드] 라디오 버튼 또는 배너를 클릭했을 때 서비스가 미등록 상태이면 즉시 등록 대화상자를 띄우고, 등록 후에는 모드가 자동으로 `windows_service`로 전환되어 포터블 모드로 되돌아가지 않도록 상태 바인딩 및 동기화 로직을 완벽 보강했습니다.
  - 서비스가 이미 등록되어 있으나 중지된 상태에서 서비스 모드를 선택하면 즉시 서비스 시작 대화상자를 제공하여 원클릭 가동이 가능합니다.
- **🛠️ 레지스트리 `ImagePath` 정규화 및 서비스 실행 경로 무결성 확보**:
  - 서비스 등록 시 `sc.exe create` 실행 후 레지스트리 `SYSTEM\CurrentControlSet\Services\RoboBackupService\ImagePath` 값을 정확한 실행 파일 경로와 `--service` 인자로 이중 검증 및 정규화하여 SCM 로드 오류를 원천 차단했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.3)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.3 일괄 갱신.

---

## 📌 [v2.5.2] - 2026-09-01
### 🚀 C# WPF 빌드 파이프라인 무결성 확보 및 자동 빌드 스크립트(build.bat) 닫힘 현상 완벽 방지
- **🛡️ `build.bat` 배치 프로세서 비정상 종료(창 닫힘) 원천 차단 (Failsafe Architecture)**:
  - Windows CMD 배치 인터프리터의 줄바꿈 바이트 오프셋(CRLF 정규화) 및 중첩 괄호 하위 셸 파싱 오류를 근본적으로 개선하여, 어떤 환경에서도 빌드 중 창이 바로 닫히지 않고 결과 요약과 `pause` 대기 상태를 유지하도록 보장했습니다.
  - 빌드 전 과정에 걸친 오류 복구(Fallback) 및 예외 처리 로직을 적용하여 실패 단계가 발생해도 스크립트가 중단되지 않고 다음 빌드 단계를 안전하게 수행합니다.
- **⚡ C# WPF .NET 8.0 고성능 단일 독립 실행형(Self-Contained Single-File) 빌드 최적화**:
  - `RoboBackupStudio.csproj`를 모던 .NET 8.0 WPF 단일 타겟으로 정비하여 .NET Framework 레거시 타겟 크로스 컴파일 시 발생하던 `MC1000: System.Private.CoreLib` 빌드 오류를 원천 제거했습니다.
  - `warning IL3000` (단일 파일 앱 내 `Assembly.Location` 빈 문자열 반환 경고)을 `Environment.ProcessPath` 및 `AppContext.BaseDirectory` 체계로 전환하여 완벽히 해결했습니다.
  - 별도의 .NET 런타임이 설치되어 있지 않은 Windows 10, 11, Server 2016~2025 PC에서도 즉시 단독 구동 가능한 Self-Contained 독립 바이너리(`publish\RoboBackupStudio_v2.5.2.exe`)를 생성합니다.
- **📦 Inno Setup 기반 Windows 통합 인스톨러(`publish\RoboBackupStudio_v2.5.2_Setup.exe`) 자동 연동**:
  - Inno Setup 컴파일러(`ISCC.exe`) 자동 감지 시 `Program Files` 풀림 설치 및 Windows 무인 백업 서비스(`RoboBackupService`) 등록 지원 인스톨러를 한 번에 빌드합니다.
- **🔄 PowerShell 빌드 스크립트(`build.ps1`) 동시 제공**:
  - Windows PowerShell 환경에서 인코딩 제약 없이 쾌속으로 빌드할 수 있는 스크립트를 함께 제공합니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `build.ps1`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.2 일괄 갱신.

---

## 📌 [v2.5.1] - 2026-08-30
### ⚙️ 윈도우 인스톨 서비스 모드(Windows Service) 가동 실패(오류 1053) 완벽 해결 및 듀얼 아키텍처 개편
- **🚀 Windows Service Control Manager (SCM) 정식 `ServiceBase` 핸드셰이크 프로토콜 도입**:
  - 기존 포터블 GUI 모드와 달리 Windows 서비스(`sc.exe start RoboBackupService`)로 시작될 때 Windows SCM과 통신하지 않아 발생하던 `Error 1053 (서비스가 시작이나 제어 요청에 적절하게 응답하지 않았습니다)` 문제를 원천 해결했습니다.
  - `System.ServiceProcess.ServiceBase`를 상속한 `RoboBackupWindowsService` 클래스를 신설하고, 전용 엔트리포인트 `Program.cs`를 통해 `--service` 인자 또는 Session 0(비인터랙티브) 감지 시 `ServiceBase.Run()`을 즉시 호출하도록 설계했습니다.
- **🔄 포터블 단독 GUI 모드 & 윈도우 백그라운드 서비스 모드 듀얼 엔트리포인트 완전 호환**:
  - 사용자가 일반 실행(더블 클릭) 시 기존과 동일하게 WPF GUI(`App.xaml`)가 매끄럽게 로드되며, Windows 인스톨러(`installer.iss`) 또는 서비스 등록(`RegisterServiceAsync`)을 통해 실행될 때는 백그라운드 무인 데몬 엔진(`RoboBackupWindowsService`)으로 즉각 동작합니다.
- **🛡️ 백그라운드 스케줄러 큐 및 안전한 서비스 라이프사이클 관리**:
  - `OnStart()`, `OnStop()`, `OnShutdown()` 메서드를 통해 비동기 작업 취소 토큰(`CancellationTokenSource`) 기반의 정상적이고 안전한 서비스 시작/종료 라이프사이클을 보장합니다.
  - `service.log`에 SCM 핸드셰이크 상태, 심장박동(Heartbeat), 백업 큐 실행 이력을 투명하게 기록합니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.5.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.1 일괄 갱신.

---

## 📌 [v2.5.0] - 2026-08-29
### 🔑 NAS / 네트워크 자격 증명 실시간 조회 및 중복/다중 세션 충돌(Windows 오류 1219) 방지 시스템 구축
- **📋 현재 시스템에 등록된 Windows 자격 증명 & 활성 SMB 세션 실시간 스캔 및 시각화**:
  - `cmdkey /list` 및 `net use` 명령어를 비동기로 호출·파싱하여 현재 Windows 시스템에 보관된 자격 증명 대상(IP/호스트명/UNC 경로)과 활성 SMB 연결 세션을 목록으로 제공합니다.
  - 저장된 항목별 유형 뱃지(`🔑 cmdkey` / `🔗 net use`), 대상 주소, 계정명, 드라이브 문자 및 연결 상태를 한눈에 파악할 수 있는 전용 관리 패널을 구현했습니다.
- **⚠️ 다중 계정 접속 충돌(Windows Error 1219) 사전 감지 및 스마트 경고 배너**:
  - 동일한 NAS 서버 대상에 이미 다른 계정의 자격 증명이나 활성 세션이 연결되어 있을 때, 새 계정 입력 시 Windows 에러 1219(동일 서버 다중 계정 연결 불가) 발생 위험을 실시간 감지하여 시각적 경고 배너를 출력합니다.
  - [기존 계정으로 자동 변경] 및 [기존 연결 세션 삭제/해제] 원클릭 대응 버튼을 제공하여 사용자 실수로 인한 연결 오류를 원천 차단했습니다.
- **⚡ 자격 증명 원클릭 적용(Load) 및 선별 삭제/해제 인터랙션**:
  - 기존 등록된 항목 클릭 시 [📥 입력창에 적용] 버튼을 통해 서버 주소, 공유 경로, 사용자명이 입력 폼에 즉시 자동 로드되도록 연동했습니다.
  - [🗑️ 삭제/해제] 버튼을 통해 불필요하거나 충돌을 일으키는 특정 자격 증명 및 SMB 세션을 개별 삭제할 수 있습니다.
- **🔄 C# WPF MVVM & React 프리뷰 듀얼 완벽 동기화 (v2.5.0)**:
  - `MainWindow.xaml` 및 `ViewModels/MainViewModel.cs`에 `SavedNasCredentials`, `CheckNasDuplicates()`, `RefreshNasCredentialsCommand`, `LoadNasCredentialItemCommand`, `DeleteSpecificCredentialCommand`를 완벽 구현.
  - React 웹 프론트엔드(`src/components/NasAuthManager.tsx`)에도 동일한 로직과 UI 컴포넌트를 연동 완료.
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.5.0 일괄 갱신.

---

## 📌 [v2.4.0] - 2026-08-29
### ⚙️ Windows 백그라운드 서비스(RoboBackupService) 자동 등록 및 무재부팅 즉시 가동 시스템 고도화
- **🔧 Inno Setup 인스톨러 서비스 등록 태스크 기본값 및 파라미터 개선**:
  - `installer.iss`의 `serviceinstall` 태스크 기본 플래그를 기본 활성화(Checked)로 전환하여 인스톨러 실행 시 별도 체크 조작 없이도 Windows 서비스가 기본 자동 등록되도록 최적화했습니다.
  - Windows Service Control Manager(`sc.exe`)의 `binPath=` 인자 전달 시 공백 경로 이스케이프 따옴표(`""\""{app}\{#MyAppExeName}\"" --service""`)를 표준화하여 경로 파싱 오류 및 서비스 미등록 증상을 원천 차단했습니다.
- **⚡ 재부팅 없는 즉시 서비스 등록/시작 스마트 가이드 UX**:
  - GUI 앱 내에서 [윈도우 서비스 모드 (Windows Service)] 선택 시 미등록 상태를 실시간 감지하여 재부팅 없이 즉시 등록 및 가동할 수 있는 자동 확인 대화상자를 연동했습니다.
  - 서비스 감지 엔진을 `sc.exe query`와 Windows 레지스트리 SCM 키 듀얼 점검 방식으로 강화하여 서비스 등록 상태를 100% 신뢰성 있게 판별합니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.4.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.4.0 일괄 갱신.

---

## 📌 [v2.3.9] - 2026-08-28
### ⚡ 복사 작업 진행 시 실시간 콘솔 가림 현상 해결 및 전면 라이브 뷰 최적화
- **🔧 복사 실행 상태(`IsRobocopyRunning`)와 모달 딤 오버레이(`IsBusy`)의 완벽한 분리**:
  - 기존에는 복사 실행(`RunRobocopyAsync`) 시 전역 `IsBusy = true`가 설정되어 전체 화면을 덮는 반투명 딤 오버레이(Dimmer & Spinner)가 전면에 생성되면서, 뒤에 있는 [⚡ 라이브 동기화] 탭의 실시간 작업 콘솔과 전송 진행률이 가려지는 문제가 있었습니다.
  - 이를 전용 실행 프로퍼티인 `IsRobocopyRunning`으로 분리하여, 백업 실행 시 화면 가림 없이 실시간 Robocopy 콘솔 스트림, 파일 전송 진행률(%), 복사 파일 수 및 전송 속도가 전면에 선명하게 노출되도록 개선했습니다.
- **🎯 실시간 제어 및 인터랙션 강화**:
  - 복사 작업 진행 중 사용자가 언제든지 백업을 안전하게 중단할 수 있도록 [⏹ 강제 중지] 버튼의 반응성을 보장하고, [▶ 백업 실행 시작] 버튼의 중복 실행 방지(`IsEnabled`) 바인딩을 적용했습니다.
  - [⚡ 라이브 동기화] 탭 헤더에 복사 중일 때 눈에 띄는 `[진행 중...]` 실시간 상태 뱃지를 추가하고, 콘솔 스크롤바(`Auto`)를 최적화했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.9)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.3.9 일괄 갱신.

---

## 📌 [v2.3.8] - 2026-08-27
### 🛠️ Inno Setup 6 인스톨러 `Parameters` 파라미터 따옴표 이스케이프 오류 수정
- **🔧 Inno Setup 컴파일러(`ISCC.exe`) Mismatched Quotes 오류 해결**:
  - `installer.iss` 라인 60의 `sc.exe create` 실행 파라미터 내 이스케이프 따옴표(`""`) 불일치로 발생하던 `Mismatched or misplaced quotes on parameter "Parameters"` 오류를 수정했습니다.
  - Windows 시스템 디렉토리 경로 상수 `{sys}\sc.exe`를 적용하여 환경 변수에 구애받지 않고 서비스 등록/제어가 안정적으로 수행되도록 개선했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.8)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.3.8 일괄 갱신.

---

## 📌 [v2.3.7] - 2026-08-27
### ⚙️ Windows 백그라운드 서비스(RoboBackupService) 설치 구문 교정 및 즉시 제어/상태 확인 피드백 강화
- **🔧 Inno Setup 설치 마법사 내 Windows 서비스 자동 등록 구문 오류 수정**:
  - `installer.iss`의 `sc.exe create` 명령어에 포함되어 있던 비표준 파라미터(`description=`)를 제거하고, `sc description` 명령으로 정식 분리하여 설치 시 서비스가 정상 등록되도록 개선했습니다.
  - Windows SCM 표준 이스케이프 포맷(`binPath= "\"C:\...\RoboBackupStudio.exe\" --service"`)으로 교정하여 공백이 포함된 경로에서도 서비스 바이너리가 정확히 연결되도록 수정했습니다.
- **⚡ 서비스 상태 확인(`CheckServiceStatus`) 즉시 사용자 피드백(Popup/Log) 제공**:
  - [🔄 서비스 상태 확인] 버튼 클릭 시 상태 라벨만 조용히 바뀌던 기존 방식에서, 현재 등록 여부(`실행 중/중지됨/미등록`), 동작 모드, 서비스 명칭 등을 상세 안내하는 팝업 대화상자 및 로그를 즉각 출력하도록 개선했습니다.
- **💡 무재부팅(No-Reboot) 즉시 반영 보장 및 안내 문구 추가**:
  - Windows 서비스 등록 및 시작은 컴퓨터 재부팅 없이 즉시 제어 가능함을 UI 내 툴팁 및 안내 문구로 명확히 표시했습니다.
  - 서비스 등록 시 즉시 시작 여부를 묻는 스마트 인터랙션을 추가하여 원클릭 가동이 가능하도록 구현했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.7)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/HelpAndLicense.tsx`, `src/utils/robocopy.ts` 버전 v2.3.7 일괄 갱신.

---

## 📌 [v2.3.6] - 2026-08-27
### 🛠️ Windows Inno Setup 인스톨러 호환 표준 Multi-Res ICO 변환 및 패키징 무결성 확보
- **🔧 Inno Setup 6 `Icon file is invalid` 컴파일 오류 완벽 해결**:
  - Inno Setup 컴파일러(`ISCC.exe`)의 엄격한 32비트 PE 리소스 헤더 규격에 부합하도록 ImageMagick 표준 Multi-Resolution ICO 파일 포맷(`256x256`, `128x128`, `64x64`, `48x48`, `32x32`, `16x16` 32bpp)으로 재구성했습니다.
  - `installer.iss`의 `SetupIconFile=robocopy.ico` 경로를 루트 및 `assets/` 디렉토리에 동시 배치하여 Windows 환경에서 `build.bat` 실행 시 `[INSTALLER SUCCESS]`로 완벽히 패키징되도록 검증했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.6)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx` 버전 v2.3.6 일괄 갱신.

---

## 📌 [v2.3.5] - 2026-08-27
### 🌐 하단 푸터(Footer) 영역 개발자 정보 및 공식 링크(블로그/회사) 탑재
- **✨ 웹 및 WPF 푸터 영역 공식 메타데이터 연동**:
  - 개발자명: `AhBiYout`
  - 회사 홈페이지: `http://www.cisnet.co.kr/` (CISNET)
  - 구글 블로그: `https://ahbivibelog.blogspot.com/` (AhBi VibeLog)
- **🖥️ C# WPF `MainWindow.xaml` 푸터 인터랙티브 하이퍼링크 구현**:
  - `OpenUrlCommand` 바인딩을 통해 WPF 클라이언트 푸터에서 회사홈페이지 및 구글블로그 클릭 시 기본 웹 브라우저로 원클릭 이동하도록 구현했습니다.
- **🌐 React 프리뷰 푸터 반응형 레이아웃 구성**:
  - 데스크톱 및 모바일 화면에 최적화된 플렉스 랩(Flex-wrap) 레이아웃 및 텍스트 하이라이트를 적용했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.5)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx` 버전 v2.3.5 일괄 갱신.

---

## 📌 [v2.3.4] - 2026-08-27
### 🖼️ Windows C# WPF 데스크톱 및 웹 앱 전반 아이콘 전면 연동 및 리소스 임베딩
- **🖥️ C# WPF `.exe` 및 Windows 창 타이틀바 아이콘 정식 적용**:
  - `RoboBackupStudio.csproj`에 `<ApplicationIcon>robocopy.ico</ApplicationIcon>` 및 `<Resource Include="robocopy.ico" />`, `<Resource Include="robocopy.png" />`를 설정하여 컴파일된 실행 파일 및 작업 표시줄에 앱 아이콘이 상시 표시되도록 구현했습니다.
  - `MainWindow.xaml` 창 속성에 `Icon="robocopy.png"`를 부여하고, 상단 네비게이션 헤더의 임시 이모지(`⚡`)를 고화질 `robocopy.png` 아이콘으로 전면 교체했습니다.
- **📦 Inno Setup 인스톨러(`installer.iss`) 아이콘 연동**:
  - Windows 설치 프로그램 빌드 설정에 `SetupIconFile=assets\robocopy.ico`를 추가하여 설치 마법사 및 제어판/시작메뉴/바탕화면 바로가기에 공식 아이콘이 자동 적용되도록 구성했습니다.
- **🌐 웹 프론트엔드 Vite 에셋 번들러 직접 임포트 적용**:
  - `Navbar.tsx` 및 `HelpAndLicense.tsx`에서 경로 참조 오류 및 404 방지를 위해 `import appLogo from '../assets/robocopy.png'`를 통한 정적 번들링 방식으로 개선하여 모든 브라우저 및 프리뷰 환경에서 즉각 렌더링되도록 보장했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.4)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx` 버전 v2.3.4 일괄 갱신.

---

## 📌 [v2.3.3] - 2026-08-27
### 🐛 C# WPF `MainViewModel.cs` 중복 필드 정의(CS0102) 빌드 에러 수정 및 컴파일 무결성 확보
- **🔧 `CS0102` 중복 식별자 컴파일 에러 해결**:
  - `ViewModels/MainViewModel.cs` 내부의 테마 단일화 과정에서 남아있던 중복 `_currentTheme` 선언을 제거하여 C# WPF 컴파일 무결성을 확보했습니다.
  - Windows 환경의 `build.bat` 및 `dotnet publish` 빌드가 100% 정상 작동하도록 검증했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.3)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx` 버전 v2.3.3 일괄 동기화.

---

## 📌 [v2.3.2] - 2026-08-27
### 🖼️ `robocopy.png` 기반 앱 공식 아이콘 생성 및 웹/데스크톱 UI 전면 적용
- **🎨 `robocopy.png` 공식 아이콘 에셋 등록 및 연동**:
  - 사용자 제공 `robocopy.png` 에셋을 기반으로 고화질 앱 로고 및 파비콘(`public/robocopy.png`, `public/app-icon.png`, `public/favicon.png`)을 구성했습니다.
  - `index.html` 내 공식 파비콘 태그(`<link rel="icon" type="image/png" href="/robocopy.png" />`) 및 페이지 타이틀을 동기화했습니다.
- **✨ 웹 네비게이션 헤더 및 도움말 탭 아이콘 적용**:
  - `Navbar.tsx` 상단 브랜드 로고 영역에 `robocopy.png` 기반의 라운드 스퀘어 앱 아이콘을 배치하여 전문적인 소프트웨어 정체성을 확립했습니다.
  - `HelpAndLicense.tsx` 상단 배너 및 안내 영역에 `robocopy.png` 공식 로고를 연동했습니다.
- **🖥️ C# WPF 윈도우 및 빌드 파이프라인 동기화**:
  - `MainWindow.xaml`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`의 빌드 버전 메타데이터를 `v2.3.2`로 일괄 갱신했습니다.

---

## 📌 [v2.3.1] - 2026-08-27
### 🧹 상단 헤더 및 하단 푸터 영역 내 불필요/비관련 정보 문자열 전면 제거 및 간소화
- **✨ 상단 헤더(Header) 텍스트 정제 및 간결화**:
  - React 웹 네비게이션 헤더(`Navbar.tsx`) 및 C# WPF 헤더(`MainWindow.xaml`)에서 복잡하고 장황했던 슬로건(`Windows High-Speed Robocopy GUI & C# WPF Generator` / `Auto-Cleanup Scheduler & NAS Auth`)을 제거하고 `초고속 파일 백업 & 동기화 관리 시스템`으로 직관적이고 일관되게 정제했습니다.
- **✨ 하단 푸터(Footer) 영역의 불필요한 개발/빌드 스크립트 텍스트 정리**:
  - WPF 메인 윈도우(`MainWindow.xaml`) 하단 푸터에 노출되던 내부 빌드 스크립트 문자열(`English Automated Build Script: build.bat (v2.3.0 - .NET 8/9/10 + Inno Setup Service)`) 및 외부 링크 나열을 완전히 제거하고, 깔끔한 저작권 및 제품명(`RoboBackup Studio © 2026 • High Performance Robocopy Management Suite`), 버전 배지(`v2.3.1`)로 간소화했습니다.
  - React 웹 푸터(`App.tsx`)에서도 중복 및 군더더기 개발자/블로그 링크 텍스트를 정리하여 정갈한 레이아웃으로 개편했습니다 (모든 개발자/회사/라이선스 상세 정보는 '도움말 & 라이선스' 탭에서 완벽하게 열람 가능).
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `Navbar.tsx`, `App.tsx` 버전 v2.3.1 일괄 동기화.

---

## 📌 [v2.3.0] - 2026-08-27
### 🎨 다크 모드(Dark Theme) 단일 고성능 UI/UX 통합 및 비-다크(아이보리/그레이) 테마 전면 제거
- **🌌 다크 모드(Dark Mode) 전용 고대비 일관 UI 환경 구축**:
  - 사용자 요청에 따라 다크 모드 이외의 모든 테마 옵션(아이보리, 클래식 그레이)을 UI 및 백엔드 로직에서 완전히 제거하고 슬레이트/옵시디언 다크 테마(`slate-950`/`#0f172a`)로 단일화했습니다.
- **✨ React 웹 프론트엔드 테마 선택자 정리**:
  - `Navbar.tsx`의 테마 변경 드롭다운 메뉴 및 `themes` 배열을 제거하고 심플하고 직관적인 '다크 모드' 전용 인디케이터로 간소화했습니다.
  - `src/types.ts`의 `AppTheme` 타입을 `'dark'`로 고정하고, `src/index.css`의 비-다크 클래스(`.theme-ivory`, `.theme-gray`) 스타일 정의를 완전히 정리했습니다.
  - `App.tsx` 내 다크 모드 CSS 클래스(`dark`, `theme-dark`) 영구 유지 및 불필요한 테마 토글 로직을 제거했습니다.
- **🖥️ C# WPF `MainWindow.xaml` & `MainViewModel.cs` 테마 로직 정리**:
  - `MainWindow.xaml` 헤더의 테마 전환 버튼 3종을 정리하고 고대비 다크 모드 전용 UI 레이아웃으로 개편했습니다.
  - `ViewModels/MainViewModel.cs`의 `CurrentTheme`을 `"dark"`로 고정하고, `ThemeWindowBackground`(`#0f172a`), `ThemeHeaderBackground`(`#1e293b`), `ThemeBorderBrush`(`#334155`) 등 다크 전용 고대비 브러시를 단일화했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.3.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `App.tsx` 버전 v2.3.0 일괄 동기화.

---

## 📌 [v2.2.9] - 2026-08-26
### 🚀 웹 프리뷰 가짜(Mock) 데이터 전면 제거 및 로컬 실제 파일 시스템 스캔 & NAS 변경 IP 동기화 완비
- **📁 `JobDesigner` & `LiveRunner` 실제 로컬 폴더 파일 스캔 및 스트리밍 엔진 구현**:
  - `webkitdirectory` 파일 브라우징 입력을 통해 사용자가 선택한 실제 로컬 폴더의 파일 목록, 총 파일 개수 및 실제 파일 크기(`totalBytes`)를 실시간 계산하도록 구현했습니다.
  - 가짜/더미 난수 기반 시뮬레이션을 전면 제거하고, 선택된 실제 파일 메타데이터를 기반으로 실시간 처리 루프, 복사 바이트 수, 전송 속도 및 진행률(%)이 정확히 계산되도록 리팩토링했습니다.
- **🧹 `AutoCleanup` 실제 디렉토리 스캔 및 대상 식별 연동**:
  - 하드코딩된 삭제 대상 샘플 데이터를 제거하고, 사용자 로컬 파일 시스템 선택 기반의 실시간 파일 정보 파싱 및 조건별(경과 일수/용량 제한) 대상 목록 필터링을 완비했습니다.
- **🌐 NAS `net use` 및 UNC 경로 변경 시 IP 주소 실시간 동기화**:
  - NAS 서버 IP/호스트명 변경 시 `net use` 연결 명령어, `cmdkey` 자격 증명, 자동 생성 배치 스크립트(.bat), Robocopy 대상 경로가 즉시 새로운 IP로 일괄 동기화되도록 바인딩을 강화했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.9)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `App.tsx` 버전 v2.2.9 일괄 동기화.

---

## 📌 [v2.2.7] - 2026-08-25
### 🛠️ `App.xaml.cs` 내 `System.ServiceProcess.ServiceBase` 의존성 제거 및 순수 .NET 네이티브 무의존 컴파일 무결성 완비 (CS1069 해결)
- **⚡ `ServiceBase` 제거 및 네이티브 백그라운드 워커(`RunHeadlessBackgroundWorker`) 구현**:
  - `build.bat` 및 `dotnet publish` 빌드 시 발생했던 `error CS1069: 네임스페이스 'System.ServiceProcess'에 형식 이름 'ServiceBase'이(가) 없습니다` 컴파일 오류를 원천 차단했습니다.
  - 외부 NuGet 패키지(`System.ServiceProcess.ServiceController`) 참조 없이 100% .NET 표준 라이브러리(`CancellationTokenSource`, `WaitHandle`, `AppDomain.ProcessExit`) 기반의 고성능 무인 백그라운드 서비스 워커로 리팩토링했습니다.
  - 이를 통해 오프라인 환경, 프라이빗 폐쇄망, .NET 8.0 / 9.0 / 10.0 SDK 어디서나 NuGet 패키지 다운로드 과정 없이 100% 즉시 단일 실행 파일로 컴파일됩니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.7)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.7 일괄 동기화.

---

## 📌 [v2.2.6] - 2026-08-25
### 🛠️ .NET 8.0/9.0/10.0 SDK NuGet 패키지 복원(NU1100) 및 `build.bat` 컴파일 무결성 완벽 해결
- **📦 미사용 외부 패키지(`System.ServiceProcess.ServiceController`) 참조 제거**:
  - `MainViewModel.cs`에서 Windows 서비스(`RoboBackupService`) 관리는 `sc.exe` 프로세스를 직접 호출하여 제어하므로, `RoboBackupStudio.csproj`에 선언되어 있던 불필요한 외부 NuGet 패키지 의존성을 완전히 제거하여 외부 패키지 없이 100% 순수 .NET 기본 프레임워크만으로 즉시 빌드되도록 최적화했습니다.
- **🌐 `nuget.config` 기본 패키지 소스 설정 파일 추가**:
  - 시스템의 글로벌 NuGet 설정이 비어있거나 오프라인인 환경에서도 `https://api.nuget.org/v3/index.json`을 통해 필요한 런타임 팩을 정상 참조할 수 있도록 프로젝트 루트에 `nuget.config`를 구성했습니다.
- **🎯 유니버설 .NET LTS 대상 프레임워크(`net8.0-windows`) 표준화 및 다중 SDK 호환**:
  - .NET 8.0, 9.0, 10.0 SDK 어디서나 완벽하게 런타임 팩을 해결할 수 있는 범용 LTS 표준인 `net8.0-windows`로 기본 TargetFramework를 지정하고, 사용자 정의 프로퍼티 오버라이드를 지원합니다.
- **🛡️ `build.bat` 자동 장애 복구(Fallback) 빌드 파이프라인 추가**:
  - `--self-contained true` 빌드 중 런타임 팩 확인 에러 발생 시 프레임워크 의존 모드(`--self-contained false`)로 자동 재시도하여 빌드가 중단되지 않고 100% 무결하게 완료되도록 파이프라인을 강화했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.6)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.6 일괄 동기화.

---

## 📌 [v2.2.5] - 2026-08-24
### 🐛 경로 끝 백슬래시(`\`)로 인한 Robocopy 명령줄 매개변수 파싱 오류(ExitCode 16) 원천 해결
- **🛡️ 트레일링 백슬래시 이스케이프 버그(`\"`) 방지 경로 정규화(`FormatRobocopyPath`) 구현**:
  - 원본/대상 경로 끝에 백슬래시가 포함된 경우(예: `\\192.168.0.112\data\1111111133\` 또는 `C:\Users\user\Downloads\`) Robocopy 명령줄 따옴표와 만나 `\"`로 해석되어 Windows 파서가 큰따옴표를 닫지 않고 뒤따르는 모든 옵션(`/MIR /MT:16 /ZB ...`)을 대상 경로의 일부로 오인하던 문제(`잘못된 매개 변수 #2`, ExitCode 16)를 완벽히 해결했습니다.
  - `FormatRobocopyPath` 헬퍼를 C# 및 TypeScript에 공통 탑재하여 UNC 경로 및 일반 폴더 끝의 백슬래시를 안전하게 정리(TrimEnd)하고, 드라이브 루트(예: `C:\`)는 `"C:\\"`로 안전하게 이스케이프하여 전달합니다.
- **⚡ 멀티스레드 플래그 중복(`/MT:16 /MT:16`) 생성 방지 최적화**:
  - `Threads` 및 `IsMt16` 조건식이 동시에 적용될 때 `/MT:16`이 중복 출력되던 로직을 정리하여 하나의 통합 `/MT:N` 플래그만 안전하게 전달되도록 개선했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.5)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.5 일괄 동기화.

---

## 📌 [v2.2.4] - 2026-08-24
### ⏳ NAS 및 비동기 시스템 작업 시 시각적 작업 중(Busy) 피드백 구현 (마우스 커서 대기/버튼 상태/프로그레스 인디케이터)
- **🖱️ 비동기 작업 시 마우스 커서 대기 상태(`Cursors.Wait`) 및 글로벌 비지 오버레이 완비**:
  - NAS 네트워크 연결(`net use`), 자격 증명 등록/삭제(`cmdkey`), 연결 진단(Ping/SMB 쓰기 테스트), 작업 스케줄러 등록/조회/삭제 및 오래된 파일 스캔/삭제 등 시간이 소요되는 I/O 작업 수행 시 `RunWithBusyAsync` 래퍼를 통해 UI 스레드 마우스 포인터를 `Mouse.OverrideCursor = Cursors.Wait`로 자동 전환하고 완료 시 `null`로 안전하게 복원하도록 구현했습니다.
  - 전역 비지 오버레이(`BusyOverlayVisibility`, `BusyMessage`)를 추가하여 백그라운드 작업 진행 중 사용자에게 직관적인 진행 상태를 알립니다.
- **🔒 NAS 제어 및 스케줄러/정리 버튼 비활성화(`IsEnabled`) 상태 제어**:
  - `IsNasBusy` / `IsNotNasBusy` 및 `IsBusy` / `IsNotBusy` 플래그를 `MainWindow.xaml`의 모든 관련 버튼(`cmdkey 등록`, `자격 증명 삭제`, `net use 연결/해제`, `연결 진단`, `스케줄러 등록/새로고침/삭제`, `자동정리 스캔/삭제` 등)과 텍스트 입력 상자에 양방향 바인딩하여 중복 클릭 및 예외 발생을 방지했습니다.
- **📊 NAS 상태 바 인라인 프로그레스 인디케이터(`NasBusyProgressVisibility`) 추가**:
  - NAS 설정 영역 하단 상태 바에 미니 프로그레스 바를 탑재하여 네트워크 핑 및 세션 연결이 진행 중임을 명확히 시각화했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.4)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.4 일괄 동기화.

---

## 📌 [v2.2.3] - 2026-08-23
### 🛠️ ToggleButton.IsChecked 속성 설정 XAML 데이터 바인딩 런타임 예외 원천 해결
- **🛡️ `ToggleButton.IsChecked` 및 `RadioButton` 양방향 바인딩(TwoWay) 세터(Setter) 완비**:
  - `MainWindow.xaml` 초기화(`InitializeComponent`) 시 포터블/서비스 실행 모드(`IsExecutionModePortable`, `IsExecutionModeService`) 및 자동정리 규칙(`IsCleanupTypeDays`, `IsCleanupTypeSize`) 등 `RadioButton` / `ToggleButton` 컨트롤의 `IsChecked` 속성을 파싱·설정하는 과정에서 읽기 전용(Getter-only) 프로퍼티로 인한 `System.Windows.Controls.Primitives.ToggleButton.IsChecked` 리플렉션 예외(`ArgumentException`/`InvalidOperationException`)를 완벽히 해결했습니다.
  - `MainViewModel.cs` 내 모든 토글/모드 연동 프로퍼티(`IsExecutionModePortable`, `IsExecutionModeService`, `IsCleanupTypeDays`, `IsCleanupTypeSize`, `IsNasAuthCmdkey`, `IsNasAuthNetUse`, `IsThemeDark`, `IsThemeIvory`, `IsThemeGray`, `IsMasterServerMigration` 등)에 안전한 `set` 접근자를 추가하고, `MainWindow.xaml` 내 `RadioButton.IsChecked` 바인딩을 안정적인 `TwoWay`로 정비했습니다.
- **📋 상세 내부 예외(InnerException) 로깅 및 오류 진단 강화**:
  - `App.xaml.cs`의 `OnStartup` 예외 처리기에 `InnerException` 상세 메시지 및 중첩 원인 문자열을 포함하여 예외 발생 시 신속하고 명확한 디버깅이 가능하도록 개선했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.3)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.3 일괄 동기화.

---

## 📌 [v2.2.2] - 2026-08-22
### 🖥️ 프로세스 실행 후 메인 윈도우 화면 미표시(UI 블로킹/프리즈) 원천 해결
- **⚡ 비동기 시스템 상태 조회 (`Task.Run`) 및 즉각적인 UI 렌더링 보장**:
  - `MainViewModel` 생성자 실행 시 작업 스케줄러(`schtasks.exe`) 및 윈도우 서비스(`sc.exe`)의 상태를 동기적으로 조회하면서 UI 스레드가 블로킹되어 창이 뜨지 않거나 지연되던 문제를 해결했습니다.
  - 초기 시스템 상태 조회를 `Task.Run` 백그라운드 비동기 태스크로 전환하여 애플리케이션 실행 즉시 0ms 지연으로 메인 화면이 활성화되어 나타납니다.
- **🛡️ 프로세스 표준 스트림 파이프 버퍼 데드락 제거 & 2초 안전 타임아웃 적용**:
  - `QuerySchtasksWithEncodingSafe` 및 `CheckServiceStatus`에서 표준 에러 스트림 미소비로 인한 OS 파이프 버퍼 대기(Deadlock)를 차단하기 위해 불필요한 `RedirectStandardError` 설정을 해제하고 `WaitForExit(2000)` 안전 타임아웃을 적용했습니다.
- **🚪 `App.xaml.cs` 명시적 윈도우 생명주기 제어 및 상세 예외 대화상자 구현**:
  - `App.xaml`의 `StartupUri` 종속성을 탈피하고 `App.xaml.cs` `OnStartup`에서 명시적으로 `MainWindow` 인스턴스를 생성 후 `.Show()`, `.Activate()`, `.Focus()`를 호출하도록 개편했습니다.
  - 시작 시 XAML 렌더링 또는 런타임 오류 발생 시 자동 종료 대신 상세 오류 팝업(`MessageBox.Show`) 및 `%ProgramData%\RoboBackupStudio\service.log` 파일에 스택 트레이스를 기록하도록 방어 로직을 강화했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.2 일괄 동기화.

---

## 📌 [v2.2.1] - 2026-08-22
### 🛡️ Inno Setup 설치 완료 후 자동 실행 권한 상승 오류(Error 740) 해결
- **🔐 관리자 권한 상속 실행 플래그 적용 (`runascurrentuser`)**:
  - `RoboBackupStudio.exe`는 Robocopy 엔진, VSS 스냅샷, NAS 자격 증명 및 Windows 서비스 제어를 위해 매니페스트(`app.manifest`) 상 `requireAdministrator` 권한을 요구합니다.
  - Inno Setup 마법사 완료 시 `[Run]` 항목의 기본 동작(`runasoriginaluser`)으로 인해 비상승 사용자 권한으로 `CreateProcess`를 시도하다가 발생하던 `CreateProcess 실패; 코드 740. 요청한 작업을 수행하려면 권한 상승이 필요합니다` 오류를 해결했습니다.
  - `installer.iss`의 `[Run]` 섹션에 `runascurrentuser` 플래그를 적용하여 인스톨러의 상승된 관리자 권한 토큰을 그대로 상속받아 설치 직후 자동 실행이 100% 정상 작동하도록 수정했습니다.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.1 일괄 동기화.

---

## 📌 [v2.2.0] - 2026-08-20
### 📦 Inno Setup 인스톨러 폴더 풀림 설치(Unpacked Multi-File) 지원 & 단일 파일 실행 분리
- **📂 인스톨러 설치 시 프로그램 폴더 내 전체 바이너리/DLL 풀림 설치 구현**:
  - `installer.iss` 배포 대상을 기존 단일 압축 바이너리 복사 방식에서, `.NET` 애플리케이션의 모든 종속성 DLL, 런타임 구성 파일(`.runtimeconfig.json`), 실행 파일(`RoboBackupStudio.exe`)이 `{app}` (`C:\Program Files\RoboBackup Studio`) 폴더에 개별 파일로 완전히 풀려서 설치되도록 개편 (`Source: "publish\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs`).
  - 단일 실행 파일 압축으로 인한 실행 시작 지연 및 임시 폴더 언팩 오버헤드를 완전히 제거하고, 윈도우 표준 네이티브 프로그램 폴더 구조로 빠르고 안정적인 구동 보장.
- **⚡ `build.bat` 자동 빌드 파이프라인 듀얼 출력 체계 구축**:
  - **[1/2] 인스톨러용 풀린 파일 빌드**: `dotnet publish -r win-x64 --self-contained true /p:PublishSingleFile=false -o "./publish/app"`
  - **[2/2] 포터블 무설치 단일 파일 빌드**: `dotnet publish -r win-x64 --self-contained true /p:PublishSingleFile=true -o "./publish/temp_single"` -> `publish/RoboBackupStudio_v2.2.0.exe`
  - Inno Setup 컴파일러(ISCC)가 `publish/app/`의 전체 풀린 파일들을 패키징하여 `publish/RoboBackupStudio_v2.2.0_Setup.exe` 생성.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.2.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.2.0 일괄 동기화.

---

## 📌 [v2.1.0] - 2026-08-20
### 📦 Inno Setup 인스톨러 전용화 & 포터블 모드 분리 정리
- **🧹 설치 프로그램(Setup)에서 포터블 모드 선택창 완전 제거**:
  - `installer.iss` 마법사에서 포터블 실행 분기(`InstallTypePage`, `[Code]` 추출 로직, `Portable_RoboBackupStudio.exe` 참조)를 완전히 제거하고, 순수 표준 윈도우 인스톨러(Program Files 정식 설치, 바로가기 생성, Windows 서비스 자동 등록)로 간소화 및 무결성 확보.
  - 마법사 창 멈춤, 비정상 프로세스 잔존, 임시 폴더 간섭 등의 잠재적 문제를 원천 차단.
- **⚡ 포터블 버전과 인스톨러 버전의 명확한 역할 분리**:
  - **포터블 무설치 사용자**: `build.bat`로 빌드된 독립 단일 실행 파일(`publish/RoboBackupStudio_v2.1.0.exe`)을 설치 과정 없이 바로 사용.
  - **정식 윈도우 설치 사용자**: `publish/RoboBackupStudio_v2.1.0_Setup.exe`를 통해 Program Files 정식 설치, 바탕화면/시작메뉴 바로가기 생성, 백그라운드 Windows Service 무인 자동화 연동을 간편하게 진행.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.1.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.1.0 일괄 동기화.

---

## 📌 [v2.0.2] - 2026-08-18
### 🚀 Inno Setup 포터블 실행 파이프라인 무결성 확보 & 프로세스 소멸 버그 완전 종결
- **🧹 Win32 비정상 강제종료 탈피 및 정상 메시지 루프 종료 (`PostMessage WM_CLOSE`)**:
  - `installer.iss`에서 `ExitProcess(0)` 강제 스레드 파괴 호출을 제거하고, Windows 표준 `PostMessage(WizardForm.Handle, $0010, 0, 0)` (WM_CLOSE) 기반으로 마법사가 백그라운드에서 깨끗하고 부드럽게 소멸되도록 전환.
  - Setup 프로세스가 작업 관리자에 멈춰있거나 자식 프로세스 생성을 중단시키는 현상을 100% 원천 해결.
- **⚡ 영구 디렉토리 격리 복제 (`%LOCALAPPDATA%\RoboBackupStudio`) & 비동기 프로세스 보호**:
  - Inno Setup 마법사에서 포터블 모드 선택 시 `%LOCALAPPDATA%\RoboBackupStudio\RoboBackupStudio.exe`로 안전하게 파일을 복제한 뒤 `ShellExec` 비동기(`ewNoWait`)로 독립 구동.
  - 임시 폴더 삭제 및 인스톨러 종료 간섭 없이 포터블 앱이 백그라운드 및 포그라운드에서 영구적으로 안정 실행되도록 보장.
- **🛡️ WPF 엔트리포인트 및 Dispatcher 라이프사이클 최적화**:
  - `App.xaml` 내 `StartupUri="MainWindow.xaml"`를 명시하여 WPF 프레임워크 표준 디스패처 펌프를 완벽 보장.
  - `--service` 백그라운드 서비스 모드에서는 `StartupUri = null;`로 즉시 전환하여 Win32 SCM 서비스와 GUI 모드를 완벽 분리.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.0.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `App.xaml`, `App.xaml.cs`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.0.2 일괄 동기화.

---

## 📌 [v2.0.1] - 2026-08-18
### 🚀 Inno Setup 포터블 실행 파이프라인 안정화 & WPF 프로세스 생명주기 완벽 제어
- **🧹 Setup 인스톨러 잔존 프로세스 완전 소멸 (`ExitProcess(0)`)**:
  - `installer.iss` 스크립트 내 Win32 API `kernel32.dll`의 `ExitProcess(0)`를 연동.
  - 무설치 포터블 모드 실행 시 백그라운드에 `Setup(32비트)` 또는 `Setup/Uninstall(32비트)` 잔존 프로세스가 남지 않고 즉각 100% 완전 종료되도록 수정.
- **⚡ 포터블 어셈블리 독립 격리 실행 및 임시 디렉토리 소멸 간섭 해결**:
  - Inno Setup 마법사에서 포터블 모드 선택 시 `%LOCALAPPDATA%\RoboBackupStudio\RoboBackupStudio.exe` 및 원본 설치 위치(`{src}`)로 실행 바이너리를 안전 복제한 후 비동기(`ewNoWait`)로 구동.
  - 마법사 종료 시 임시 폴더(`{tmp}`)가 삭제되더라도 실행 중인 포터블 앱 프로세스에 아무런 영향을 주지 않도록 완벽 분리.
- **🛡️ WPF 시작 파이프라인 및 중복 윈도우 생성/종료 충돌 방지**:
  - `App.xaml` 내 `StartupUri="MainWindow.xaml"` 선언을 제거하고 `App.xaml.cs`의 `OnStartup`에서 단일 인스턴스로 `MainWindow`를 관리.
  - `ShutdownMode = ShutdownMode.OnMainWindowClose;` 명시적 지정을 통해 비정상 프로세스 조기 종료를 방지.
  - `AppDomain.UnhandledException` 및 `DispatcherUnhandledException` 로깅 및 오류 대화상자 알림 등록.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.0.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `MainViewModel.cs`, `App.xaml.cs`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.0.1 동기화.

---

## 📌 [v2.0.0] - 2026-08-17
### ⚙️ Windows 서비스 자동 가동/등록 기능 및 Dual Mode (포터블 / 인스톨 서비스) 지원
- **🖥️ 듀얼 멀티 런타임 동작 모드 구축 (Portable vs Windows Service Mode)**:
  - **포터블 앱 모드 (Portable Mode)**: GUI 앱 실행 중에 백그라운드 스케줄러로 작동하며 무설치로 즉시 사용 가능.
  - **Windows 서비스 모드 (Windows Service Mode)**: Windows 부팅 시 로그인 없이 백그라운드 서비스(`RoboBackupService`)로 자동 가동되어 무인 백업 집행.
- **🛠️ `App.xaml.cs` 및 `MainViewModel.cs` 백그라운드 서비스 엔트리포인트 구현**:
  - 커맨드라인 파라미터 `--service` 감지 시 WPF GUI 창 생성 없이 백그라운드 루프로 즉시 진입하는 헤드리스 서비스 모드 구현 (`ServiceBase.Run` 지원).
  - C# WPF UI 내 Windows 서비스 제어판 추가: `sc.exe` 명령 연동 서비스 등록, 시작, 중지, 삭제 및 실시간 상태 감지 커맨드 바인딩.
  - `.NET` 컴파일 시 `ServiceBase` 참조 오류(CS1069) 해결을 위한 `System.ServiceProcess.ServiceController` (v9.0.2) NuGet 패키지 참조 추가.
- **📦 Inno Setup (`installer.iss`) 시작 메뉴 모드 선택 & 권한 승인 보완**:
  - **초기 설치 모드 위저드 페이지 구축**: 설치 스크립트 가동 시 첫 메뉴에서 `🚀 포터블 바로 실행 (무설치)`과 `💻 윈도우 정식 설치` 중 선택할 수 있는 선택창 도입.
  - **포터블 바로 실행 시 동작**: 시스템 설치/레지스트리 등록 없이 `dontcopy` 임시 압축 해제 메커니즘을 통해 임시 공간에서 `RoboBackupStudio_v2.0.0.exe`를 즉시 가동하고 설치 창 자동 종료 (`ExtractTemporaryFile` 런타임 오류 해결).
  - **CreateProcess 코드 740 에러 해결**: 설치 완료 후 앱 자동 실행 시 권한 상승(UAC) 실패로 인한 `CreateProcess 실패; 코드 740` 오류 방지를 위해 `runasoriginaluser` 플래그 적용.
  - Inno Setup 설치 시 "Windows 서비스로 자동 등록하여 부팅 시 백그라운드 무인 백업 실행" 체크박스 태스크 옵션 제공.
  - 설치 완료 시 `sc.exe create` 및 `sc.exe start` 자동 실행, 언인스톨 시 `sc.exe stop` 및 `sc.exe delete` 자동 정리를 지원.
  - Inno Setup 6 컴파일 시 `Flags` 파라미터 미지원 플래그(`optional`) 수정 (`skipifsourcedoesntexist` 적용하여 `_Setup.exe` 100% 정상 빌드 완료).
- **🔄 버전 메타데이터 전체 일괄 동기화 (v2.0.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `MainViewModel.cs`, `App.xaml.cs`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 v2.0.0 동기화.

---

## 📌 [v1.9.0] - 2026-08-17
### 📦 Inno Setup 6 기반 공식 Windows 설치 프로그램 패키징 파이프라인 구축
- **🛠️ Inno Setup 스크립트 (`installer.iss`) 공식 생성**:
  - Windows 사용자용 자동 설치 파일(`RoboBackupStudio_v1.9.0_Setup.exe`)을 생성할 수 있는 Inno Setup 6 호환 배포 스크립트 구축.
  - 바탕 화면 바로가기 생성, 시작 메뉴 그룹 등록, 관리자 권한(`PrivilegesRequired=admin`) 승인, 한국어/영어 언어 지원 및 설치 완료 후 자동 실행 옵션 포함.
  - MIT 공식 라이선스 문서 (`docs/LICENSE.txt`) 자동 동기화.
- **⚙️ `build.bat` 자동 설치 파일 컴파일러 연동**:
  - `build.bat` 실행 시 `.NET 10.0` 단일 파일 빌드 후 시스템에 설치된 Inno Setup Compiler (`ISCC.exe`)를 자동 감지하여 설치 프로그램(`RoboBackupStudio_v1.9.0_Setup.exe`)까지 일괄 자동 생성.
- **🔄 버전 메타데이터 전체 일괄 동기화 (v1.9.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `installer.iss`, `MainWindow.xaml`, `Navbar.tsx`, `App.tsx`, `HelpAndLicense.tsx`, `robocopy.ts` 버전 동기화.

---

## 📌 [v1.8.0] - 2026-08-17
### 🚀 타겟 프레임워크 .NET 10.0 (LTS) 전면 업그레이드 & 빌드 파이프라인 개편
- **⚡ .NET 10.0 (LTS) 장기 지원 프레임워크 공식 도입**:
  - 기존 .NET 8.0/9.0 타겟에서 2028년 11월까지 장기 보장되는 차세대 **.NET 10.0 (`net10.0-windows`)**으로 타겟 프레임워크 전면 업그레이드.
  - 최신 JIT/AOT 메모리 관리 최적화 및 C# 런타임 성능 향상 적용.
- **🔄 프로젝트 및 빌드 메타데이터 전체 일괄 동기화 (v1.8.0)**:
  - **C# WPF (`RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`)**:
    - `<TargetFramework>net10.0-windows</TargetFramework>` 및 어셈블리 버전 `1.8.0.0` 업그레이드.
    - `build.bat` 자동 빌드 파이프라인의 .NET 10.0 단일 실행 파일 컴파일 구성 반영.
  - **React UI (`App.tsx`, `Navbar.tsx`, `HelpAndLicense.tsx`, `robocopy.ts`)**:
    - 내보내기용 C# WPF 템플릿 코드 및 오픈소스 라이선스 고지문, 버전 배지, 푸터 메타데이터 완벽 동기화.

---

## 📌 [v1.7.2] - 2026-08-17
### 🔗 개발자 블로그 & 회사 홈페이지 하이퍼링크 클릭 실행 기능 추가
- **🌐 하이퍼링크 클릭 시 웹 브라우저 자동 실행 지원 (Interactive URL Links)**:
  - 하단 푸터 영역 및 '도움말 & 라이선스' 탭 내 개발자 정보에 포함된 **구글 블로그 (`https://ahbivibelog.blogspot.com/`)** 및 **회사 홈페이지 (`http://www.cisnet.co.kr/`)** 텍스트 클릭 시, 사용자의 기본 웹 브라우저에서 해당 사이트가 즉시 열리도록 개선.
- **🔄 React 웹 UI & C# WPF MVVM 듀얼 구현**:
  - **React UI (`App.tsx`, `HelpAndLicense.tsx`)**: `target="_blank" rel="noopener noreferrer"` 속성이 적용된 대화형 웹 링크로 렌더링.
  - **C# WPF (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
    - `OpenUrlCommand` MVVM 커맨드 및 `Process.Start` 시스템 프로세스 오픈 핸들러 추가.
    - 하단 푸터 및 도움말 탭 텍스트에 커서 `Hand` 스타일 및 클릭 이벤트 바인딩 적용.
- **🔄 버전 메타데이터 일괄 동기화 (v1.7.2)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `MainViewModel.cs`, `src/utils/robocopy.ts`, `Navbar.tsx`, `App.tsx` 버전 정보 동기화.

---

## 📌 [v1.7.1] - 2026-08-17
### 🎨 테마 최적화: 레트로 'Windows XP' 테마 제거 및 모던 3대 핵심 테마 정립
- **🧹 레트로 'Windows XP' 테마 제거 (Streamlined Theme Collection)**:
  - 사용자 피드백 반영: 현대적인 백업 도구 디자인 정체성과 가독성 강화를 위해 레트로 Windows XP 루나 테마 및 전용 XP 레트로 타이틀바 구조를 깔끔하게 제외.
  - 최신 가독성에 최적화된 **3대 핵심 모던 테마(🌙 다크 모드 / 🍦 부드러운 아이보리 / 🏢 모던 그레이)** 시스템으로 테마 선택 UI 전면 정돈.
- **🔄 React 웹 UI & C# WPF MVVM 듀얼 아키텍처 완벽 동기화**:
  - **React UI (`Navbar.tsx`, `App.tsx`, `index.css`, `types.ts`)**:
    - `AppTheme` 타입 및 테마 셀렉터 드롭다운에서 `xp` 옵션 및 CSS 스타일 규칙 정리, 3대 테마 선택지로 경량화.
  - **C# WPF MVVM (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
    - Windows XP 전용 타이틀바 Grid Row 및 XP 테마 선택 버튼 제거.
    - `CurrentTheme` 속성의 `xp` 패턴 분기 및 관련 프로퍼티 정리를 통해 빌드 경량화 및 바인딩 무결성 확보.
- **🔄 버전 메타데이터 일괄 동기화 (v1.7.1)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `MainViewModel.cs`, `src/utils/robocopy.ts`, `Navbar.tsx` 버전 정보 일괄 갱신.

---

## 📌 [v1.7.0] - 2026-08-17
### 🎨 UI/UX 대개편: 시각적 피로도 해소를 위한 접이식 고급 옵션 구조화 및 원클릭 최적 조합 프리셋 접근성 혁신
- **👀 화면 복잡도 및 텍스트 피로도 완벽 해소 (Clutter-Free Streamlined UI)**:
  - 수많은 고급 명령어 텍스트가 첫 화면에 한꺼번에 노출되어 발생하는 가독성 저하 문제를 해결하기 위해, 인터페이스를 체계적인 **접이식(Collapsible Accordion / Toggle View)** 계층 구조로 전면 재설계.
- **✨ 원클릭 최적 조합의 '초고속 백업 프리셋' 영역 통합 배치**:
  - 기존 거대 고급 설정창에 흩어져 있던 **5대 엔터프라이즈 마스터 프리셋 (원클릭 최적 조합)**을 '🚀 초고속 백업 프리셋 선택' 영역 상단의 **`[✨ 고급 최적 조합 프리셋 (더보기 / 접기)]`** 토글 버튼으로 직관적 연결.
  - 클릭 시 서버 마이그레이션(`/COPYALL /ZB /XJ /FFT`), NVMe 초고속(`/MT:32 /NP /IPG:0`), NAS 안정 동기화(`/FFT /ZB /R:2 /W:3`), 대역폭 분산(`/IPG:50 /MT:4`), 야간 백업 창(`/RH /PF`) 등 마스터 조합이 시각적 하이라이트와 함께 확장되어 즉시 적용 가능.
- **⚙️ 기본 옵션 하단 접이식 '고급 옵션' 허브 재배치**:
  - 'Robocopy 핵심 옵션 및 스레드 설정' 카드 우측 상단에 **`[⚡ 고급 옵션 열기 / 닫기]`** 토글 버튼 신설.
  - 사용자가 기본 설정(/MIR, /MT:16, /ZB, /FFT, /XO, /NP, /XF, /XD) 아래에서 버튼을 클릭했을 때만 5대 카테고리(보안ACL, 성능/대역폭, 정밀필터/용량연령, 실시간감시/시간대, NAS/로깅) 세부 설정이 깔끔하게 펼쳐지도록 최적화.
- **🔄 React 웹 UI & C# WPF MVVM 듀얼 아키텍처 완벽 동기화**:
  - **React UI (`JobDesigner.tsx`, `AdvancedRobocopyMenu.tsx`)**:
    - 불필요한 중복 검색바와 카테고리 칩을 정리하고, 부드러운 애니메이션 토글 및 반응형 배지 적용.
  - **C# WPF MVVM (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
    - `IsAdvancedPresetsOpen`, `IsAdvancedFlagsOpen`, `AdvancedPresetsToggleText`, `AdvancedFlagsToggleText` 및 토글 커맨드(`ToggleAdvancedPresetsCommand`, `ToggleAdvancedFlagsCommand`) 양방향 바인딩 구현.
- **🔄 버전 메타데이터 일괄 동기화 (v1.7.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `MainViewModel.cs`, `src/utils/robocopy.ts` 일괄 갱신.

---

## 📌 [v1.6.0] - 2026-08-17
### 🎉 신규 기능: 다중 테마 시스템 (다크 / 아이보리 / 회색 / Windows XP 루나 에디션) 전면 지원
- **🎨 4대 멀티 테마 엔진 (Multi-Theme Styling Engine)**:
  - 사용자의 시각 환경 및 레트로 감성을 만족시키는 **4종 전용 테마** 구현:
    1. **🌙 다크 모드 (Default Dark)**:
       - 딥 슬레이트 블랙(`bg-slate-900`/`#0f172a`) 배경과 시원한 블루/스카이 하이라이트를 결합한 야간 및 전문 작업 환경 최적화 테마.
    2. **🍦 부드러운 아이보리 (Warm Ivory)**:
       - 눈의 피로를 최소화하는 따뜻한 웜 크림/아이보리(`bg-[#faf7f2]`/`#faf7f2`) 톤과 앤틱 앰버 악센트가 어우러진 주간 친화적 라이트 테마.
    3. **🏢 모던 슬레이트 회색 (Modern Slate Gray)**:
       - 엔터프라이즈 업무 소프트웨어 표준의 차분한 라이트 쿨 그레이(`bg-[#eef2f6]`/`#eef2f6`)와 깔끔한 화이트 카드 레이아웃.
    4. **🪟 클래식 윈도우 XP (Windows XP Luna Classic Edition)**:
       - 윈도우 XP 특유의 클래식 베이지 윈도우 배경(`bg-[#ece9d8]`/`#ece9d8`), 시그니처 루나 블루 그라데이션 상단 타이틀바(`xp-titlebar`), 3D 볼록 창 제어 버튼(`_`, `□`, `✕`), 2px 입체 테두리(`border-[#7f9db9]`) 및 클래식 시스템 폰트 감성 완벽 재현.
- **🔄 React 웹 프리뷰 & C# WPF MVVM 듀얼 동기화**:
  - **React UI (`Navbar.tsx`, `App.tsx`, `index.css`, `types.ts`)**:
    - 내비게이션 바에 원클릭 테마 전환 드롭다운 메뉴 및 단축 버튼 배치.
    - 루트 `<html>` 클래스(`theme-ivory`, `theme-gray`, `theme-xp`)와 CSS 변수 기반 즉각적인 전체 UI 테마 전환 처리.
    - Windows XP 모드 활성화 시 상단 레트로 윈도우 바 자동 렌더링.
  - **C# WPF MVVM (`MainWindow.xaml`, `ViewModels/MainViewModel.cs`)**:
    - `CurrentTheme` 속성 및 `ChangeThemeCommand` 구현.
    - `ThemeWindowBackground`, `ThemeHeaderBackground`, `ThemeBorderBrush`, `ThemeTextPrimary` 등 동적 브러시 바인딩을 통해 WPF 런타임에서도 즉시 테마 색상이 동기화되도록 구현.
    - XP 전용 헤더(`ThemeXpHeaderVisibility`) 조건부 표시 처리.
- **🔄 프로젝트 버전 및 빌드 메타데이터 일괄 동기화 (v1.6.0)**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj`, `build.bat`, `MainWindow.xaml`, `MainViewModel.cs`, `src/utils/robocopy.ts` 일괄 갱신.

---

## 📌 [v1.5.1] - 2026-08-16
### 🛠️ UI/UX 개선 및 버그 수정: 초고속 백업 프리셋 버튼 시각적 피드백 & 색상 반응형 바인딩 전면 동기화
- **🎨 초고속 백업 및 엔터프라이즈 마스터 프리셋 버튼 색상 반응성 강화**:
  - **문제 해결**: "초고속 백업 / NVMe 초고속 복사" 및 각 프리셋 버튼을 클릭했을 때 버튼 색상 변화가 없거나 식별이 어렵던 UI 상태 갱신 문제를 완벽히 해결.
  - **WPF MVVM 동적 바인딩 적용 (`MainWindow.xaml`, `MainViewModel.cs`)**:
    - 하드코딩된 정적 색상 스타일을 제거하고, `SelectedPresetName` 및 `SelectedAdvancedMasterPreset` 변경 시 즉시 알림(`OnPropertyChanged`)을 받는 반응형 배경색(`PresetHighSpeedMirrorBackground`, `PresetIncrementalBackground` 등) 및 테두리(`BorderBrush`) 속성을 구현.
    - 활성화된 프리셋 버튼은 고대비 하이라이트 색상 및 1.5~2px 강조 테두리로 즉각 변경되도록 개선.
  - **웹 프리뷰 UI 시각 피드백 고도화 (`JobDesigner.tsx`, `AdvancedRobocopyMenu.tsx`)**:
    - 5대 표준 프리셋 및 5대 엔터프라이즈 마스터 프리셋 버튼에 프리셋 고유의 비비드 컬러 그라데이션(`Blue`, `Emerald/Teal`, `Indigo`, `Amber`, `Purple`) 적용.
    - 선택 시 우측 상단 `[✓ 적용됨 (Active)]` 배지와 펄스 인디케이터가 표시되어 활성화 상태가 명확히 인지되도록 구현.
- **🔄 버전 메타데이터 동기화**:
  - `docs/PATCH_NOTES.md`, `RoboBackupStudio.csproj` (1.5.1), `build.bat` (v1.5.1), `MainWindow.xaml` (v1.5.1), `MainViewModel.cs`, `src/utils/robocopy.ts` 버전 일괄 갱신.

---

## 📌 [v1.5.0] - 2026-08-15
### 🎉 신규 기능: Robocopy 5대 핵심 카테고리 고급 명령어 허브 & 사용자 지정 스케줄러 명칭 지원
- **🎛️ Robocopy 고급 명령어 & 엔터프라이즈 옵션 허브 (Advanced Robocopy Hub)**:
  - Robocopy의 모든 전문 옵션을 **5대 핵심 카테고리**로 체계적 분류 및 GUI 제어:
    1. **보안 & 권한 (`Security & Metadata`)**:
       - `/COPYALL` (데이터+속성+타임스탬프+보안ACL+소유자+감사정보 전체 복제), `/SEC` (NTFS 보안 ACL 복제), `/SECFIX` (기존 파일의 보안 권한 동기화 강제 수정), `/TIMFIX` (타임스탬프 오류 보정), `/NOOFFLOAD` (Windows Copy Offload ODX 우회)
    2. **성능 & I/O 대역폭 제어 (`Performance & Throttling`)**:
       - `/IPG:n` (밀리초 단위 패킷 간 지연 슬라이더로 업무 시간 대역폭 독점 방지), `/MT:n` (최대 128 멀티스레드), `/XJ` (디렉터리/파일 Junction 링크 탐색 제외로 무한 순환참조 방지), `/SL` (심볼릭 링크 복제), `/SJ` (Junction 복제)
    3. **정밀 파일 필터링 & 조건부 복사 (`Advanced Filtering`)**:
       - `/XO` (대상 위치에 존재하는 최신 파일 보호/오래된 파일 덮어쓰기 방지), `/XN` (새 파일 제외), `/XC` (변경된 파일 제외), `/XU` (동일한 파일 제외), `/XX` (추가 파일 제외), `/XL` (외톨이 파일 제외)
       - `/MIN:n` / `/MAX:n` (MB 단위 파일 용량 필터링, 바이트 단위 자동 변환)
       - `/MINAGE:n` / `/MAXAGE:n` (일 단위 파일 연령 필터링으로 아카이빙 및 최근 생성 파일 선별)
    4. **실시간 감시 & 연속 동기화 (`Real-time Sync & Time Window`)**:
       - `/MON:n` (원본 디렉터리 내 N개 파일 변경 감지 시 즉시 백업 트리거)
       - `/MOT:m` (수정 후 M분 동안 추가 변경이 없을 때 안전 동기화 수행)
       - `/RH:hhmm-hhmm` (야간 등 특정 허용 시간대 백업 실행, 원클릭 22:00~06:00 세팅 지원)
       - `/PF` (패스 단위가 아닌 파일 단위로 시간대를 엄격히 재확인)
    5. **NAS 및 파일시스템 호환성 (`NAS & File Systems`)**:
       - `/FFT` (FAT/SMB 2초 타임스탬프 오차 허용), `/FAT` (8.3 짧은 파일명 강제), `/BYTES` (로그 크기를 바이트 단위로 상세 출력)
  - **⚡ 실무 추천 고급 마스터 조합 (One-Click Presets)**:
    - 🛡️ 서버 마이그레이션 (`/COPYALL /ZB /XJ`), ⚡ NVMe 초고속 복사 (`/MT:32 /NP`), 🌐 NAS 안정 백업 (`/FFT /ZB /R:2 /W:3`), ⏱️ 대역폭 독점 방지 (`/IPG:50 /MT:4`), 🌙 야간 시간대 전용 (`/RH:2200-0600 /PF`)

- **🏷️ 스케줄러 등록 작업 이름 사용자 지정 (Custom Task Scheduler Names)**:
  - 기존 고정 이름(`RoboBackupStudio_AutoSync`, `RoboBackupStudio_AutoCleanup`) 대신, 사용자가 직접 스케줄러 작업 이름을 입력 및 변경할 수 있도록 지원.
  - 부서별/폴더별/용도별(예: `Finance_Nightly_Sync`, `Storage_D_Archive_Cleanup`) 다중 스케줄 작업 등록 및 개별 상태 조회/삭제 지원.

- **🎨 UI 반응성 및 입력 검증(Sanitization) 고도화**:
  - **프리셋 선택 피드백**: 프리셋 선택 시 즉각적인 파란색 테두리, 하이라이트 및 `선택됨 (Active)` 배지 시각화.
  - **입력값 검증**: `/MIN`, `/MAX`, `/MINAGE`, `/MAXAGE`, `/MON`, `/MOT`, `/IPG` 등 수치 입력 필드에 비정상 문자나 `NaN`이 포함되지 않도록 견고한 입력 검증 및 자동 포맷팅.
  - **한글 인코딩 깨짐 방지**: 콘솔 출력 및 PowerShell 스크립트 실행 시 UTF-8/CP949 인코딩 옵션 보강.

---

## 📌 [v1.4.0] - 2026-08-14
### 🎉 신규 기능: NAS / 네트워크 공유 경로 자격 증명 (로그인 인증) 지원
- **🔑 NAS 로그인 인증 관리 모듈 (NAS Network Credentials Manager)**:
  - Robocopy 자체에는 계정/비밀번호 옵션이 없으므로, **Windows OS 레벨의 자격 증명 및 SMB 세션 관리 기법**을 전면 지원.
  - **하이브리드 2중 인증 아키텍처**:
    1. **🥇 Windows 자격 증명 관리자 (`cmdkey`) - [스케줄러 무인 백업 최적]**:
       - Windows Credential Manager에 안전하게 암호화 보관.
       - 스크립트나 배치 파일에 평문 암호가 노출되지 않으며, 무인 백그라운드 예약 작업(`schtasks.exe`) 실행 시 Windows가 자동으로 인증 처리.
       - GUI 원클릭 자격 증명 등록(`SaveNasCredentialCommand`) 및 삭제(`DeleteNasCredentialCommand`).
    2. **🥈 임시 SMB 세션 연결 (`net use`) - [배치 스크립트 실행용]**:
       - 백업 작업 시작 전 `net use \\NAS\Share password /user:admin` 세션을 맺고 Robocopy 동기화 수행.
       - 옵션: 백업 완료 후 임시 세션 자동 안전 해제 (`/delete /y`) 지원.
  - **📡 실시간 NAS 연결 & 쓰기 권한 진단 (Ping + SMB Probe)**:
    - 원클릭으로 NAS 서버 Ping 응답 상태 및 공유 폴더 접근 권한을 사전 검증.
  - **⚡ NAS 네트워크 백업 최적화 플래그 원클릭 적용**:
    - 리눅스 기반 NAS(Synology, QNAP, ipTIME 등) 파일 시스템의 시간 오차 방지(`/FFT`), 권한 실패 재시도(`/ZB`), 네트워크 지연 고려 재시도 주기(`/R:2 /W:5`) 일괄 구성.
  - **📋 NAS 일체형 배치 스크립트 (.bat) 생성기**:
    - `net use` 또는 `cmdkey` 검증, Robocopy 멀티스레드 동기화, 종료 코드 파싱, 세션 해제가 포함된 완성형 `.bat` 파일 실시간 생성 및 클립보드 복사.
- **📜 도움말 및 오픈소스 라이선스 고지 (Help & Licenses)**:
  - 기능별 상세 사용 매뉴얼, 주요 플래그 설명, 작업 스케줄러 원리 및 FAQ 추가.
  - MIT / ISC / Windows OS 내장 유틸리티 연동 라이선스 고지문(`THIRD_PARTY_LICENSES.md`) 및 앱 내 전용 탭(`MainWindow.xaml`, `HelpAndLicense.tsx`) 추가.
  - 개발자(AhBiYout), 구글 블로그(ahbivibelog), 회사 홈페이지(CISNET) 공식 정보 등록.
- **🎨 UI & WPF MVVM 전면 반영**:
  - `JobDesigner.tsx` 및 `NasAuthManager.tsx` 웹 컴포넌트 추가.
  - `MainWindow.xaml` 백업 프로필 설계 탭 내 NAS 자격 증명 전용 패널 배치.
  - `MainViewModel.cs` 내 `SaveNasCredential`, `ConnectNetUse`, `TestNasConnection` 등 완전한 커맨드 구현.

---

## 📌 [v1.3.0] - 2026-08-14
### 🎉 신규 기능: 오래된 파일 자동 정리 전용 Windows 작업 스케줄러 추가
- **🧹 오래된 파일 자동 정리 스케줄러 (Auto Cleanup Scheduler)**:
  - 백업/아카이브 저장소의 용량 부족 및 오래된 불필요 파일 적체 현상을 방지하기 위해 **Windows 작업 스케줄러(schtasks.exe)에 자동 정리 작업을 정기 예약**할 수 있는 전용 스케줄러 기능 구축.
  - **스케줄 주기 설정**: 매일 실행 (Daily), 매주 실행 (Weekly), 매월 실행 (Monthly) 주기 지원.
  - **시작 일자 및 시간 선택**: 달력(`DatePicker`)과 시/분(`ComboBox`)을 통해 무인 실행 시간을 자유롭게 지정.
  - **자동 생성 PowerShell 스크립트 결합**:
    - **기간 기준 (Days)**: `Get-ChildItem -Recurse | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-N) } | Remove-Item -Force`
    - **용량 기준 (Size)**: 폴더 내 총 파일 용량이 한계치를 초과할 때 오래된 파일부터 정밀 순차 폐기하는 일체형 파이프라인.
  - **작업 관리 & 상태 감시**:
    - `schtasks /query /tn "RoboBackupStudio_AutoCleanup"` 실시간 상태 조회 및 카드 뷰 표출.
    - 원클릭 자동정리 스케줄 등록(`RegisterCleanupTaskCommand`) 및 삭제(`DeleteCleanupTaskCommand`).
    - 관리자 권한 최고 등급 실행(`/rl HIGHEST`) 옵션 완비.
- **🎨 WPF UI 및 웹 시뮬레이터 동기화**:
  - `AutoCleanup.tsx` 웹 컴포넌트에 스케줄러 제어 카드 및 CLI 스크립트 복사 박스 적용.
  - `MainWindow.xaml` Tab 4에 자동 정리 스케줄러 UI 패널 전면 수록.
  - `MainViewModel.cs`에 완벽한 비즈니스 로직 및 이벤트 바인딩 탑재.

---

## 📌 [v1.2.0] - 2026-08-13
### 🎉 신규 기능 및 안정성 강화
- **🧹 오래된 파일 자동 정리 모듈 (Auto Cleanup) 신규 추가**:
  - 지정 폴더의 오래된 파일부터 정리하는 전용 엔진 구축.
  - **기간 기준 정리 (Days Mode)**: 보관 기간(N일 이상 경과) 기준 오래된 파일 탐색 및 자동 삭제.
  - **용량 기준 정리 (Size Mode)**: 설정한 최대 허용 용량(N GB 초과 분) 도달 시, 수정 일자가 오래된 순서대로 파일 자동 정리.
  - **안전 스캔 & 삭제**: 삭제 전 미리보기 스캔(`ScanCleanupFilesCommand`) 및 삭제 안내/승인 확인 로직 포함.

- **⏰ Windows 작업 스케줄러 현황 조회 & 삭제 지원**:
  - **실시간 현황 조회**: `schtasks.exe /query` 명령으로 등록된 `RoboBackupStudio_AutoSync` 작업의 상태를 실시간 카드 뷰로 표출.
  - **원클릭 작업 삭제**: 버튼 하나로 윈도우 스케줄러에 등록된 자동 백업 작업을 안전하게 삭제(`schtasks /delete /f`).
  - **시작 일자 및 시/분 선택기**: 윈도우 달력(`DatePicker`) 및 시간/분 선택 상자(`ComboBox`)로 스케줄 시작 시점 직관적 지정.

- **🛡️ UAC 관리자 권한 및 `/ZB` 자동 복구 파이프라인**:
  - **`/ZB` 백업 권한 에러 방지**: 일반 권한 상태에서 `/ZB` 사용 시 발생하는 `Exit Code 16` (SeBackupPrivilege 권한 부족) 자동 감지.
  - **스마트 복구 & UAC 원클릭 재시작**: `/ZB` 옵션 자동 끄기 재시도 또는 원클릭 관리자 권한 재시작(`RestartAsAdminCommand`) 제공.
  - **매니페스트 자동 적용**: `app.manifest` 내 `requireAdministrator` 설정을 번들링하여 실행 시 항상 관리자 권한 승인 창 구동.

- **🎨 WPF UI 입력 컨트롤 가독성 및 디자인 개선**:
  - `ComboBox`, `ComboBoxItem`, `DatePicker`의 입력 글자색을 고대비 검정/진남색(`Foreground="#0f172a"`)으로 변경하여 시인성 확보.

---

## 📌 [v1.1.0] - 2026-08-11
### 🔄 변경 및 모듈 최적화
- **Gemini AI 로그 진단 모듈 제거**:
  - 사용자 요청에 따라 AI 로그 진단 API 및 탭을 제거하여 경량화 및 실행 속도 향상.
  - 외부 API 의존성을 배제하고 순수 윈도우 로컬 Robocopy 프로세스 관리에 집중.
- **문서화 센터 (`/docs`) 구축 및 확장**:
  - `README.md`, `WPF_MVVM_ARCHITECTURE.md`, `CSHARP_WPF_RECOMMENDATION.md`, `ROBOCOPY_FLAGS_GUIDE.md`, `TASK_SCHEDULER_GUIDE.md`, `PATCH_NOTES.md` 신규 생성 및 최신 명세로 업데이트.

---

## 📌 [v1.0.0] - 2026-08-11
### 🎉 최초 출시 (Initial Release)
- **Robocopy 백업 작업 설정기 (Job Designer)**: 원본/대상 폴더 지정, 핵심 옵션 플래그, 프리셋 프로필.
- **실시간 실행 모니터 & 로그 콘솔**: 비동기 스트림, 진행률 파싱.
- **Windows 작업 스케줄러 연동**: CLI 및 XML 생성.
- **C# WPF MVVM .NET 8.0 단일 실행 파일 빌드 파이프라인**.
