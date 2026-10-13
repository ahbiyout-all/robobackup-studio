# Robocopy 종합 스위치 & 고급 플래그 레퍼런스 가이드 (v1.5.0)

Robocopy(Robust File Copy)는 Windows에 기본 내장된 최고 성능의 파일 동기화 및 백업 CLI 유틸리티입니다. 
RoboBackup Studio는 일반적인 기본 옵션부터 엔터프라이즈 서버 마이그레이션에 필요한 5대 카테고리 고급 명령어까지 GUI 환경에서 직관적으로 구성할 수 있습니다.

---

## 📁 5대 핵심 카테고리 고급 플래그 요약

```
Robocopy 고급 옵션
├── 1. 보안 및 권한 (/COPYALL, /SEC, /SECFIX, /TIMFIX, /NOOFFLOAD)
├── 2. 성능 & 대역폭 제어 (/IPG:n, /MT:n, /XJ, /SL, /SJ)
├── 3. 정밀 필터링 및 조건 복사 (/XO, /XN, /XC, /XU, /MIN, /MAX, /MINAGE, /MAXAGE)
├── 4. 실시간 감시 및 시간대 (/MON:n, /MOT:m, /RH:hhmm-hhmm, /PF)
└── 5. NAS 및 파일시스템 호환성 (/FFT, /FAT, /BYTES, /NP, /NDL, /NFL)
```

---

## 1. 보안 & 권한 옵션 (Security & Metadata)

| 플래그 | 설명 | 추천 활용 시나리오 |
| :--- | :--- | :--- |
| `/COPYALL` | **모든 파일 정보 복사** (`/COPY:DATSOU` - 데이터, 속성, 타임스탬프, 보안 ACL, 소유자, 감사 정보) | 윈도우 파일 서버 마이그레이션, 도메인 AD 환경 |
| `/SEC` | **보안 정보 복사** (`/COPY:DATS` - 데이터, 속성, 타임스탬프, NTFS ACL 권한) | 사내 공용 폴더 권한 보존 동기화 |
| `/SECFIX` | **기존 파일 보안 권한 강제 수정** (파일을 다시 복사하지 않고 대상 파일의 보안 정보만 일치시킴) | 권한이 깨진 대상 디렉터리 권한 일괄 복구 |
| `/TIMFIX` | **타임스탬프 강제 보정** (파일 데이터를 다시 전송하지 않고 시간 정보만 수정) | 타임스탬프 불일치 오류 보정 |
| `/NOOFFLOAD` | **Windows Copy Offload(ODX) 우회** (소프트웨어 버퍼링 복사 강제) | 가상화 스토리지 또는 SAN 호환성 문제 해결 |

---

## 2. 성능 & I/O 대역폭 제어 (Performance & Throttling)

| 플래그 | 설명 | 추천 활용 시나리오 |
| :--- | :--- | :--- |
| `/IPG:n` | **패킷 간 지연 시간(Inter-Packet Gap, ms)** (64KB 전송마다 n 밀리초 대기) | 업무 시간 사내 네트워크 대역폭 독점 방지 (`/IPG:50`) |
| `/MT:n` | **다중 스레드 병렬 복사** (n: 1 ~ 128) | 일반 HDD: 8, SSD/NVMe: 16~32 |
| `/XJ` | **디렉터리 및 파일 Junction 포인트 제외** | Windows 시스템 폴더/바로가기 무한 재귀 순환참조 방지 |
| `/SL` | **심볼릭 링크(Symbolic Link) 복제** (원본 데이터 대신 링크 파일 자체 복제) | 심볼릭 링크 구조 그대로 백업 |
| `/SJ` | **Junction 포인트 복제** (Junction 링크 자체 복제) | 디렉터리 바로가기 원본 보존 |

---

## 3. 정밀 파일 필터링 & 조건부 복사 (Advanced Filtering)

| 플래그 | 설명 | 추천 활용 시나리오 |
| :--- | :--- | :--- |
| `/XO` | **오래된 파일 제외 (Exclude Older)**: 대상 위치에 이미 더 최신 파일이 있으면 덮어쓰지 않음 | 대상 디렉터리의 최신 변경 사항 보호 |
| `/XN` | **새 파일 제외 (Exclude Newer)**: 대상보다 새로운 원본 파일 제외 | 기준 시점 이전 데이터 동기화 |
| `/XC` | **변경된 파일 제외 (Exclude Changed)**: 크기는 같으나 타임스탬프가 다른 파일 제외 | 대용량 고정 파일 백업 |
| `/XU` | **동일한 파일 제외 (Exclude Same)**: 타임스탬프와 크기가 일치하는 파일 제외 | 중복 전송 방지 |
| `/XX` | **추가 파일 제외 (Exclude Extra)**: 대상에만 있고 원본에 없는 파일 보존 | 대상 폴더의 독립 파일 보호 |
| `/XL` | **외톨이 파일 제외 (Exclude Lonely)**: 원본에만 있고 대상에 없는 파일 제외 | 기존 동기화된 파일만 업데이트 |
| `/MIN:n` | **최소 파일 크기 제한 (Bytes)**: 지정 크기보다 작은 파일 건너뜀 | 0바이트 빈 파일이나 불필요 로그 제외 |
| `/MAX:n` | **최대 파일 크기 제한 (Bytes)**: 지정 크기보다 큰 파일 건너뜀 | 대용량 ISO, 가상머신 디스크 제외 |
| `/MINAGE:n` | **최소 파일 연령 (일 단위 또는 YYYYMMDD)**: 지정 기간 이상 오래된 파일만 복사 | 30일 이상 지난 로그 아카이빙 백업 |
| `/MAXAGE:n` | **최대 파일 연령 (일 단위 또는 YYYYMMDD)**: 지정 기간 이내의 최신 파일만 복사 | 최근 7일 이내 생성/수정된 파일만 백업 |
| `/XF <패턴>` | **특정 파일 제외**: 와일드카드 지원 | `/XF *.tmp ~$* desktop.ini thumbs.db *.bak` |
| `/XD <패턴>` | **특정 폴더 제외**: 와일드카드 지원 | `/XD node_modules $RECYCLE.BIN "System Volume Information" .git` |

---

## 4. 실시간 감시 & 실행 시간대 (Real-time & Scheduling)

| 플래그 | 설명 | 추천 활용 시나리오 |
| :--- | :--- | :--- |
| `/MON:n` | **실시간 변경 파일 수 감시**: 원본 폴더에서 n개 이상 파일 변경 시 즉시 동기화 실행 | 실시간 파일 감시 백업 (`/MON:5`) |
| `/MOT:m` | **변경 대기 시간 (분)**: 파일 수정 후 m분 동안 추가 변경이 없을 때 안전 복사 | 파일 쓰기 작업 완료 후 안정적 백업 (`/MOT:2`) |
| `/RH:hhmm-hhmm` | **복사 허용 시간대 지정**: 24시간 형식의 시작-종료 시간대 | 야간 전용 백업 (`/RH:2200-0600`) |
| `/PF` | **파일 단위 시간대 체크**: 패스 단위가 아닌 각 파일 복사 직전마다 `/RH` 시간대를 재검사 | 작업 시간 제한 엄격 준수 |

---

## 5. NAS 및 파일시스템 호환성 (NAS & File Systems)

| 플래그 | 설명 | 추천 활용 시나리오 |
| :--- | :--- | :--- |
| `/FFT` | **FAT 파일 시간 오차 허용 (2초)**: SMB/Linux NAS의 2초 타임스탬프 차이 무시 | Synology, QNAP, ipTIME 등 NAS 백업 필수 |
| `/FAT` | **8.3 짧은 파일명 강제** | 레거시 FAT32 파일 시스템 복사 |
| `/BYTES` | **로그 크기 바이트 단위 출력** (KB/MB 대신 정확한 Byte 수 기록) | 정밀 로그 분석 및 통계 파싱 |
| `/NP` | **진행률 백분율(%) 출력 억제** | 로그 파일 크기 최소화 및 콘솔 버퍼 절약 |
| `/NDL` | **디렉터리 이름 로깅 억제** | 대규모 파일 구조에서 로그 간소화 |
| `/NFL` | **파일 이름 로깅 억제** | 에러 및 통계 요약만 확인 시 |
| `/V` | **자세한 로그 출력 (Verbose)** | 건너뛴 파일 및 상세 사유 확인 |
| `/TS` | **원본 파일 타임스탬프 로깅** | 감사 및 변경 추적 로그 |
| `/FP` | **전체 경로 이름 로깅** | 중복 파일명 식별 |

---

## 🚀 실무 추천 5대 마스터 프리셋 조합 (Enterprise Presets)

### 1. 🛡️ 서버 마이그레이션 & NTFS 권한 완벽 복제
```cmd
robocopy "C:\Data" "\\TargetServer\Data" /MIR /COPYALL /ZB /XJ /FFT /TS /FP /NP /R:2 /W:5
```

### 2. ⚡ NVMe to NVMe 초고속 로컬 복사
```cmd
robocopy "C:\Source" "D:\FastTarget" /MIR /MT:32 /NP /R:1 /W:1 /XF *.tmp /XD $RECYCLE.BIN
```

### 3. 🌐 NAS 네트워크 안정 백업 (SMB / Synology)
```cmd
robocopy "D:\Work" "\\192.168.0.100\NAS_Backup" /MIR /ZB /FFT /R:2 /W:3 /XF thumbs.db desktop.ini /XD System Volume Information
```

### 4. ⏱️ 업무 시간 대역폭 독점 방지 백업
```cmd
robocopy "C:\CompanyData" "\\NAS\Shared" /E /IPG:50 /MT:4 /ZB /FFT /R:2 /W:5
```

### 5. 🌙 야간 시간대 전용 무인 백업 (22:00 ~ 06:00)
```cmd
robocopy "C:\Source" "D:\Backup" /MIR /RH:2200-0600 /PF /MT:16 /ZB /FFT /NP /R:2 /W:5
```
