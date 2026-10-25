import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  ShieldCheck,
  Zap,
  HardDrive,
  Calendar,
  Trash2,
  KeyRound,
  FileCode,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Scale,
  CheckCircle2,
  Cpu,
  Layers,
  FileText
} from 'lucide-react';
import appLogo from '../assets/robocopy.png';

export const HelpAndLicense: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'help' | 'coredll' | 'license'>('help');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const coreDllSpecMarkdown = `# RoboBackup Studio 순수 창작 5대 코어 DLL 아키텍처 및 세부 동작 원리 기술 명세서
- 개발자: AhBiYout (공식 블로그: https://ahbiyoutvibe.blogspot.com/ | 소속: https://www.cisnet.co.kr/)
- 네임스페이스: RoboBackupStudio.Core (.NET 8 / .NET 4.8 듀얼 런타임 지원)

[1] RoboDiffEngine.cs (사전 차이 분석 & 바이트 예측 프리플라이트)
- 원본/대상 폴더를 고속 병렬 스캔하여 New/Modified/Identical/Extra 상태 분류
- FAT/NTFS 2초 시간 오차 보정으로 불필요한 재전송 원천 차단
- Robocopy 실행 전 전송 필요 총 바이트수를 1~2초 만에 확정 산출

[2] RoboVssProvider.cs (VSS 섀도 볼륨 스냅샷 프로바이더)
- vssadmin 백그라운드 관리 프로세스를 제어하여 \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopyX 가상 볼륨 자동 생성
- 열려 있는 엑셀, Outlook PST, SQL Server MDF/LDF, Hyper-V VHDX 독점 잠금 파일 100% 무중단 일관성 복제
- 백업 종료 후 IDisposable 스냅샷 자원 자동 환수

[3] RoboSyncWatch.cs (스마트 디바운스 실시간 동기화 감시)
- FileSystemWatcher 64KB 내부 버퍼 및 대량 쓰기 버스트 완충 큐 탑재
- Office 임시 파일(~$), .tmp, .crdownload 등 실시간 노이즈 자동 필터링
- 파일 쓰기 완료 후(Quiet Period 5초) 안전한 배치 단일 백그라운드 Robocopy 세션 트리거

[4] RoboVault.cs (DPAPI 기반 제로-로그인 NAS 보안 볼트)
- Windows Credential Manager 네이티브 Win32 P/Invoke (Advapi32.dll: CredReadW, CredWriteW, CredDeleteW, CredFree)
- 스크립트나 배치 파일 내 비밀번호 평문(Plaintext) 노출 제로(0)
- Array.Clear(ZeroMemory)로 메모리 덤프 취약점 원천 방어

[5] RoboTimeMachine.cs (NTFS 스마트 하드링크 & 타임머신 버전 보관소)
- Win32 CreateHardLinkW API P/Invoke 연동
- 직전 스냅샷과 동일한 파일은 0바이트 NTFS 하드링크로 연결하여 스토리지 80~95% 절감
- 타임스탬프별 완전 독립 디렉터리 구조로 복원 도구 없이 탐색기에서 즉시 파일 열람 가능`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-blue-500/40 flex items-center justify-center p-1 shadow-lg shadow-blue-900/30 shrink-0 overflow-hidden">
            <img 
              src={appLogo} 
              alt="RoboBackup Studio" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">도움말 및 오픈소스 라이선스 고지</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                v2.16.8
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              RoboBackup Studio의 5대 순수 창작 코어 DLL 기술 명세서, 상세 사용 가이드 및 오픈소스 라이선스 고지 안내입니다.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto shrink-0 space-x-1">
          <button
            onClick={() => setActiveSubTab('help')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'help'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>기능별 도움말 &amp; FAQ</span>
          </button>
          <button
            onClick={() => setActiveSubTab('coredll')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'coredll'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>🧩 5대 코어 DLL 기술 명세서</span>
          </button>
          <button
            onClick={() => setActiveSubTab('license')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'license'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>오픈소스 라이선스 고지</span>
          </button>
        </div>
      </div>

      {/* Developer & Company Profile Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-base">
              👨‍💻
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Lead Developer</span>
                <span className="text-white font-bold text-sm">AhBiYout</span>
              </div>
              <p className="text-xs text-slate-400">Windows High-Speed Robocopy Studio &amp; Infrastructure Automation</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Official Google Blog */}
            <a
              href="https://ahbiyoutvibe.blogspot.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 hover:border-amber-500/50 text-xs font-semibold flex items-center space-x-2 transition-all group"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>공식 블로그: <strong className="text-amber-300 group-hover:underline">ahbiyoutvibe</strong></span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
            </a>

            {/* Company Homepage */}
            <a
              href="https://www.cisnet.co.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 hover:border-blue-500/50 text-xs font-semibold flex items-center space-x-2 transition-all group"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>소속 홈페이지: <strong className="text-blue-300 group-hover:underline">CISNET (www.cisnet.co.kr)</strong></span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300" />
            </a>
          </div>
        </div>
      </div>

      {/* 1. 기능별 도움말 TAB */}
      {activeSubTab === 'help' && (
        <div className="space-y-6">
          {/* Quick Guide Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Guide Card 1: Robocopy Options */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-400 font-bold text-base">
                <Zap className="w-5 h-5" />
                <h3>1. 초고속 백업 및 주요 플래그 완벽 가이드</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Robocopy(Robust File Copy)는 Windows 커널 수준에서 파일 복사를 고속 처리합니다.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-mono text-emerald-400 font-bold">/MIR (완전 미러링 동기화)</div>
                  <div className="text-slate-400 mt-0.5">원본 폴더의 구조를 대상 폴더에 1:1로 복제합니다. 원본에서 삭제된 파일은 대상 폴더에서도 삭제됩니다.</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-mono text-cyan-400 font-bold">/MT:16 ~ /MT:32 (멀티스레드 다중 처리)</div>
                  <div className="text-slate-400 mt-0.5">최대 32개 스레드로 여러 파일을 동시 복사하여 NVMe/SSD 환경에서 최대 10배 이상 빠릅니다.</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-mono text-amber-400 font-bold">/FFT (2초 시간 오차 허용)</div>
                  <div className="text-slate-400 mt-0.5">시놀로지/QNAP 등 리눅스 기반 NAS로 복사할 때 타임스탬프 불일치로 파일이 계속 재복사되는 현상을 방지합니다.</div>
                </div>
              </div>
            </div>

            {/* Guide Card 2: Scheduler */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5 text-indigo-400 font-bold text-base">
                <Calendar className="w-5 h-5" />
                <h3>2. Windows 작업 스케줄러 무인 백업 원리</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Windows 공식 작업 스케줄러 엔진(<code className="text-indigo-300">schtasks.exe</code>)을 사용하므로, <b>RoboBackup 앱을 꺼두어도 백그라운드에서 지정된 시간에 정확히 백업</b>됩니다.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>최고 권한 실행 (/RL HIGHEST)</b>: UAC 프롬프트 없이 잠긴 시스템 파일도 안전하게 백업합니다.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>재부팅 및 무인 실행</b>: 컴퓨터가 재부팅되어도 스케줄러 서비스에 영구 등록되어 정상 작동합니다.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><b>스케줄 등록 확인</b>: 시작 메뉴에서 <code className="text-slate-200">taskschd.msc</code>를 실행하여 언제든 GUI로 점검 가능합니다.</span>
                </li>
              </ul>
            </div>

            {/* Guide Card 3: NAS Authentication */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5 text-emerald-400 font-bold text-base">
                <KeyRound className="w-5 h-5" />
                <h3>3. NAS / 네트워크 드라이브 로그인 인증 (v1.4.0)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Robocopy는 비밀번호 인자가 없으므로, Windows OS 레벨의 자격 증명 관리가 필요합니다.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-300">🥇 cmdkey 자격 증명 등록 (스케줄러 무인 백업 추천)</div>
                <p className="text-slate-400">Windows Credential Manager에 안전하게 암호화 보관되어, 스케줄러 백그라운드 실행 시에도 Windows가 자동 인증을 처리합니다.</p>
                <div className="font-bold text-cyan-300 pt-1">🥈 net use 임시 세션 연결 (배치 스크립트 실행용)</div>
                <p className="text-slate-400">백업 직전 일시적으로 연결하고 백업 종료 후 세션을 자동 해제합니다.</p>
              </div>
            </div>

            {/* Guide Card 4: Auto-Cleanup */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2.5 text-amber-400 font-bold text-base">
                <Trash2 className="w-5 h-5" />
                <h3>4. 오래된 파일 자동 정리 스케줄러</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                백업 드라이브 용량 고갈을 방지하기 위해 보존 기간(N일) 또는 최대 용량(N GB)을 기준으로 오래된 백업을 자동 삭제합니다.
              </p>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold text-[11px]">안전 사전 스캔</span>
                  <span>[수동 대상 파일 스캔] 버튼으로 삭제 대상 파일 목록과 절약 용량을 먼저 검토할 수 있습니다.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold text-[11px]">무인 청소 등록</span>
                  <span>[자동 정리 스케줄러 등록]으로 매주 일요일 새벽에 무인 청소 스케줄을 가동할 수 있습니다.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Frequently Asked Questions (FAQ) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <span>자주 묻는 질문 (FAQ)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="font-bold text-slate-100 text-sm mb-1">Q. 복사 도중 '액세스 거부(Access Denied)' 오류가 발생합니다.</div>
                <div className="text-slate-400 leading-relaxed">
                  A. 잠긴 시스템 파일이나 관리자 보호 영역일 수 있습니다. 상단 우측의 <b>[🛡️ 관리자 권한으로 다시 시작]</b> 버튼을 누르거나, 백업 옵션에서 <b>/ZB (백업 모드 재시도)</b>를 활성화하세요.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="font-bold text-slate-100 text-sm mb-1">Q. /MIR 옵션을 썼더니 대상 폴더의 기존 파일이 지워졌습니다.</div>
                <div className="text-slate-400 leading-relaxed">
                  A. <b>/MIR (미러링)</b>은 원본과 대상을 100% 동일하게 일치시키는 옵션입니다. 원본에 없는 대상 파일은 자동으로 삭제(Purge)됩니다. 기존 대상 파일을 보존하면서 새 파일만 덮어쓰려면 <b>/E /XO /XC (증분 백업 프리셋)</b>을 사용하세요.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="font-bold text-slate-100 text-sm mb-1">Q. PC를 재부팅하거나 앱을 종료해도 예약 백업이 돌아가나요?</div>
                <div className="text-slate-400 leading-relaxed">
                  A. <b>네, 완벽히 작동합니다.</b> Windows의 기본 시스템 서비스인 <code className="text-blue-300">Task Scheduler(schtasks.exe)</code>에 직접 영구 등록되므로 RoboBackup Studio 창을 닫아두셔도 정해진 시각에 자동으로 백업이 실행됩니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 순수 창작 5대 코어 DLL 기술 명세서 TAB */}
      {activeSubTab === 'coredll' && (
        <div className="space-y-6">
          {/* Architecture Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">순수 창작 5대 코어 DLL 아키텍처 및 세부 동작 원리</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      v2.16.8
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    Windows OS 커널 네이티브 API (Win32 P/Invoke, VSS, DPAPI, NTFS) 100% 자체 창작 엔진
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleCopy(coreDllSpecMarkdown, 'spec_md')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                >
                  {copiedKey === 'spec_md' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>전체 기술 명세서(Markdown) 복사</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-900/50 text-xs text-slate-300 leading-relaxed">
              <div className="font-bold text-purple-300 mb-1 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>외부 종속성 배제 (Zero External Dependency) 원칙</span>
              </div>
              RoboBackup Studio의 코어 모듈은 유료나 불안정한 외부 NuGet 패키지 일절 없이, 오직 .NET 표준 BCL과 Windows 공식 Win32 API를 바인딩하여 컴파일 무결성과 장기 안정성을 완벽히 보장합니다.
            </div>
          </div>

          {/* 5대 코어 모듈 세부 카드 그리드 */}
          <div className="grid grid-cols-1 gap-5">
            {/* 1. RoboDiffEngine */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">RoboDiffEngine.cs (초고속 사전 차이 분석 &amp; 바이트 예측)</h4>
                    <span className="text-xs text-sky-400 font-mono">RoboBackupStudio.Core.RoboDiffEngine</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-semibold">
                  프리플라이트 분석기
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Robocopy 실행 전 원본과 대상 디렉터리를 멀티스레드 병렬 스캔하여, 신규/수정/동일/삭제 파일 개수와 <b>실제 전송에 필요한 정확한 바이트량</b>을 1~2초 만에 산출합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-sky-300">⚙️ 동작 원리 및 알고리즘</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li><code className="text-slate-200">ConcurrentBag&lt;DiffItem&gt;</code> 기반 다중 스레드 병렬 크롤링</li>
                    <li>FAT/NTFS 2초 시간 오차 자동 보정 (<code className="text-slate-200">Math.Abs(dt) &gt; 2s</code>)</li>
                    <li>GUI 0~100% 진행률 계산을 위한 기준 바이트 정밀 확정</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-sky-300">📄 주요 메서드 및 반환 모델</div>
                  <div className="font-mono text-[11px] text-slate-300">
                    Task&lt;DiffReport&gt; AnalyzeDiffAsync(src, tgt, ct, progress)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    반환: TotalBytesToTransfer, NewFilesCount, ModifiedFilesCount, ExtraFilesCount
                  </div>
                </div>
              </div>
            </div>

            {/* 2. RoboVssProvider */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">RoboVssProvider.cs (Windows 볼륨 섀도 복사본 VSS 스냅샷)</h4>
                    <span className="text-xs text-purple-400 font-mono">RoboBackupStudio.Core.RoboVssProvider</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
                  잠금 파일 무중단 복제
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                사용 중인 엑셀/워드 문서, Outlook의 대용량 <code className="text-purple-300">.pst</code> 메일함, 실행 중인 SQL Server <code className="text-purple-300">.mdf/.ldf</code>, Hyper-V VHDX 등 독점 잠금(Exclusive Lock) 파일의 100% 무결점 복제를 보장합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-300">⚙️ 동작 원리 및 알고리즘</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li><code className="text-slate-200">vssadmin create shadow</code> 백그라운드 관리 프로세스 제어</li>
                    <li><code className="text-slate-200">\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyX</code> 경로 동적 치환</li>
                    <li>작업 완료 후 <code className="text-slate-200">IDisposable</code> 기반 스냅샷 자원 즉시 환수</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-300">📄 주요 메서드 및 반환 모델</div>
                  <div className="font-mono text-[11px] text-slate-300">
                    Task&lt;VssSnapshotInfo&gt; CreateSnapshotAsync(driveLetter)
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    string GetVssPath(originalFullPath)
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    Task ReleaseSnapshotAsync()
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RoboSyncWatch */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">RoboSyncWatch.cs (스마트 디바운스 실시간 자동 동기화 감시)</h4>
                    <span className="text-xs text-emerald-400 font-mono">RoboBackupStudio.Core.RoboSyncWatch</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                  버스트 완충 큐
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                파일 시스템 쓰기 이벤트 폭풍을 지능적으로 완충하는 <b>적응형 디바운스(Adaptive Debounce)</b> 엔진을 탑재하여, 파일 저장이 완전히 끝난 조용한 상태(Quiet Period)에 도달했을 때 단 한 번의 Robocopy 백업을 안전하게 트리거합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-300">⚙️ 동작 원리 및 알고리즘</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li>Win32 <code className="text-slate-200">FileSystemWatcher</code> 64KB 내부 대용량 버퍼 설정</li>
                    <li>Office 임시 파일(<code className="text-slate-200">~$*.docx</code>), <code className="text-slate-200">.tmp</code>, <code className="text-slate-200">.crdownload</code> 자동 필터링</li>
                    <li>설정 가능한 유예 타이머(1~60초) 리셋 알고리즘으로 프로세스 중복 기동 방지</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-300">📄 주요 메서드 및 이벤트</div>
                  <div className="font-mono text-[11px] text-slate-300">
                    void Start(directoryPath, debounceSeconds)
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    event EventHandler&lt;WatchEventItem&gt; FileActivityDetected
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    event EventHandler&lt;IReadOnlyList&gt; SyncTriggered
                  </div>
                </div>
              </div>
            </div>

            {/* 4. RoboVault */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">RoboVault.cs (DPAPI 기반 제로-로그인 NAS 보안 볼트)</h4>
                    <span className="text-xs text-amber-400 font-mono">RoboBackupStudio.Core.RoboVault</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                  보안 감사 통과
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                스케줄러나 배치 스크립트에 NAS 비밀번호를 평문(Plaintext)으로 노출하지 않고, Windows 운영체제의 Data Protection API(DPAPI) 및 Credential Manager와 결합하여 자격 증명을 안전하게 격리 보관합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-300">⚙️ 동작 원리 및 보안 메커니즘</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li><code className="text-slate-200">Advapi32.dll (CredWriteW, CredReadW, CredFree)</code> Win32 P/Invoke</li>
                    <li><code className="text-slate-200">Array.Clear(ZeroMemory)</code>로 메모리 덤프 공격 취약점 즉시 소거</li>
                    <li>UNC 공유 경로(<code className="text-slate-200">\\192.168.1.100\Backup</code>) 정규화 지원</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-300">📄 주요 메서드</div>
                  <div className="font-mono text-[11px] text-slate-300">
                    bool SaveCredential(target, userName, password)
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    bool TryGetCredential(target, out user, out pass)
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    bool DeleteCredential(target)
                  </div>
                </div>
              </div>
            </div>

            {/* 5. RoboTimeMachine */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">RoboTimeMachine.cs (NTFS 스마트 하드링크 타임머신 보관소)</h4>
                    <span className="text-xs text-rose-400 font-mono">RoboBackupStudio.Core.RoboTimeMachine</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold">
                  디스크 90% 절약
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Win32 <code className="text-rose-300">CreateHardLinkW</code> 네이티브 API를 바인딩하여, 직전 백업본과 동일한 파일은 추가 물리 용량을 1바이트도 소모하지 않는 NTFS 하드링크로 연결하고 변경된 파일만 실물 복사하여 디스크 공간을 80~95% 절약합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-rose-300">⚙️ 동작 원리 및 복원 편의성</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li>타임스탬프별 독립 폴더 생성 (<code className="text-slate-200">2026-09-05_040000</code>)</li>
                    <li>동일 파일 크기/수정시간 매칭 시 0바이트 NTFS MFT 링크 생성</li>
                    <li>복원 시 전용 툴 필요 없이 탐색기에서 원하는 날짜 폴더를 즉시 복사 가능</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-rose-300">📄 주요 메서드 및 반환 모델</div>
                  <div className="font-mono text-[11px] text-slate-300">
                    Task&lt;SnapshotResult&gt; CreateTimeMachineSnapshotAsync(...)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    반환: VirtualSizeBytes, ActualPhysicalBytes, SpaceSavedPercent, HardLinkedFilesCount
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. 오픈소스 라이선스 고지 TAB */}
      {activeSubTab === 'license' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-base">
                <Scale className="w-5 h-5" />
                <h3>제3자 오픈소스 소프트웨어 라이선스 고지 (Third-Party Licenses)</h3>
              </div>
              <button
                onClick={() => handleCopy(`RoboBackup Studio (v2.16.8)\nMIT License Copyright (c) 2026 AhBiYout`, 'full_lic')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 flex items-center space-x-1.5 transition-colors"
              >
                {copiedKey === 'full_lic' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>라이선스 고지문 복사</span>
              </button>
            </div>

            {/* License Item 1: App */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">1. RoboBackup Studio Core</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">MIT License</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                Copyright (c) 2026 AhBiYout.<br />
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...
              </p>
            </div>

            {/* License Item 2: .NET Runtime */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">2. Microsoft .NET 10.0 / 8.0 WPF Runtime &amp; System.Text.Encoding.CodePages</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px]">MIT License</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                Copyright (c) .NET Foundation and Contributors.<br />
                Licensed under the MIT License. Released as official Microsoft Open Source.
              </p>
            </div>

            {/* License Item 3: Lucide Icons */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">3. Lucide Icons (lucide-react)</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">ISC License</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                Copyright (c) 2022-2026, Lucide Contributors.<br />
                Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted...
              </p>
            </div>

            {/* License Item 4: React, Tailwind, Motion */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">4. React, React-DOM, Tailwind CSS, Motion</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">MIT License</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                React: Copyright (c) Meta Platforms, Inc. and affiliates.<br />
                Tailwind CSS: Copyright (c) Tailwind Labs Inc.<br />
                Motion: Copyright (c) 2018 Motion Software Limited. All licensed under MIT.
              </p>
            </div>

            {/* License Item 5: Windows Built-in Tools Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 text-sm">5. Windows OS Built-in Utilities Notice (robocopy, schtasks, cmdkey, net)</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">Microsoft Windows Standard</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                RoboBackup Studio는 Windows OS 내장 유틸리티를 변조하거나 번들링하여 무단 재배포하지 않으며, 호스트 PC의 정품 시스템 도구를 프로세스 파이프라인으로 안전하게 호출하는 GUI 관리자 도구입니다. Microsoft and Windows are registered trademarks of Microsoft Corporation.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
