# RoboBackup Studio 문서 (Documentation Index)

Windows **Robocopy** 전용 GUI 백업 관리자 및 **C# WPF (MVVM)** 프로젝트 문서 모음입니다.

---

## 📁 문서 목차

1. [C# WPF MVVM 아키텍처 및 구현 가이드](./WPF_MVVM_ARCHITECTURE.md)
   - Robocopy 기반 백업 앱의 핵심 장점, MVVM 패턴 구조, 실시간 스트림 파싱 코드 예시 및 UAC/경로 공백 주의사항

2. [개발 언어 및 아키텍처 추천서](./CSHARP_WPF_RECOMMENDATION.md)
   - 윈도우 환경에서 Robocopy 백업 앱 개발 시 **C# + WPF + MVVM**을 추천하는 핵심 이유
   - Electron, Python(PyQt) 대비 초경량 메모리 및 실행 속도 비교

3. [Robocopy 종합 스위치 & 고급 플래그 레퍼런스 가이드](./ROBOCOPY_FLAGS_GUIDE.md)
   - 5대 핵심 카테고리 (보안/권한, 성능/대역폭, 정밀필터링, 실시간감시, NAS호환성) 전체 플래그 상세 해설
   - 실무 추천 5대 엔터프라이즈 마스터 프리셋 조합 수록

4. [NAS / 네트워크 공유 자격 증명(로그인 인증) 가이드](./NAS_AUTHENTICATION_GUIDE.md)
   - Windows 자격 증명 관리자(`cmdkey`) 및 SMB 세션(`net use`) 2중 인증 아키텍처
   - NAS 일체형 배치 스크립트(.bat) 생성 및 네트워크 진단

5. [윈도우 작업 스케줄러(Task Scheduler) 연동 가이드](./TASK_SCHEDULER_GUIDE.md)
   - 사용자 지정 작업 이름(Task Name) 다중 관리 지원
   - `schtasks.exe` CLI 자동 생성, 관리자 권한(`HIGHEST`), 정기 백업 & 자동정리 무인 실행

6. [순수 창작 5대 코어 DLL 아키텍처 및 세부 기술 명세서](./CORE_DLL_ARCHITECTURE.md)
   - RoboBackup Studio 고유의 5대 네이티브 창작 라이브러리(`RoboDiffEngine`, `RoboVssProvider`, `RoboSyncWatch`, `RoboVault`, `RoboTimeMachine`) 심층 설계 명세
   - Win32 P/Invoke, VSS 볼륨 스냅샷, 적응형 디바운스 큐, DPAPI 제로-로그인 보안 볼트, NTFS 하드링크 90% 절약 타임머신 동작 원리 총망라

7. [패치 및 릴리즈 노트](./PATCH_NOTES.md)
   - 프로젝트 버전별 업데이트 내역 (v1.0.0 ~ v2.12.4) 및 기능 변경 이력

8. [오픈소스 라이선스 고지](./THIRD_PARTY_LICENSES.md)
   - MIT, Lucide Icons, OS 내장 유틸리티 및 개발자 정보

9. **영문 자동 빌드 스크립트 (`build.bat`)**
   - `docs/PATCH_NOTES.md` 내 최신 버전 태그(예: `v2.16.5`)를 파싱하여 `RoboBackupStudio_v2.16.5.exe` 및 Inno Setup 설치 파일 자동 컴파일 및 패키징

10. [구글 블로거 포스팅 가이드 - 작성 모드 (서식 있는 텍스트)](./GOOGLE_BLOGGER_COMPOSE_MODE.md)
    - 구글 블로거(Blogger / Blogspot) 시각적 편집기(작성 모드)에 바로 복사하여 붙여넣을 수 있는 마크다운 및 서식 문서

11. [구글 블로거 포스팅 가이드 - HTML 편집 모드](./GOOGLE_BLOGGER_HTML_MODE.html)
    - 구글 블로거 `< > HTML 보기` 탭에 바로 붙여넣어 사용하는 인라인 스타일 적용 완벽 호환 반응형 카드 HTML 템플릿

---

## 🚀 프로젝트 개요 (v2.16.5)
- **앱 이름**: RoboBackup Studio
- **목적**: Windows 기본 내장 백업 유틸리티인 `Robocopy.exe`를 GUI 기반으로 시각화 및 제어하고, C# WPF MVVM 생산용 코드를 즉시 제공하며, 5대 순수 창작 코어 DLL 엔진으로 무중단·초고속·초절약 백업을 실현하는 고성능 백업 스튜디오.
- **주요 기능**:
  - **초보자 백업 마법사 (Easy Backup Wizard)**: 5단계 원클릭 가이드 설정 및 대상별 최적화 플래그 자동 추천
  - **드래그 앤 드롭 폴더 지정**: 원본 및 대상 폴더 직관적 선택
  - **실시간 Robocopy 명령어 빌더**: 클릭할 때마다 실시간 CLI 명령어 자동 생성 및 클립보드 복사
  - **5대 카테고리 고급 명령어 허브**: 보안/권한(`/COPYALL`, `/SEC`), 대역폭 제어(`/IPG`), 정밀 필터링(`/MIN`, `/MAX`, `/MINAGE`, `/MAXAGE`), 실시간 감시(`/MON`, `/MOT`, `/RH`, `/PF`)
  - **🧩 5대 순수 창작 코어 DLL 엔진**:
    1. `RoboDiffEngine`: 사전 차이 분석 & 바이트 예측 프리플라이트
    2. `RoboVssProvider`: VSS 섀도 복사본 잠금 파일(Locked Files) 100% 무중단 캡처
    3. `RoboSyncWatch`: 스마트 디바운스 큐 기반 실시간 자동 동기화
    4. `RoboVault`: DPAPI & Credential Manager 제로-로그인 NAS 보안 볼트
    5. `RoboTimeMachine`: NTFS 스마트 하드링크 기반 90% 용량 절감 타임머신 보관소
  - **NAS 2중 자격 증명 관리자**: `cmdkey` 및 `net use` 기반 SMB 무인 인증 및 일체형 `.bat` 스크립트 생성
  - **윈도우 예약 백업 (Task Scheduler)**: 사용자 정의 작업 이름, 실시간 현황 조회 및 원클릭 삭제 지원
  - **🛡️ Windows Defender 방화벽 예외 자동 관리**: 버전 명시 규칙명으로 NAS/SMB 통신 원클릭 등록
  - **🧹 오래된 파일 자동 정리 (Auto Cleanup)**: 기간별(N일 이상 경과) 및 용량별(N GB 초과 시) 오래된 파일 순차적 자동 삭제 스케줄러
  - **🛡️ UAC 관리자 권한 예외 처리**: `/ZB` 권한 오류 감지/복구, `app.manifest` 관리자 권한 자동 승인 번들링
  - **🎨 시각적 피드백 & 가독성 최적화 UI**: 13종 멀티 테마, 실시간 통계 HUD 및 직관적 가독성 보정
