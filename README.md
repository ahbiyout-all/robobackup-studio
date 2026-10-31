# 🚀 RoboBackup Studio (v2.17.8)

> **High-Performance Robocopy GUI, Real-time Monitor, Scheduler & C# WPF MVVM Generator**  
> **개발자**: AhBiYout | **공식 블로그**: [ahbiyoutvibe.blogspot.com](https://ahbiyoutvibe.blogspot.com/) | **GitHub**: [github.com/AhBiYout-all](https://github.com/AhBiYout-all)

[![Latest Release](https://img.shields.io/github/v/release/AhBiYout-all/robobackup-studio?color=emerald&label=Release&style=flat-sqlite)](https://github.com/AhBiYout-all/robobackup-studio/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/AhBiYout-all/robobackup-studio/build.yml?branch=main&label=CI%20Build)](https://github.com/AhBiYout-all/robobackup-studio/actions)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20.NET%208%20WPF-blue)](https://github.com/AhBiYout-all/robobackup-studio)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](docs/LICENSE.txt)

---

## 💖 후원 및 스폰서십 / 광고 안내 (Sponsors & Advertisers)

RoboBackup Studio 오픈소스 프로젝트는 개인 및 기업 사용자를 위해 무료로 제공됩니다.  
프로젝트의 지속적인 발전과 고성능 엔진 개발을 후원하고 싶으시거나 **README / 앱 내 광고 및 제휴 문의**가 있으신 경우 아래 링크를 확인해 주세요.

* **📢 배너 / 스폰서십 광고 문의**: `https://ahbiyoutvibe.blogspot.com/` (공식 블로그 문의)
* **💻 공식 GitHub 저장소**: [github.com/AhBiYout-all/robobackup-studio](https://github.com/AhBiYout-all/robobackup-studio)
* **☕ 개발자 후원 (GitHub Sponsors)**: 상단의 `💖 Sponsor` 버튼 클릭

---

## ✨ 핵심 주요 기능 (Key Features)

1. **⚡ 초고속 Robocopy 멀티스레드 병렬 백업 엔진**:
   - `/MIR` (1:1 미러링), `/E` (하위 폴더 복사), `/MT:16` (16병렬 스레드), `/ZB` (권한 우회 백업) 완벽 제어.
2. **🌳 엔터프라이즈급 재귀 디렉터리 크롤러 (`RoboDirectoryCrawler`)**:
   - BFS 비동기 큐 기반으로 윈도우 깊은 트리, 권한 보호 폴더(`System Volume Information`, `$RECYCLE.BIN`), 정션(Junction) 예외 없이 정밀 사전 집계.
3. **🔄 GitHub Releases 실시간 라이브 자동 업데이트 센터**:
   - GitHub API 연동으로 새 릴리스 인스톨러(`Setup.exe`) 출시 시 푸시 알림 및 원클릭 자동 업데이트.
4. **🧙‍♂️ 초보자 안심 백업 마법사 (5단계 가이드)**:
   - USB/외장하드, NAS, 1:1 미러링, 누적 보관 등 목적별 최적 옵션 자동 세팅.
5. **🧩 순수 C# 5대 네이티브 코어 모듈 (Core DLL Suite)**:
   - **RoboDiffEngine**: 1초 만에 소스-타깃 차이 사전 스캔.
   - **RoboVssProvider**: VSS 볼륨 섀도 복사본 스냅샷으로 열려 있는 파일 백업.
   - **RoboSyncWatch**: FileSystemWatcher 기반 파일 변경 실시간 자동 동기화.
   - **RoboVault**: Windows DPAPI 기반 NAS/네트워크 암호화 자격 증명 관리.
   - **RoboTimeMachine**: 타임머신 스냅샷 복원 포인트 관리.
6. **📅 Windows 작업 스케줄러 & 서비스 무인 자동화**:
   - 매일/매주 자동 백업 및 지정 기간/용량 초과 오래된 파일 자동 정기 삭제.

---

## 🖥️ 실행 화면 및 아키텍처

* **데스크탑 C# WPF MVVM 앱 (`RoboBackupStudio.exe`)**: 100% 네이티브 Windows 앱으로 실행 및 서비스 등록 지원.
* **React Web Preview**: 웹 브라우저에서도 백업 설계 및 C# WPF 프로젝트 코드 실시간 생성 지원.

---

## 🚀 빠른 시작 (Quick Start)

[GitHub Releases 페이지](https://github.com/AhBiYout-all/robobackup-studio/releases/latest)에서 최신 `RoboBackupStudio_v2.17.0_Setup.exe` 설치 관리자를 다운로드하여 즉시 설치할 수 있습니다. Windows 10/11 및 Windows Server 환경(PC 전용)에서 안정적으로 작동하며, 모바일 OS(Android APK / iOS)는 Robocopy 유틸리티 미지원으로 제외됩니다.

---

## 📝 릴리스 패치 노트 (Patch Notes)

상세 버전별 변경 내역은 [docs/PATCH_NOTES.md](docs/PATCH_NOTES.md) 파일에서 확인하실 수 있습니다.

---

## 📄 라이선스 (License)

Copyright © 2026 AhBiYout. All rights reserved.  
본 프로젝트는 MIT 라이선스에 따라 자유롭게 이용 가능합니다.
