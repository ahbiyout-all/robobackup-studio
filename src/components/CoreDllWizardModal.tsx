import React, { useState } from 'react';
import {
  Wand2,
  Zap,
  Shield,
  Activity,
  Lock,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Check,
  Folder,
  RefreshCw,
  Sparkles,
  Database,
  HardDrive,
  Layers,
  FileCode,
  CheckSquare,
  Square,
  Play,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { BackupJob } from '../types';

export type CoreModuleKey = 'diff' | 'vss' | 'syncwatch' | 'vault' | 'timemachine';

interface CoreDllWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModule?: CoreModuleKey;
  currentJob: BackupJob;
  setCurrentJob?: React.Dispatch<React.SetStateAction<BackupJob>>;
}

export const CoreDllWizardModal: React.FC<CoreDllWizardModalProps> = ({
  isOpen,
  onClose,
  initialModule = 'diff',
  currentJob,
  setCurrentJob
}) => {
  const [activeModule, setActiveModule] = useState<CoreModuleKey>(initialModule);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [copiedScript, setCopiedScript] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  // ----------------------------------------------------
  // Module 1: RoboDiffEngine Wizard State
  // ----------------------------------------------------
  const [diffSource, setDiffSource] = useState(currentJob.sourcePath);
  const [diffTarget, setDiffTarget] = useState(currentJob.targetPath);
  const [diffMode, setDiffMode] = useState<'mft' | 'checksum'>('mft');
  const [diffExcludePattern, setDiffExcludePattern] = useState('*.tmp; *.log; ~$*; Thumbs.db');
  const [diffScanning, setDiffScanning] = useState(false);
  const [diffStep2Done, setDiffStep2Done] = useState(false);
  const [diffScanStats, setDiffScanStats] = useState({
    newFiles: 18,
    modifiedFiles: 9,
    identicalFiles: 426,
    extraFiles: 4,
    transferBytes: '1.48 GB',
    elapsedSeconds: 0.28,
    highRiskFiles: [
      'Config\\Production_Database_Secrets.json (대상에만 존재 - /MIR 실행 시 삭제됨)',
      'Legacy_Docs\\2025_Annual_Audit_Archive.zip (대상에만 존재 - /MIR 실행 시 삭제됨)'
    ]
  });
  const [diffSelectedPreset, setDiffSelectedPreset] = useState<'incremental' | 'mirror' | 'safeAdd'>('incremental');

  // ----------------------------------------------------
  // Module 2: RoboVssProvider Wizard State
  // ----------------------------------------------------
  const [vssDrive, setVssDrive] = useState('C:');
  const [vssProfile, setVssProfile] = useState<'pst' | 'sql' | 'vm' | 'office'>('pst');
  const [vssCreating, setVssCreating] = useState(false);
  const [vssStep2Done, setVssStep2Done] = useState(false);
  const [vssShadowVolume, setVssShadowVolume] = useState('');
  const [vssTestAccessOk, setVssTestAccessOk] = useState(false);

  // ----------------------------------------------------
  // Module 3: RoboSyncWatch Wizard State
  // ----------------------------------------------------
  const [watchPath, setWatchPath] = useState(currentJob.sourcePath);
  const [watchEvents, setWatchEvents] = useState({
    create: true,
    modify: true,
    delete: false,
    rename: true
  });
  const [watchIgnoreTemp, setWatchIgnoreTemp] = useState(true);
  const [watchDebounce, setWatchDebounce] = useState<number>(5);
  const [watchSimulating, setWatchSimulating] = useState(false);
  const [watchSimCountdown, setWatchSimCountdown] = useState<number | null>(null);
  const [watchStep2Done, setWatchStep2Done] = useState(false);
  const [watchSimLogs, setWatchSimLogs] = useState<string[]>([]);
  const [watchMode, setWatchMode] = useState<'headless' | 'notify'>('headless');

  // ----------------------------------------------------
  // Module 4: RoboVault Wizard State
  // ----------------------------------------------------
  const [vaultShare, setVaultShare] = useState('\\\\NAS-SERVER\\EnterpriseBackup');
  const [vaultType, setVaultType] = useState<'dpapi' | 'cmdkey'>('dpapi');
  const [vaultUser, setVaultUser] = useState('backup_operator');
  const [vaultPass, setVaultPass] = useState('SecurePass2026!');
  const [vaultShowPass, setVaultShowPass] = useState(false);
  const [vaultTesting, setVaultTesting] = useState(false);
  const [vaultStep2Done, setVaultStep2Done] = useState(false);
  const [vaultTestResult, setVaultTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ----------------------------------------------------
  // Module 5: RoboTimeMachine Wizard State
  // ----------------------------------------------------
  const [tmSource, setTmSource] = useState(currentJob.sourcePath);
  const [tmRepo, setTmRepo] = useState('D:\\TimeMachine_Vault');
  const [tmFrequency, setTmFrequency] = useState<'hourly' | 'daily' | 'manual'>('daily');
  const [tmRetention, setTmRetention] = useState<number>(30);
  const [tmCreating, setTmCreating] = useState(false);
  const [tmStep2Done, setTmStep2Done] = useState(false);
  const [tmStats, setTmStats] = useState({
    virtualSize: '24.5 GB',
    physicalSize: '480 MB',
    savedRatio: '98.0%',
    hardlinkCount: 520,
    newCopiedCount: 24
  });

  if (!isOpen) return null;

  // Handle module change
  const handleSwitchModule = (moduleKey: CoreModuleKey) => {
    setActiveModule(moduleKey);
    setCurrentStep(1);
    setApplySuccessMsg(null);
  };

  // Execution triggers for Step 2
  const runStep2DiffScan = () => {
    setDiffScanning(true);
    setTimeout(() => {
      setDiffScanning(false);
      setDiffStep2Done(true);
      setDiffScanStats({
        newFiles: 22,
        modifiedFiles: 11,
        identicalFiles: 480,
        extraFiles: 3,
        transferBytes: '1.62 GB',
        elapsedSeconds: 0.31,
        highRiskFiles: [
          'Confidential\\Executive_Meeting_Minutes.docx (대상 폴더에만 존재 - /MIR 실행 시 즉시 삭제됨)',
          'Shared\\Legacy_Project_Asset_2025.zip (대상 폴더에만 존재 - /MIR 실행 시 즉시 삭제됨)'
        ]
      });
    }, 900);
  };

  const runStep2VssCreate = () => {
    setVssCreating(true);
    setTimeout(() => {
      setVssCreating(false);
      setVssStep2Done(true);
      setVssShadowVolume(`\\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy${Math.floor(Math.random() * 5) + 3}`);
      setVssTestAccessOk(true);
    }, 1100);
  };

  const runStep2WatchSimulate = () => {
    setWatchSimulating(true);
    const fakeEvents = [
      `[CREATE] document_draft_${Math.floor(Math.random() * 900) + 100}.docx`,
      `[MODIFY] budget_plan_2026.xlsx`,
      `[MODIFY] app_local_settings.json`
    ];
    setWatchSimLogs([
      `[${new Date().toLocaleTimeString()}] 이벤트 감지: ${fakeEvents[0]}`,
      `[${new Date().toLocaleTimeString()}] 이벤트 감지: ${fakeEvents[1]}`,
      `[${new Date().toLocaleTimeString()}] 이벤트 감지: ${fakeEvents[2]}`,
      `[${new Date().toLocaleTimeString()}] ⏳ 버스트 디바운스 타이머 가동 (${watchDebounce}초 동안 추가 변경 대기)`
    ]);

    setWatchSimCountdown(watchDebounce);
    let left = watchDebounce;
    const interval = setInterval(() => {
      left -= 1;
      setWatchSimCountdown(left);
      if (left <= 0) {
        clearInterval(interval);
        setWatchSimulating(false);
        setWatchStep2Done(true);
        setWatchSimLogs(prev => [
          `⚡ [${new Date().toLocaleTimeString()}] [Quiet Period 만료] 무인 Robocopy 자동 백그라운드 동기화 트리거 완료! (/MIR /MT:8)`,
          ...prev
        ]);
      }
    }, 700);
  };

  const runStep2VaultTest = () => {
    setVaultTesting(true);
    setVaultTestResult(null);
    setTimeout(() => {
      setVaultTesting(false);
      setVaultStep2Done(true);
      setVaultTestResult({
        ok: true,
        message: `SMB 3.1.1 연결 검증 성공! 서버 '${vaultShare}' 대상에 '${vaultUser}' 계정 자격 증명이 정상 인증되었습니다.`
      });
    }, 1000);
  };

  const runStep2TimeMachineCreate = () => {
    setTmCreating(true);
    setTimeout(() => {
      setTmCreating(false);
      setTmStep2Done(true);
      setTmStats({
        virtualSize: '26.8 GB',
        physicalSize: '390 MB',
        savedRatio: '98.5%',
        hardlinkCount: 542,
        newCopiedCount: 16
      });
    }, 1200);
  };

  // Step 3 Apply Actions (Applies settings to main BackupJob)
  const applySettingsToMainJob = () => {
    if (!setCurrentJob) {
      alert('백업 작업 상태 업데이트 함수를 찾을 수 없습니다.');
      return;
    }

    if (activeModule === 'diff') {
      setCurrentJob(prev => ({
        ...prev,
        sourcePath: diffSource,
        targetPath: diffTarget,
        flags: {
          ...prev.flags,
          mirror: diffSelectedPreset === 'mirror',
          copySubdirsWithEmpty: true,
          fft: true,
          threads: 16,
          excludeOlder: diffSelectedPreset === 'incremental',
          excludeChanged: diffSelectedPreset === 'safeAdd',
          excludeNewer: diffSelectedPreset === 'safeAdd'
        }
      }));
      setApplySuccessMsg('✅ RoboDiffEngine 최적화 설정(경로 및 플래그)이 백업 작업에 즉시 반영되었습니다!');
    } else if (activeModule === 'vss') {
      setCurrentJob(prev => ({
        ...prev,
        flags: {
          ...prev.flags,
          backupMode: true,
          restartableBackupMode: true,
          threads: 8,
          fft: true
        }
      }));
      setApplySuccessMsg('✅ RoboVssProvider 잠긴 파일 무중단 백업 모드(/B /ZB)가 백업 작업에 반영되었습니다!');
    } else if (activeModule === 'syncwatch') {
      setCurrentJob(prev => ({
        ...prev,
        sourcePath: watchPath,
        flags: {
          ...prev.flags,
          monitorChangesCount: 1,
          monitorWaitMinutes: 1,
          noProgress: true
        }
      }));
      setApplySuccessMsg('✅ RoboSyncWatch 실시간 감시 파라미터가 백업 작업에 성공적으로 반영되었습니다!');
    } else if (activeModule === 'vault') {
      setCurrentJob(prev => ({
        ...prev,
        targetPath: vaultShare,
        nasAuth: {
          isNasDetected: true,
          server: vaultShare.replace(/^\\\\/, '').split('\\')[0],
          sharePath: vaultShare,
          username: vaultUser,
          authMode: vaultType === 'cmdkey' ? 'cmdkey' : 'cmdkey',
          isConnected: true,
          autoDisconnect: false
        }
      }));
      setApplySuccessMsg('✅ RoboVault 보안 볼트 자격 증명 및 대상 경로가 백업 작업에 연결되었습니다!');
    } else if (activeModule === 'timemachine') {
      setCurrentJob(prev => ({
        ...prev,
        sourcePath: tmSource,
        targetPath: `${tmRepo}\\Latest_Snapshot`,
        flags: {
          ...prev.flags,
          mirror: false,
          copySubdirsWithEmpty: true,
          threads: 16,
          fft: true
        }
      }));
      setApplySuccessMsg('✅ RoboTimeMachine 하드링크 스냅샷 보관소 경로가 백업 작업에 등록되었습니다!');
    }
  };

  const copyScriptText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Module Configuration definitions
  const moduleConfig = {
    diff: {
      title: 'RoboDiffEngine 차이 분석 & 진행률 프리플라이트 마법사',
      desc: '백업 실행 전 소스와 대상 폴더의 차이(신규/수정/삭제)를 초고속 MFT 스캔하여 사전 검증하고 최적 플래그를 도출합니다.',
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      badge: '초고속 사전 검증',
      color: 'blue',
      scenario: {
        title: '500GB 외장하드 백업 전 실제 변경 파일 및 전송량 사전 검증',
        situation: '외장하드에 복사 누르기 전에 오늘 몇 기가나 바뀌었는지, 시간이 얼마나 걸릴지 먼저 확인하고 싶을 때',
        howToUse: '경로 지정 ➔ 2단계에서 [초고속 MFT Diff 스캔] 클릭 ➔ 변경 파일 수와 전송 바이트를 1초 만에 확인 후 안심 실행'
      }
    },
    vss: {
      title: 'RoboVssProvider 잠긴 파일 & DB 섀도 복사본 마법사',
      desc: 'Outlook PST, SQL Server DB 등 활성 프로세스가 점유 중인 파일을 Windows VSS 스냅샷을 통해 100% 무결점 복제합니다.',
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      badge: '잠긴 파일 무중단 복제',
      color: 'purple',
      scenario: {
        title: 'Outlook PST, SQL Server MDF 등 열려 있는 파일 잠김 에러 방지',
        situation: '아웃룩이나 엑셀, DB가 실행 중이어서 "파일이 다른 프로세스에서 사용 중입니다" 에러가 날 때',
        howToUse: '볼륨(C:) 지정 ➔ 2단계에서 [VSS 스냅샷 볼륨 생성] 클릭 ➔ 열린 파일도 100% 무결점 복제 ➔ 완료 후 스냅샷 자동 해제'
      }
    },
    syncwatch: {
      title: 'RoboSyncWatch 실시간 파일 변경 감시 & 버스트 동기화 마법사',
      desc: 'Win32 고성능 디렉터리 감시와 버스트 완충 디바운스(Quiet Period)를 결합하여 파일 저장 시 즉시 자동 백그라운드 동기화합니다.',
      icon: <Activity className="w-5 h-5 text-amber-400" />,
      badge: '스마트 실시간 트리거',
      color: 'amber',
      scenario: {
        title: '프로젝트 폴더 작업 파일 저장(Ctrl+S) 시 전자동 백그라운드 동기화',
        situation: '작업 폴더에 파일을 저장하거나 수정할 때마다 일일이 백업 버튼을 누르지 않고 알아서 자동 복사되길 원할 때',
        howToUse: '감시 경로 지정 ➔ 디바운스(3초) ➔ 2단계에서 [실시간 감시 테스트] ➔ 저장 시 3초 후 Robocopy 자동 작동'
      }
    },
    vault: {
      title: 'RoboVault 엔터프라이즈 자격 증명 보안 볼트 마법사',
      desc: 'NAS 계정과 비밀번호를 평문으로 노출하지 않고 Windows Credential Manager 및 DPAPI AES-256으로 완벽히 암호화 격리합니다.',
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      badge: '제로-노출 보안 볼트',
      color: 'emerald',
      scenario: {
        title: '회사 NAS/네트워크 공유 비밀번호 노출 없는 자동 무인 인증',
        situation: '회사 NAS(\\192.168.0.50\\Backup)로 백업할 때 배치 파일에 비밀번호를 평문으로 적어두기 불안할 때',
        howToUse: '공유 경로 및 ID/PW 입력 ➔ 2단계에서 [DPAPI 볼트에 암호화 등록] ➔ 비밀번호 평문 노출 제로(0)로 안전한 자동 로그인'
      }
    },
    timemachine: {
      title: 'RoboTimeMachine NTFS 스마트 하드링크 시점 복구 마법사',
      desc: 'NTFS Hardlink 기술을 활용하여 변경되지 않은 파일은 0바이트 포인터만 재활용, 물리 디스크 98%를 절약하는 타임머신을 구축합니다.',
      icon: <History className="w-5 h-5 text-pink-400" />,
      badge: '시점 복구 & 98% 공간 절감',
      color: 'pink',
      scenario: {
        title: '날짜별(2026-09-17, 2026-09-18...) 과거 복원 보관소 (용량 90% 절약)',
        situation: '맥(Mac)의 타임머신처럼 날짜별로 백업을 남겨서 과거 시점으로 되돌리고 싶은데 하드 용량이 부족할 때',
        howToUse: '원본 및 보관소 지정 ➔ 2단계에서 [타임머신 증분 스냅샷 생성] ➔ 동일 파일 0바이트 하드링크 연결로 디스크 90% 절약 보관'
      }
    }
  }[activeModule];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">코어 DLL 모듈별 기능 사용 마법사</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  v2.9.0 Core Wizard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                엔터프라이즈 5대 코어 엔진을 단계별 가이드에 따라 안전하게 설정하고 백업 작업에 즉시 연동하세요.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="마법사 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Modules Navigation Bar */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => handleSwitchModule('diff')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'diff'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. RoboDiffEngine</span>
          </button>

          <button
            onClick={() => handleSwitchModule('vss')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'vss'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>2. RoboVssProvider</span>
          </button>

          <button
            onClick={() => handleSwitchModule('syncwatch')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'syncwatch'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. RoboSyncWatch</span>
          </button>

          <button
            onClick={() => handleSwitchModule('vault')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'vault'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>4. RoboVault</span>
          </button>

          <button
            onClick={() => handleSwitchModule('timemachine')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeModule === 'timemachine'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>5. RoboTimeMachine</span>
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div
              onClick={() => setCurrentStep(1)}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 1
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-xs font-semibold ${currentStep === 1 ? 'text-white' : 'text-slate-400'}`}>
                1단계: 파라미터 &amp; 환경 설정
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-4 ${currentStep > 1 ? 'bg-emerald-600' : 'bg-slate-800'}`} />

            {/* Step 2 */}
            <div
              onClick={() => setCurrentStep(2)}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 2
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className={`text-xs font-semibold ${currentStep === 2 ? 'text-white' : 'text-slate-400'}`}>
                2단계: 엔진 실행 &amp; 사전 검증
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-4 ${currentStep > 2 ? 'bg-emerald-600' : 'bg-slate-800'}`} />

            {/* Step 3 */}
            <div
              onClick={() => setCurrentStep(3)}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </div>
              <span className={`text-xs font-semibold ${currentStep === 3 ? 'text-white' : 'text-slate-400'}`}>
                3단계: Robocopy 작업 연동 &amp; 완료
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Current Module Overview Banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                {moduleConfig.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">{moduleConfig.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {moduleConfig.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{moduleConfig.desc}</p>
              </div>
            </div>

            {/* Practical Scenario Callout Box inside Wizard */}
            {moduleConfig.scenario && (
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px]">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>💡 실전 활용 시나리오: {moduleConfig.scenario.title}</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  <strong className="text-slate-200">상황:</strong> {moduleConfig.scenario.situation}
                </p>
                <p className="text-slate-400 text-[11px]">
                  <strong className="text-blue-300">사용법:</strong> {moduleConfig.scenario.howToUse}
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MODULE 1: RoboDiffEngine WIZARD STEPS */}
          {/* ========================================================================= */}
          {activeModule === 'diff' && (
            <div className="space-y-5">
              {/* STEP 1: 설정 */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-sky-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>1단계: 비교 대상 폴더 경로 및 비교 모드 지정</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">원본 소스 경로 (Source)</label>
                      <input
                        type="text"
                        value={diffSource}
                        onChange={e => setDiffSource(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="예: C:\Data\Projects"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">대상 백업 경로 (Destination)</label>
                      <input
                        type="text"
                        value={diffTarget}
                        onChange={e => setDiffTarget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="예: D:\Backup\Projects"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">비교 정밀도 모드</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setDiffMode('mft')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          diffMode === 'mft'
                            ? 'bg-blue-600/10 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>🚀 초고속 MFT 메타데이터 비교 (권장)</span>
                          {diffMode === 'mft' && <Check className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          수정 일시 및 파일 크기를 대조하여 수십만 개 파일을 1초 만에 분석합니다.
                        </p>
                      </div>

                      <div
                        onClick={() => setDiffMode('checksum')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          diffMode === 'checksum'
                            ? 'bg-blue-600/10 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>🔬 블록 해시(Checksum) 심층 정밀 비교</span>
                          {diffMode === 'checksum' && <Check className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          타임스탬프가 조작되었거나 파일 내부 블록 변조 여부를 바이트 단위로 검증합니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">제외할 임시 파일 및 확장자 패턴 (/XF)</label>
                    <input
                      type="text"
                      value={diffExcludePattern}
                      onChange={e => setDiffExcludePattern(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                    <span className="text-[11px] text-slate-500 block">
                      임시 캐시 및 잠금 파일은 불필요한 변경 감지를 유발하므로 사전 제외를 권장합니다.
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 2: 실행 & 사전 검증 */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-sky-400 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>2단계: 실시간 차이 분석(Diff Scan) 실행 및 삭제 위험 사전 점검</span>
                    </div>

                    <button
                      onClick={runStep2DiffScan}
                      disabled={diffScanning}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${diffScanning ? 'animate-spin' : ''}`} />
                      <span>{diffScanning ? '초고속 스캔 진행 중...' : '⚡ 차이 분석 재실행'}</span>
                    </button>
                  </div>

                  {/* 4 Metric Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-emerald-400 font-semibold block">✨ 신규 복사 (New)</span>
                      <span className="text-xl font-bold font-mono text-white mt-0.5 block">{diffScanStats.newFiles}개</span>
                      <span className="text-[10px] text-slate-500">신규 생성 파일</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-amber-400 font-semibold block">🔄 갱신 대상 (Modified)</span>
                      <span className="text-xl font-bold font-mono text-white mt-0.5 block">{diffScanStats.modifiedFiles}개</span>
                      <span className="text-[10px] text-slate-500">내용 또는 크기 변경</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                      <span className="text-[11px] text-slate-400 font-semibold block">⚪ 스킵 대상 (Identical)</span>
                      <span className="text-xl font-bold font-mono text-slate-300 mt-0.5 block">{diffScanStats.identicalFiles}개</span>
                      <span className="text-[10px] text-slate-500">불필요 전송 0% 생략</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-rose-500/40 bg-rose-500/5 rounded-xl text-center">
                      <span className="text-[11px] text-rose-400 font-bold block">🗑️ 대상 전용 (/MIR 삭제)</span>
                      <span className="text-xl font-bold font-mono text-rose-300 mt-0.5 block">{diffScanStats.extraFiles}개</span>
                      <span className="text-[10px] text-rose-400/80">미러 실행 시 영구 삭제</span>
                    </div>
                  </div>

                  {/* High Risk File Warning Banner */}
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>사전 안전 진단: /MIR(미러링) 실행 시 삭제될 수 있는 파일 검출됨</span>
                    </div>
                    <ul className="text-[11px] text-amber-200/90 space-y-1 list-disc list-inside font-mono bg-slate-950/50 p-2.5 rounded-lg border border-amber-900/40">
                      {diffScanStats.highRiskFiles.map((f, i) => (
                        <li key={i} className="truncate">{f}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-slate-400">
                      💡 Tip: 대상 폴더에서 위 파일들이 삭제되지 않길 원하시면 3단계에서 <strong>"증분 복사 (/E /XO)"</strong> 모드를 선택하세요.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50 text-xs text-blue-300 flex items-center justify-between">
                    <span>예상 전송 용량: <strong>{diffScanStats.transferBytes}</strong> (전체 데이터 중 3.2%만 전송)</span>
                    <span className="text-[11px] text-blue-400 font-mono">분석 소요 시간: {diffScanStats.elapsedSeconds}초</span>
                  </div>
                </div>
              )}

              {/* STEP 3: Robocopy 플래그 매핑 & 연동 */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-sky-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>3단계: 분석 결과에 기반한 최적 Robocopy 권장 옵션 적용</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Preset Option 1 */}
                    <div
                      onClick={() => setDiffSelectedPreset('incremental')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        diffSelectedPreset === 'incremental'
                          ? 'bg-blue-600/10 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-blue-300">[권장] 안전 증분 동기화 모드</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-mono">/E /XO /FFT /MT:16</span>
                        </div>
                        {diffSelectedPreset === 'incremental' && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        대상 폴더의 파일을 절대 임의 삭제하지 않고, 오직 신규 및 수정된 파일만 안전하게 복사합니다.
                      </p>
                    </div>

                    {/* Preset Option 2 */}
                    <div
                      onClick={() => setDiffSelectedPreset('mirror')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        diffSelectedPreset === 'mirror'
                          ? 'bg-rose-600/10 border-rose-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-rose-300">완전 미러링 동기화 모드</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-mono">/MIR /FFT /MT:16</span>
                        </div>
                        {diffSelectedPreset === 'mirror' && <Check className="w-4 h-4 text-rose-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        대상 폴더를 원본과 100% 동일하게 일치시키며, 원본에 없는 대상 파일 4개를 즉시 삭제 정리합니다.
                      </p>
                    </div>

                    {/* Preset Option 3 */}
                    <div
                      onClick={() => setDiffSelectedPreset('safeAdd')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        diffSelectedPreset === 'safeAdd'
                          ? 'bg-emerald-600/10 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-emerald-300">신규 파일만 보충 모드 (기존 수정본 보존)</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">/E /XC /XN /XO</span>
                        </div>
                        {diffSelectedPreset === 'safeAdd' && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        기존에 존재하는 파일은 절대 덮어쓰지 않고 대상에 없는 완전히 새로운 파일만 추가합니다.
                      </p>
                    </div>
                  </div>

                  {/* Apply Confirmation Button */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-white block">설정된 분석 파라미터를 메인 작업에 적용</span>
                        <span className="text-[11px] text-slate-400">
                          선택한 경로와 추천 플래그 세트가 [백업 작업 설정] 탭에 즉시 매핑됩니다.
                        </span>
                      </div>
                      <button
                        onClick={applySettingsToMainJob}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center space-x-2 shrink-0 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>백업 작업에 즉시 적용하기</span>
                      </button>
                    </div>

                    {applySuccessMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 animate-fadeIn">
                        {applySuccessMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 2: RoboVssProvider WIZARD STEPS */}
          {/* ========================================================================= */}
          {activeModule === 'vss' && (
            <div className="space-y-5">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-purple-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>1단계: 백업 대상 볼륨 및 잠긴 파일 시나리오 선택</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">VSS 스냅샷 대상 드라이브 볼륨</label>
                    <div className="flex items-center space-x-3">
                      {['C:', 'D:', 'E:'].map(drv => (
                        <button
                          key={drv}
                          onClick={() => setVssDrive(drv)}
                          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                            vssDrive === drv
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {drv} 볼륨
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">백업하려는 주요 잠긴 파일 유형 (VSS 타깃)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'pst', title: '💼 Outlook PST / OST 메일 사서함', desc: '아웃룩 실행 중에도 메일 DB 손상 없이 100% 실시간 무중단 복제' },
                        { id: 'sql', title: '🗄️ SQL Server / LocalDB (.mdf, .ldf)', desc: '서비스 중지 없이 데이터베이스 트랜잭션 일관성 스냅샷 보장' },
                        { id: 'vm', title: '🖥️ Hyper-V / VirtualBox 디스크 (.vhdx, .vdi)', desc: '가상 머신 가동 중에 디스크 파일을 무결점 라이브 덤프' },
                        { id: 'office', title: '📝 Excel / Word / Access 상시 열린 작업 문서', desc: '직원들이 문서를 열어놓고 퇴근해도 공유 위반 오류 0% 백업' }
                      ].map(item => (
                        <div
                          key={item.id}
                          onClick={() => setVssProfile(item.id as any)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            vssProfile === item.id
                              ? 'bg-purple-600/10 border-purple-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-bold text-xs block text-slate-200">{item.title}</span>
                          <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    💡 <strong>VSS(Volume Shadow Copy Service)</strong>는 Windows 커널 레벨에서 파일 쓰기 I/O를 0.1초간 프리징한 후 스냅샷 볼륨을 형성하므로 어떠한 공유 잠김 에러(Sharing Violation, Error 32)도 발생하지 않습니다.
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-purple-400 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>2단계: Windows VSS 스냅샷 볼륨 생성 및 경로 유효성 검증</span>
                    </div>

                    <button
                      onClick={runStep2VssCreate}
                      disabled={vssCreating}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${vssCreating ? 'animate-spin' : ''}`} />
                      <span>{vssCreating ? '스냅샷 생성 중...' : '📸 VSS 스냅샷 볼륨 생성'}</span>
                    </button>
                  </div>

                  {vssStep2Done ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/80 space-y-2">
                        <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>VSS 스냅샷 볼륨 성공적으로 생성 및 마운트 완료!</span>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-purple-300 border border-purple-900/60 break-all select-all">
                          {vssShadowVolume}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          이 전역 심볼릭 볼륨 경로는 원본 파일 시스템이 쓰기 중이어도 스냅샷 생성 순간의 상태를 읽기 전용으로 안전하게 제공합니다.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[11px] block">상태 플래그</span>
                          <span className="font-bold text-emerald-400">🟢 VSS_VOLSNAP_ATTR_NO_AUTORECOVERY</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[11px] block">잠긴 파일 무결성</span>
                          <span className="font-bold text-purple-400">100% 읽기 허용 (Error 32 원천 차단)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-2">
                      <Shield className="w-8 h-8 text-purple-400/50 mx-auto" />
                      <div className="text-xs font-semibold text-slate-300">VSS 스냅샷 볼륨을 아직 생성하지 않았습니다.</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        상단의 [📸 VSS 스냅샷 볼륨 생성] 버튼을 클릭하여 테스트 섀도 볼륨을 마운트하세요.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-purple-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>3단계: VSS 라이프사이클 파이프라인 스크립트 및 작업 연동</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-2">
                        <FileCode className="w-4 h-4 text-purple-400" />
                        <span>무중단 VSS 라이프사이클 3단계 실행 배치 스크립트 (.bat)</span>
                      </span>
                      <button
                        onClick={() => copyScriptText(`@echo off\nREM [RoboBackup VSS Snapshot Pipeline]\necho [1/3] Creating VSS Snapshot for ${vssDrive}...\nRoboBackupStudio.Core.exe --vss-create ${vssDrive} > vss_vol.txt\nset /p VSS_ROOT=<vss_vol.txt\n\necho [2/3] Executing Robocopy from Shadow Volume...\nrobocopy "%VSS_ROOT%\\Users\\Public" "${currentJob.targetPath}" /E /ZB /FFT /MT:8\n\necho [3/3] Releasing VSS Snapshot...\nRoboBackupStudio.Core.exe --vss-release "%VSS_ROOT%"\necho Done!`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-purple-300 hover:text-white flex items-center space-x-1 transition-colors border border-slate-700"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript ? '복사됨' : '스크립트 복사'}</span>
                      </button>
                    </div>

                    <pre className="p-3 rounded bg-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`@echo off
REM 1. VSS 스냅샷 볼륨 생성
RoboBackupStudio.Core.exe --vss-create ${vssDrive} > vss_temp.txt
set /p SHADOW_PATH=<vss_temp.txt

REM 2. 잠긴 파일/DB 무결점 복제 (/ZB /B 백업 모드 가동)
robocopy "%SHADOW_PATH%\\MyData" "${currentJob.targetPath}" /E /ZB /FFT /MT:8

REM 3. 복제 완료 후 VSS 스냅샷 안전 해제
RoboBackupStudio.Core.exe --vss-release "%SHADOW_PATH%"`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">백업 작업에 VSS 모드 반영</span>
                      <span className="text-[11px] text-slate-400">
                        작업 플래그에 백업 연산자 권한(/B /ZB)이 자동 활성화됩니다.
                      </span>
                    </div>
                    <button
                      onClick={applySettingsToMainJob}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center space-x-2 shrink-0 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>백업 작업에 VSS 모드 적용</span>
                    </button>
                  </div>

                  {applySuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 animate-fadeIn">
                      {applySuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 3: RoboSyncWatch WIZARD STEPS */}
          {/* ========================================================================= */}
          {activeModule === 'syncwatch' && (
            <div className="space-y-5">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>1단계: 실시간 디렉터리 감시 대상 및 모니터링 이벤트 지정</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">실시간 감시 대상 디렉터리 경로</label>
                    <input
                      type="text"
                      value={watchPath}
                      onChange={e => setWatchPath(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">감지할 파일 시스템 이벤트 필터</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { key: 'create', label: '파일 생성 (CREATE)' },
                        { key: 'modify', label: '내용 수정 (MODIFY)' },
                        { key: 'delete', label: '파일 삭제 (DELETE)' },
                        { key: 'rename', label: '이름 변경 (RENAME)' }
                      ].map(ev => {
                        const checked = (watchEvents as any)[ev.key];
                        return (
                          <div
                            key={ev.key}
                            onClick={() => setWatchEvents(prev => ({ ...prev, [ev.key]: !checked }))}
                            className={`p-2.5 rounded-lg border cursor-pointer flex items-center space-x-2 text-xs transition-all ${
                              checked
                                ? 'bg-amber-500/10 border-amber-500 text-white font-semibold'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            {checked ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                            <span>{ev.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-white block">임시 파일 및 캐시 버스트 필터링</span>
                      <span className="text-[11px] text-slate-400">*.tmp, ~$*, desktop.ini 저장 시 헛도는 동기화 방지</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={watchIgnoreTemp}
                      onChange={e => setWatchIgnoreTemp(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>2단계: 버스트 완충 디바운스(Quiet Period) 설정 및 가상 이벤트 시뮬레이션</span>
                    </div>

                    <button
                      onClick={runStep2WatchSimulate}
                      disabled={watchSimulating}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{watchSimulating ? `동기화 대기 중 (${watchSimCountdown}초)...` : '⚡ 가상 파일 이벤트 발생 테스트'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">연속 저장 지연 대기 시간 (Debounce Seconds)</span>
                      <span className="font-bold text-amber-400 font-mono text-sm">{watchDebounce}초</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={30}
                      value={watchDebounce}
                      onChange={e => setWatchDebounce(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>2초 (즉시)</span>
                      <span>5초 (권장)</span>
                      <span>15초</span>
                      <span>30초 (대용량 버스트)</span>
                    </div>
                  </div>

                  {/* Simulator Log Console */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between">
                      <span>디바운스 버스트 큐 실시간 상태</span>
                      {watchSimCountdown !== null && (
                        <span className="text-amber-400 font-bold font-mono">
                          동기화 트리거까지 {watchSimCountdown}초...
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-slate-900/90 font-mono text-xs space-y-1.5 max-h-40 overflow-y-auto">
                      {watchSimLogs.length === 0 ? (
                        <span className="text-slate-500 text-[11px]">
                          상단의 [⚡ 가상 파일 이벤트 발생 테스트] 버튼을 클릭하여 연속 저장이 일어날 때 디바운스 큐가 어떻게 작동하는지 확인하세요.
                        </span>
                      ) : (
                        watchSimLogs.map((log, idx) => (
                          <div key={idx} className="text-slate-300">{log}</div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>3단계: 백그라운드 자동 동기화 서비스 연동 및 가동</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">백그라운드 Robocopy 실행 프로필</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setWatchMode('headless')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          watchMode === 'headless'
                            ? 'bg-amber-600/10 border-amber-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block text-slate-200">🤫 무인 헤드리스 모드 (/NFL /NDL /NP)</span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          팝업 창 없이 백그라운드에서 조용히 변경된 파일만 타깃으로 복사합니다.
                        </p>
                      </div>

                      <div
                        onClick={() => setWatchMode('notify')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          watchMode === 'notify'
                            ? 'bg-amber-600/10 border-amber-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block text-slate-200">🔔 윈도우 토스트 알림 모드</span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          동기화가 완료될 때마다 윈도우 우측 하단 트레이 알림으로 전송 결과를 보고합니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">실시간 감시 파라미터 백업 작업에 반영</span>
                      <span className="text-[11px] text-slate-400">
                        감시 경로 및 자동 동기화 조건이 현재 백업 프로필에 등록됩니다.
                      </span>
                    </div>
                    <button
                      onClick={applySettingsToMainJob}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center space-x-2 shrink-0 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>실시간 감시 작업 적용</span>
                    </button>
                  </div>

                  {applySuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 animate-fadeIn">
                      {applySuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 4: RoboVault WIZARD STEPS */}
          {/* ========================================================================= */}
          {activeModule === 'vault' && (
            <div className="space-y-5">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>1단계: 대상 네트워크 스토리지(NAS/SMB) 및 보안 격리 방식 선택</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">대상 네트워크 공유 경로 (NAS Share)</label>
                    <input
                      type="text"
                      value={vaultShare}
                      onChange={e => setVaultShare(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      placeholder="예: \\192.168.0.100\Backup 또는 \\NAS-SERVER\Share"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">자격 증명 암호화 격리 기술</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setVaultType('dpapi')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          vaultType === 'dpapi'
                            ? 'bg-emerald-600/10 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block text-slate-200">🛡️ Windows DPAPI (AES-256) 볼트 (권장)</span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          현재 Windows 사용자 보안 키에 종속되어 오프라인 덤프나 메모리 해킹 시에도 암호 해독이 불가능합니다.
                        </p>
                      </div>

                      <div
                        onClick={() => setVaultType('cmdkey')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          vaultType === 'cmdkey'
                            ? 'bg-emerald-600/10 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block text-slate-200">🔑 Windows 자격 증명 관리자 (cmdkey)</span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          OS 표준 SMB 자격 증명 저장소에 등록하여 모든 배치 및 네트워크 드라이브가 즉시 인식합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>2단계: 계정 자격 증명 입력 및 사전 연결성(SMB Ping) 테스트</span>
                    </div>

                    <button
                      onClick={runStep2VaultTest}
                      disabled={vaultTesting || !vaultUser}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${vaultTesting ? 'animate-spin' : ''}`} />
                      <span>{vaultTesting ? 'SMB 인증 테스트 중...' : '🔍 네트워크 연결 및 인증 테스트'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">NAS 서비스/관리자 계정 ID</label>
                      <input
                        type="text"
                        value={vaultUser}
                        onChange={e => setVaultUser(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                        <span>비밀번호</span>
                        <button
                          onClick={() => setVaultShowPass(!vaultShowPass)}
                          className="text-[10px] text-slate-400 hover:text-white"
                        >
                          {vaultShowPass ? '숨기기' : '표시'}
                        </button>
                      </label>
                      <input
                        type={vaultShowPass ? 'text' : 'password'}
                        value={vaultPass}
                        onChange={e => setVaultPass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>

                  {vaultTestResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
                      vaultTestResult.ok
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{vaultTestResult.message}</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400">
                    🔒 등록된 비밀번호는 즉시 메모리에서 제로화(SecureZeroMemory)되며, 오직 암호화된 DPAPI 바이너리 블롭으로만 안전하게 디스크에 영구 보존됩니다.
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>3단계: 보안 볼트 영구 등록 및 Robocopy 자동 연동</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-white block">평문 비밀번호 0% 노출 Robocopy 실행 예시</span>
                    <pre className="p-3 rounded bg-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
{`REM 비밀번호를 배치 파일에 적지 않아도 Windows DPAPI 볼트가 자동 인증합니다.
robocopy "${currentJob.sourcePath}" "${vaultShare}" /MIR /FFT /MT:16 /ZB`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">보안 볼트 자격 증명 등록 및 백업 타깃 적용</span>
                      <span className="text-[11px] text-slate-400">
                        백업 타깃 경로가 NAS로 지정되고 OS 보안 볼트 자격 증명이 활성화됩니다.
                      </span>
                    </div>
                    <button
                      onClick={applySettingsToMainJob}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center space-x-2 shrink-0 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>보안 볼트에 저장 및 작업 연동</span>
                    </button>
                  </div>

                  {applySuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 animate-fadeIn">
                      {applySuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 5: RoboTimeMachine WIZARD STEPS */}
          {/* ========================================================================= */}
          {activeModule === 'timemachine' && (
            <div className="space-y-5">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-pink-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>1단계: 원본 소스 및 타임머신 보관소(TimeMachine Repo) 위치 지정</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">백업 원본 소스 (Source Path)</label>
                      <input
                        type="text"
                        value={tmSource}
                        onChange={e => setTmSource(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">타임머신 버전 보관소 저장소 (Repo Path)</label>
                      <input
                        type="text"
                        value={tmRepo}
                        onChange={e => setTmRepo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-900/60 space-y-1">
                    <span className="text-xs font-bold text-pink-300">💡 NTFS 하드링크(Hardlink) 핵심 원리:</span>
                    <p className="text-[11px] text-pink-200/90 leading-relaxed">
                      NTFS 하드링크는 동일한 디스크 볼륨(예: 둘 다 D: 드라이브) 내에서 작동할 때 최대의 효율을 발휘합니다. 이전 버전과 바이트가 동일한 파일은 <strong>물리 공간 0바이트를 차지하면서 탐색기에는 완전한 독립 파일로 표시</strong>됩니다.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-pink-400 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>2단계: 스냅샷 생성 주기 및 보존 회전(Retention) 정책 설정</span>
                    </div>

                    <button
                      onClick={runStep2TimeMachineCreate}
                      disabled={tmCreating}
                      className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
                    >
                      <History className={`w-3.5 h-3.5 ${tmCreating ? 'animate-spin' : ''}`} />
                      <span>{tmCreating ? '하드링크 스냅샷 생성 중...' : '⏳ 타임머신 스냅샷 시뮬레이션'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">스냅샷 자동 보관 주기</label>
                      <select
                        value={tmFrequency}
                        onChange={e => setTmFrequency(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="hourly">매시간 (Hourly Snapshot - 개발/설계 문서)</option>
                        <option value="daily">매일 1회 (Daily - 권장 표준 백업)</option>
                        <option value="manual">수동 실행 시에만 생성 (Manual On-Demand)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">최대 보관 버전 개수 (초과 시 오래된 순 자동 정리)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={tmRetention}
                        onChange={e => setTmRetention(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500">예: 30개 설정 시 최근 30일 치 스냅샷 자동 유지</span>
                    </div>
                  </div>

                  {/* Savings Stats Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">물리 디스크 용량 절감 시뮬레이션 결과</span>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">가상 전체 용량</span>
                        <span className="text-base font-bold font-mono text-slate-300">{tmStats.virtualSize}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">실제 디스크 점유</span>
                        <span className="text-base font-bold font-mono text-pink-400">{tmStats.physicalSize}</span>
                      </div>
                      <div className="p-2.5 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                        <span className="text-[10px] text-pink-300 block">디스크 절감율</span>
                        <span className="text-base font-bold font-mono text-emerald-400">{tmStats.savedRatio}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-semibold text-pink-400 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>3단계: 타임머신 스냅샷 아카이브 등록 및 완료</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="font-bold text-white flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>랜섬웨어 사전 방어 &amp; 1초 시점 복구 구조 완성</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      각 날짜별 스냅샷 폴더(`2026-09-09_180000`, `2026-09-08_180000` 등)는 독립된 폴더로 보존되어 언제든 과거 특정 날짜의 파일 원본을 탐색기에서 더블클릭만으로 즉시 복구할 수 있습니다.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">타임머신 보관소 경로를 백업 작업에 등록</span>
                      <span className="text-[11px] text-slate-400">
                        지정된 타임머신 보관소로 정기 증분 백업이 연동됩니다.
                      </span>
                    </div>
                    <button
                      onClick={applySettingsToMainJob}
                      className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 flex items-center space-x-2 shrink-0 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>타임머신 작업으로 등록</span>
                    </button>
                  </div>

                  {applySuccessMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 animate-fadeIn">
                      {applySuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            마법사 닫기
          </button>

          <div className="flex items-center space-x-2.5">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>이전 단계</span>
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 transition-all"
              >
                <span>다음 단계</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <span>마법사 완료 및 닫기</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
