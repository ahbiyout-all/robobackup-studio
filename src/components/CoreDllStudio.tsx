import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Shield, 
  Activity, 
  Lock, 
  History, 
  Play, 
  Square, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Folder, 
  Database, 
  RefreshCw, 
  Trash2, 
  HardDrive,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Layers,
  Sparkles,
  Wand2,
  BookOpen,
  Lightbulb,
  Info,
  HelpCircle
} from 'lucide-react';
import { BackupJob } from '../types';
import { CoreDllWizardModal, CoreModuleKey } from './CoreDllWizardModal';

interface CoreDllStudioProps {
  currentJob: BackupJob;
  setCurrentJob?: React.Dispatch<React.SetStateAction<BackupJob>>;
}

export const CoreDllStudio: React.FC<CoreDllStudioProps> = ({ currentJob, setCurrentJob }) => {
  const [activeModule, setActiveModule] = useState<'diff' | 'vss' | 'syncwatch' | 'vault' | 'timemachine'>('diff');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardModule, setWizardModule] = useState<CoreModuleKey>('diff');
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);

  const openWizard = (modKey: CoreModuleKey) => {
    setWizardModule(modKey);
    setIsWizardOpen(true);
  };

  // ==========================================
  // Module 1: RoboDiffEngine State
  // ==========================================
  const [isDiffScanning, setIsDiffScanning] = useState(false);
  const [diffProgress, setDiffProgress] = useState('');
  const [diffReport, setDiffReport] = useState<{
    scanned: boolean;
    newCount: number;
    modifiedCount: number;
    identicalCount: number;
    deletedCount: number;
    transferBytes: string;
    elapsedMs: number;
    items: Array<{ path: string; type: 'new' | 'modified' | 'identical' | 'deleted'; size: string; time: string }>;
  }>({
    scanned: true,
    newCount: 14,
    modifiedCount: 8,
    identicalCount: 420,
    deletedCount: 3,
    transferBytes: '1.42 GB',
    elapsedMs: 245,
    items: [
      { path: 'Financial_Reports\\2026_Q3_Budget_Summary.xlsx', type: 'modified', size: '14.8 MB', time: '방금 전' },
      { path: 'Database_Exports\\backup_dump_20260904.sql', type: 'new', size: '1.24 GB', time: '10분 전' },
      { path: 'Contracts\\Signed_Master_Agreement_v2.pdf', type: 'new', size: '3.6 MB', time: '1시간 전' },
      { path: 'Engineering_Drawings\\Main_Chassis_CAD_rev4.dwg', type: 'modified', size: '162.0 MB', time: '2시간 전' },
      { path: 'Logs\\obsolete_install_temp.log', type: 'deleted', size: '840 KB', time: '어제' },
      { path: 'System_Config\\appsettings.production.json', type: 'identical', size: '12 KB', time: '3일 전' },
      { path: 'Shared_Media\\Company_Brand_Guidelines.pdf', type: 'identical', size: '28.4 MB', time: '1주 전' },
    ]
  });

  const handleRunDiffScan = () => {
    setIsDiffScanning(true);
    setDiffProgress('소스 및 타깃 디렉터리 초고속 MFT 병렬 스캔 중...');
    setTimeout(() => {
      setDiffProgress('블록 해시 및 타임스탬프 델타 연산 중...');
      setTimeout(() => {
        setIsDiffScanning(false);
        setDiffProgress('');
        setDiffReport({
          scanned: true,
          newCount: 18,
          modifiedCount: 11,
          identicalCount: 512,
          deletedCount: 4,
          transferBytes: '1.68 GB',
          elapsedMs: 310,
          items: [
            { path: 'Projects\\Q4_Strategic_Roadmap_Draft.docx', type: 'new', size: '8.4 MB', time: '방금 전' },
            { path: 'Financial_Reports\\2026_Q3_Budget_Summary.xlsx', type: 'modified', size: '15.2 MB', time: '5분 전' },
            { path: 'Database_Exports\\backup_dump_20260904.sql', type: 'new', size: '1.24 GB', time: '15분 전' },
            { path: 'Engineering_Drawings\\Main_Chassis_CAD_rev4.dwg', type: 'modified', size: '162.0 MB', time: '2시간 전' },
            { path: 'Logs\\obsolete_debug_dump.tmp', type: 'deleted', size: '4.2 MB', time: '어제' },
            { path: 'System_Config\\appsettings.production.json', type: 'identical', size: '12 KB', time: '3일 전' },
          ]
        });
      }, 700);
    }, 600);
  };

  // ==========================================
  // Module 2: RoboVssProvider State
  // ==========================================
  const [vssDrive, setVssDrive] = useState('C:');
  const [isVssActive, setIsVssActive] = useState(false);
  const [vssVolumeName, setVssVolumeName] = useState('');
  const [vssLoading, setVssLoading] = useState(false);

  const handleCreateVss = () => {
    setVssLoading(true);
    setTimeout(() => {
      setVssLoading(false);
      setIsVssActive(true);
      setVssVolumeName(`\\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy${Math.floor(Math.random() * 8) + 1}`);
    }, 1000);
  };

  const handleReleaseVss = () => {
    setVssLoading(true);
    setTimeout(() => {
      setVssLoading(false);
      setIsVssActive(false);
      setVssVolumeName('');
    }, 600);
  };

  // ==========================================
  // Module 3: RoboSyncWatch State
  // ==========================================
  const [isWatchRunning, setIsWatchRunning] = useState(false);
  const [watchDebounce, setWatchDebounce] = useState(5);
  const [watchLogs, setWatchLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] RoboSyncWatch 엔진 준비 완료 (Win32 ReadDirectoryChangesW 대기)`
  ]);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      setWatchLogs(prev => [
        `⚡ [${new Date().toLocaleTimeString()}] [Quiet Period 만료] Robocopy 자동 백그라운드 동기화 트리거 완료! (/MIR)`,
        ...prev
      ]);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const toggleWatch = () => {
    if (isWatchRunning) {
      setIsWatchRunning(false);
      setCountdown(null);
      setWatchLogs(prev => [
        `⏹️ [${new Date().toLocaleTimeString()}] 실시간 감시 엔진이 중지되었습니다.`,
        ...prev
      ]);
    } else {
      setIsWatchRunning(true);
      setWatchLogs(prev => [
        `▶️ [${new Date().toLocaleTimeString()}] 실시간 감시 시작: ${currentJob.sourcePath} (디바운스 지연: ${watchDebounce}초)`,
        ...prev
      ]);
    }
  };

  const simulateFileEvent = (type: 'CREATE' | 'MODIFY' | 'DELETE') => {
    if (!isWatchRunning) return;
    const fileNames = ['contract_amendment.pdf', 'quarterly_metrics.xlsx', 'user_avatar_cache.bin', 'source_code_index.db'];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    setWatchLogs(prev => [
      `📝 [${new Date().toLocaleTimeString()}] [${type}] ${randomFile} (버스트 큐 등록)`,
      ...prev.slice(0, 50)
    ]);
    setCountdown(watchDebounce);
  };

  // ==========================================
  // Module 4: RoboVault State
  // ==========================================
  const [vaultTarget, setVaultTarget] = useState('\\\\NAS-ENTERPRISE\\BackupShare');
  const [vaultUser, setVaultUser] = useState('backup_service_acc');
  const [vaultPass, setVaultPass] = useState('SuperSecret$2026');
  const [vaultShowPass, setVaultShowPass] = useState(false);
  const [vaultStatus, setVaultStatus] = useState('Windows Credential Manager 및 DPAPI 격리 준비 완료');
  const [vaultItems, setVaultItems] = useState([
    { target: '\\\\NAS-ENTERPRISE\\BackupShare', user: 'backup_service_acc', modified: '2026-09-04 18:20', type: 'DPAPI AES-256' },
    { target: '\\\\SYNOLOGY-01\\DailyMirror', user: 'syno_admin', modified: '2026-09-02 09:15', type: 'Credential Manager' },
  ]);

  const handleSaveVault = () => {
    setVaultStatus(`✅ 자격 증명이 Windows DPAPI 보안 볼트에 안전하게 등록되었습니다! (${vaultTarget})`);
    if (!vaultItems.some(i => i.target === vaultTarget)) {
      setVaultItems(prev => [{ target: vaultTarget, user: vaultUser, modified: '방금 전', type: 'DPAPI AES-256' }, ...prev]);
    }
    setVaultPass('');
  };

  const handleDeleteVault = (target: string) => {
    setVaultItems(prev => prev.filter(i => i.target !== target));
    setVaultStatus(`🗑️ ${target} 자격 증명이 보안 볼트에서 안전하게 파기되었습니다.`);
  };

  // ==========================================
  // Module 5: RoboTimeMachine State
  // ==========================================
  const [tmSource, setTmSource] = useState(currentJob.sourcePath);
  const [tmRepo, setTmRepo] = useState('D:\\TimeMachine_Vault');
  const [isCreatingTm, setIsCreatingTm] = useState(false);
  const [tmSnapshots, setTmSnapshots] = useState([
    { id: '2026-09-04_193000', files: 432, hardlinks: 410, newFiles: 22, virtualSize: '18.4 GB', physicalSize: '412 MB', savings: '97.8%' },
    { id: '2026-09-03_193000', files: 420, hardlinks: 395, newFiles: 25, virtualSize: '18.1 GB', physicalSize: '580 MB', savings: '96.8%' },
    { id: '2026-09-02_193000', files: 412, hardlinks: 0, newFiles: 412, virtualSize: '17.8 GB', physicalSize: '17.8 GB', savings: '0% (초기 기준점)' },
  ]);

  const handleCreateSnapshot = () => {
    setIsCreatingTm(true);
    setTimeout(() => {
      setIsCreatingTm(false);
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      setTmSnapshots(prev => [
        { id: stamp, files: 446, hardlinks: 430, newFiles: 16, virtualSize: '18.9 GB', physicalSize: '290 MB', savings: '98.5%' },
        ...prev
      ]);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">엔터프라이즈 전용 코어 DLL 모듈 스위트</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v2.10.2 Core Engines &amp; Scenarios
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Robocopy 실행 전후의 신뢰성, 안전성 및 공간 효율을 극대화하는 5대 고성능 순수 C# 네이티브 코어 라이브러리입니다.
            </p>
          </div>
          
          {/* Version badge */}
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>RoboBackupStudio.Core.dll</span>
          </div>
        </div>

        {/* 5 Core DLL Wizard Launcher Master Card */}
        <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-700/60 rounded-xl p-4 mt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 shrink-0">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-white">5대 코어 DLL 모듈별 기능 사용 마법사</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  3-Step Interactive Wizard
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                원클릭 사전 검증부터 잠긴 파일 VSS 스냅샷, 실시간 감시, DPAPI 보안 볼트, NTFS 하드링크까지 단계별로 손쉽게 설정 및 적용하세요.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => openWizard(activeModule)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>현재 모듈 마법사 시작 ({
                activeModule === 'diff' ? 'RoboDiffEngine' :
                activeModule === 'vss' ? 'RoboVssProvider' :
                activeModule === 'syncwatch' ? 'RoboSyncWatch' :
                activeModule === 'vault' ? 'RoboVault' : 'RoboTimeMachine'
              })</span>
            </button>
          </div>
        </div>

        {/* 5 Tabs Bar in Order */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6 pt-6 border-t border-slate-800">
          
          <button
            onClick={() => setActiveModule('diff')}
            className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
              activeModule === 'diff'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40'
            }`}
          >
            <Zap className={`w-4 h-4 shrink-0 ${activeModule === 'diff' ? 'text-white' : 'text-blue-400'}`} />
            <div className="truncate">
              <div className="truncate">1. RoboDiffEngine</div>
              <div className="text-[10px] opacity-75 font-normal truncate">사전 차이 &amp; 진행률</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('vss')}
            className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
              activeModule === 'vss'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40'
            }`}
          >
            <Shield className={`w-4 h-4 shrink-0 ${activeModule === 'vss' ? 'text-white' : 'text-purple-400'}`} />
            <div className="truncate">
              <div className="truncate">2. RoboVssProvider</div>
              <div className="text-[10px] opacity-75 font-normal truncate">잠긴 파일 VSS 스냅샷</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('syncwatch')}
            className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
              activeModule === 'syncwatch'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40'
            }`}
          >
            <Activity className={`w-4 h-4 shrink-0 ${activeModule === 'syncwatch' ? 'text-white' : 'text-amber-400'}`} />
            <div className="truncate">
              <div className="truncate">3. RoboSyncWatch</div>
              <div className="text-[10px] opacity-75 font-normal truncate">스마트 큐 실시간 감시</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('vault')}
            className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
              activeModule === 'vault'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40'
            }`}
          >
            <Lock className={`w-4 h-4 shrink-0 ${activeModule === 'vault' ? 'text-white' : 'text-emerald-400'}`} />
            <div className="truncate">
              <div className="truncate">4. RoboVault</div>
              <div className="text-[10px] opacity-75 font-normal truncate">DPAPI NAS 보안 볼트</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModule('timemachine')}
            className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
              activeModule === 'timemachine'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 border border-pink-400/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40'
            }`}
          >
            <History className={`w-4 h-4 shrink-0 ${activeModule === 'timemachine' ? 'text-white' : 'text-pink-400'}`} />
            <div className="truncate">
              <div className="truncate">5. RoboTimeMachine</div>
              <div className="text-[10px] opacity-75 font-normal truncate">NTFS 하드링크 타임머신</div>
            </div>
          </button>

        </div>
      </div>

      {/* 5대 코어 기능 실전 업무 활용 시나리오 & 사용 방법 가이드 (초보자 필독 가이드) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 border border-blue-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">5대 코어 기능 실전 업무 활용 시나리오 &amp; 사용 방법 가이드</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  초보자 필독 가이드
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                복잡해 보이는 백업 모듈을 언제, 왜, 어떻게 쓰는지 알기 쉽게 정리한 5가지 실전 시나리오입니다. 클릭하여 바로 해당 모듈로 이동할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
          >
            {isGuideExpanded ? '접기 ▲' : '자세히 보기 ▼'}
          </button>
        </div>

        {isGuideExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-2">
            {/* 1. RoboDiffEngine Card */}
            <div 
              onClick={() => setActiveModule('diff')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeModule === 'diff' 
                  ? 'bg-blue-950/50 border-blue-500/60 ring-1 ring-blue-500/40 shadow-md shadow-blue-500/10' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  1. RoboDiffEngine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                  사전 점검
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1">
                "외장하드에 복사 누르기 전에 몇 기가나 바뀌었는지 먼저 확인하고 싶을 때"
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                수백 기가바이트 파일 중 오늘 바뀐 파일이 몇 개인지, 시간이 얼마나 걸릴지 Robocopy 실행 전 1초 만에 스캔하여 정확한 진행률(%)과 전송량을 미리 보여줍니다.
              </p>
              <div className="text-[10px] font-mono text-blue-400/80 bg-blue-950/60 p-2 rounded-lg border border-blue-800/40">
                👉 [사전 차이 분석 실행] 클릭 ➔ 변경 파일 수/용량 확인 ➔ 안심하고 백업 시작
              </div>
            </div>

            {/* 2. RoboVssProvider Card */}
            <div 
              onClick={() => setActiveModule('vss')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeModule === 'vss' 
                  ? 'bg-purple-950/50 border-purple-500/60 ring-1 ring-purple-500/40 shadow-md shadow-purple-500/10' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  2. RoboVssProvider
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                  잠긴 파일 복제
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1">
                "아웃룩이나 엑셀, DB가 켜져 있어 '파일이 사용 중입니다' 오류가 날 때"
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                프로그램을 일일이 종료하지 않아도 Windows VSS 섀도 복사본 기술로 특정 순간의 정지된 스냅샷 볼륨을 떠서 100% 무결점으로 안전 복사합니다.
              </p>
              <div className="text-[10px] font-mono text-purple-400/80 bg-purple-950/60 p-2 rounded-lg border border-purple-800/40">
                👉 대상 드라이브(C:) 지정 ➔ [VSS 스냅샷 볼륨 생성] ➔ 에러 없이 백업 완료 ➔ [스냅샷 해제]
              </div>
            </div>

            {/* 3. RoboSyncWatch Card */}
            <div 
              onClick={() => setActiveModule('syncwatch')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeModule === 'syncwatch' 
                  ? 'bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-500/40 shadow-md shadow-amber-500/10' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  3. RoboSyncWatch
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                  실시간 자동화
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1">
                "작업 폴더에 파일을 저장(Ctrl+S)할 때마다 알아서 자동 복사되길 원할 때"
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                매번 백업 버튼을 누를 필요 없이 폴더를 실시간 감시하다가, 파일 저장이 완료되는 순간(디바운스 3초) 백그라운드에서 즉시 Robocopy를 트리거합니다.
              </p>
              <div className="text-[10px] font-mono text-amber-400/80 bg-amber-950/60 p-2 rounded-lg border border-amber-800/40">
                👉 감시 경로 지정 ➔ 디바운스 3초 설정 ➔ [실시간 감시 시작] ➔ 파일 저장 시 자동 동기화!
              </div>
            </div>

            {/* 4. RoboVault Card */}
            <div 
              onClick={() => setActiveModule('vault')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeModule === 'vault' 
                  ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  4. RoboVault
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                  보안 자격증명
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1">
                "회사 NAS에 백업해야 하는데 배치 파일에 비밀번호를 적어두기 불안할 때"
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                네트워크 공유 폴더 비밀번호를 일반 텍스트가 아닌 Windows DPAPI 암호화 금고에 저장하여, 스크립트나 로그에 노출하지 않고 안전하게 자동 로그인합니다.
              </p>
              <div className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/40">
                👉 NAS 경로(\\192.168.0.x) + ID/PW 입력 ➔ [보안 볼트에 암호화 등록] ➔ 자동 무인 인증
              </div>
            </div>

            {/* 5. RoboTimeMachine Card */}
            <div 
              onClick={() => setActiveModule('timemachine')}
              className={`p-4 rounded-xl border transition-all cursor-pointer md:col-span-2 xl:col-span-2 ${
                activeModule === 'timemachine' 
                  ? 'bg-pink-950/50 border-pink-500/60 ring-1 ring-pink-500/40 shadow-md shadow-pink-500/10' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  5. RoboTimeMachine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-medium">
                  타임머신 버전 보관
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1">
                "맥(Mac)의 '타임머신'처럼 날짜별로 백업을 남겨서 과거로 되돌리고 싶은데 디스크 용량이 부족할 때"
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                날짜별(2026-09-17, 2026-09-18...) 폴더를 생성하되, 변경되지 않은 파일은 실제 복사하지 않고 NTFS 하드링크(0바이트 포인터)로 연결하여 10일치 백업도 1회분 용량(최대 90% 절약)으로 보관합니다.
              </p>
              <div className="text-[10px] font-mono text-pink-400/80 bg-pink-950/60 p-2 rounded-lg border border-pink-800/40">
                👉 원본 및 백업 보관소 지정 ➔ [타임머신 증분 스냅샷 생성] ➔ 날짜별 버전 폴더가 0바이트 하드링크로 초고속 생성!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODULE 1: RoboDiffEngine */}
      {activeModule === 'diff' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold font-mono">Module 1/5</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  RoboDiffEngine - 초고속 백업 차이 분석 &amp; 진행률 프리플라이트
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Robocopy를 시작하기 전 소스와 대상을 초고속 병렬 스캔하여 변경 파일과 전송 바이트를 1초 만에 사전 산출합니다.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => openWizard('diff')}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Wand2 className="w-4 h-4 text-blue-400" />
                <span>🧙‍♂️ 차이 분석 마법사</span>
              </button>

              <button
                onClick={handleRunDiffScan}
                disabled={isDiffScanning}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isDiffScanning ? 'animate-spin' : ''}`} />
                <span>{isDiffScanning ? '초고속 비교 분석 중...' : '⚡ 사전 차이 분석(Diff Scan) 실행'}</span>
              </button>
            </div>
          </div>

          {/* Module 1 실전 활용 예시 콜아웃 박스 */}
          <div className="bg-blue-950/30 border border-blue-500/40 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-blue-300">실전 활용 예시: 500GB 외장하드 백업 전 실제 변경 파일 및 용량 미리 확인하기</h4>
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">상황:</strong> 원본 폴더에 500GB의 수많은 파일이 있을 때, 오늘 작업한 파일 몇 개만 복사하면 되는데 실제로 복사할 데이터가 몇 기가인지, 복사 시간이 얼마나 걸릴지 사전에 예측하고 싶을 때 사용합니다.
            </p>
            <p className="text-xs text-slate-400">
              <strong className="text-blue-300">사용 방법:</strong> 소스와 대상 경로를 확인한 후 우측 상단의 <strong className="text-white">[⚡ 사전 차이 분석(Diff Scan) 실행]</strong> 버튼을 클릭하세요. 단 1초 만에 신규/수정/동일 파일 수와 실제 전송 바이트가 산출되어, 불필요한 전체 복사 없이 필요한 데이터만 정확히 전송되도록 보장합니다.
            </p>
          </div>

          {/* Paths Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">원본 (Source Path)</span>
              <div className="font-mono text-xs text-slate-200 truncate">{currentJob.sourcePath}</div>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">대상 백업 위치 (Destination Path)</span>
              <div className="font-mono text-xs text-slate-200 truncate">{currentJob.targetPath}</div>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
              <span className="text-xs text-emerald-400 font-semibold block mb-1">✨ 신규 파일</span>
              <span className="text-2xl font-black text-white font-mono">{diffReport.newCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">새로 생성된 파일</span>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
              <span className="text-xs text-amber-400 font-semibold block mb-1">🔄 변경된 파일</span>
              <span className="text-2xl font-black text-white font-mono">{diffReport.modifiedCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">내용/크기 갱신</span>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-center">
              <span className="text-xs text-slate-400 font-semibold block mb-1">⚪ 동일 파일 (스킵)</span>
              <span className="text-2xl font-black text-slate-300 font-mono">{diffReport.identicalCount}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">불필요한 복사 배제</span>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-blue-500/40 bg-blue-500/5 text-center">
              <span className="text-xs text-blue-400 font-semibold block mb-1">🚀 실제 전송 데이터량</span>
              <span className="text-2xl font-black text-blue-300 font-mono">{diffReport.transferBytes}</span>
              <span className="text-[10px] text-blue-400/80 block mt-0.5">분석 시간: {diffReport.elapsedMs}ms</span>
            </div>
          </div>

          {/* Progress Status if Scanning */}
          {isDiffScanning && (
            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl flex items-center space-x-3 text-xs text-blue-300">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{diffProgress}</span>
            </div>
          )}

          {/* Detected Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>사전 분석된 파일 목록 (미리보기)</span>
              <span className="text-[11px] text-slate-500">정확한 0~100% 바이트 진행률 기준점 제공</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto font-mono text-xs">
              {diffReport.items.map((item, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-3 truncate mr-4">
                    {item.type === 'new' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                        신규
                      </span>
                    )}
                    {item.type === 'modified' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                        변경
                      </span>
                    )}
                    {item.type === 'identical' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700/50 text-slate-400 shrink-0">
                        동일
                      </span>
                    )}
                    {item.type === 'deleted' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                        삭제 예정
                      </span>
                    )}
                    <span className="text-slate-200 truncate">{item.path}</span>
                  </div>
                  <div className="flex items-center space-x-4 shrink-0 text-slate-400 text-[11px]">
                    <span>{item.size}</span>
                    <span className="text-slate-500 hidden sm:inline">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: RoboVssProvider */}
      {activeModule === 'vss' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-bold font-mono">Module 2/5</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  RoboVssProvider - VSS(볼륨 섀도 복사본) 헬퍼
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                사용 중이거나 잠긴 파일(열려 있는 엑셀, Outlook PST, SQL .mdf, 가상머신 VHDX)을 백그라운드 섀도 볼륨으로 100% 무결점 캡처합니다.
              </p>
            </div>

            <button
              onClick={() => openWizard('vss')}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm shrink-0"
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>🧙‍♂️ VSS 스냅샷 마법사</span>
            </button>
          </div>

          {/* Module 2 실전 활용 예시 콜아웃 박스 */}
          <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-purple-300">실전 활용 예시: Outlook PST, SQL Server MDF 등 열려 있는 파일 잠김 에러 방지</h4>
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">상황:</strong> 직원이 퇴근할 때 아웃룩(Outlook)이나 엑셀 장부를 켜둔 채로 자리를 비웠거나 SQL Server 데이터베이스 서비스가 실행 중일 때, 일반 복사를 실행하면 "다른 프로세스가 파일을 사용 중이기 때문에 프로세스가 파일에 액세스할 수 없습니다(Access Denied)" 오류가 발생합니다.
            </p>
            <p className="text-xs text-slate-400">
              <strong className="text-purple-300">사용 방법:</strong> 대상 볼륨(C:)을 선택하고 <strong className="text-white">[📸 VSS 스냅샷 볼륨 생성]</strong> 버튼을 누르면, 볼륨 전체의 특정 시점 정지 상태를 캡처하여 잠긴 파일도 100% 무결점으로 복사할 수 있습니다. 복사 후에는 [🗑️ 스냅샷 안전 해제]를 통해 볼륨 공간을 자동 환수합니다. (Windows 서비스 또는 자동 VSS 프리플라이트 옵션 사용 시 전자동 처리)
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">대상 소스 볼륨</label>
                <div className="flex items-center space-x-2">
                  {['C:', 'D:', 'E:', 'F:'].map(drv => (
                    <button
                      key={drv}
                      onClick={() => setVssDrive(drv)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                        vssDrive === drv
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {drv}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end gap-3 pt-5 sm:pt-0">
                {!isVssActive ? (
                  <button
                    onClick={handleCreateVss}
                    disabled={vssLoading}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-600/20 transition-all"
                  >
                    <Shield className={`w-4 h-4 ${vssLoading ? 'animate-spin' : ''}`} />
                    <span>{vssLoading ? 'VSS 스냅샷 생성 중...' : '📸 VSS 스냅샷 볼륨 마운트'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReleaseVss}
                    disabled={vssLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{vssLoading ? '해제 중...' : '🗑️ VSS 스냅샷 안전 해제'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* VSS Active Banner */}
            <div className={`p-4 rounded-xl border transition-all ${
              isVssActive 
                ? 'bg-purple-950/40 border-purple-800/80 text-purple-200' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isVssActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs font-bold">
                      {isVssActive ? 'VSS 볼륨 섀도 복사본 활성화됨' : '현재 생성된 VSS 섀도 스냅샷 없음'}
                    </span>
                  </div>
                  {isVssActive && (
                    <div className="font-mono text-xs text-purple-300 break-all pt-1">
                      {vssVolumeName}
                    </div>
                  )}
                </div>
                {isVssActive && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Lock Zero-Contention
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Windows Service VSS Auto Pre-flight Integration Badge */}
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <div>
                <span className="font-bold text-slate-100">Windows 서비스(RoboBackupService) 무인 자동 연동 지원</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  서비스 백업 파이프라인에서 Robocopy 실행 전 섀도 스냅샷을 자동 사전 생성(Pre-flight)하고, 복사 종료 시 안전 해제(Auto Cleanup)를 수행합니다.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 whitespace-nowrap text-[10px]">
              Service Auto-VSS Ready
            </span>
          </div>

          {/* VSS Technical Advantages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-400" />
                데이터베이스 무중단 캡처
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                SQL Server .mdf, MySQL, SQLite 등 서비스 프로세스가 파일을 독점 점유하고 있어도 즉시 복제합니다.
              </p>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                사용 중인 오피스/Outlook 파일
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                직원이 열어둔 엑셀 장부나 Outlook의 초대형 .pst 메일함도 "다른 프로세스에서 사용 중" 에러 없이 복사합니다.
              </p>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                백업 후 자동 리소스 환수
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                복사 작업이 완료되는 즉시 임시 섀도 스냅샷을 자동 삭제하여 디스크 볼륨 공간을 100% 환수합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: RoboSyncWatch */}
      {activeModule === 'syncwatch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">Module 3/5</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  RoboSyncWatch - 스마트 큐 기반 실시간 자동 동기화 감시 엔진
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                파일 생성/수정/삭제 이벤트를 실시간 포착하고, 연속 저장 중 불필요한 재실행을 막는 디바운스(Debounce) 큐로 완충합니다.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => openWizard('syncwatch')}
                className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span>🧙‍♂️ 실시간 감시 마법사</span>
              </button>

              <button
                onClick={toggleWatch}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-2 shadow-lg transition-all ${
                  isWatchRunning
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                }`}
              >
                {isWatchRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isWatchRunning ? '⏹️ 실시간 감시 중지' : '▶️ 실시간 감시 시작'}</span>
              </button>
            </div>
          </div>

          {/* Module 3 실전 활용 예시 콜아웃 박스 */}
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300">실전 활용 예시: 프로젝트 폴더 작업 파일 저장 시 전자동 백그라운드 동기화</h4>
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">상황:</strong> 그래픽 디자인 소스나 코딩 프로젝트, 문서 작성 중 파일을 수정할 때마다 일일이 백업 프로그램을 열고 버튼을 누르는 것이 번거롭고 잊어버리기 쉬울 때 사용합니다.
            </p>
            <p className="text-xs text-slate-400">
              <strong className="text-amber-300">사용 방법:</strong> 감시 대상 폴더와 디바운스 시간(기본 3초)을 확인한 뒤 우측 상단의 <strong className="text-white">[▶️ 실시간 감시 시작]</strong> 버튼을 누르세요. 이제 작업자가 파워포인트나 코드를 수정하고 Ctrl+S를 누르면, 마지막 저장 후 3초 뒤에 백그라운드에서 자동으로 Robocopy가 작동하여 외장하드나 NAS로 즉시 동기화됩니다.
            </p>
          </div>

          {/* Config Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-400 block mb-1 font-medium">감시 대상 폴더 (FileSystemWatcher Native)</label>
              <div className="font-mono text-xs text-slate-200 truncate">{currentJob.sourcePath}</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-medium">디바운스 지연 시간 (Quiet Period)</label>
                <span className="font-mono font-bold text-amber-400 text-xs">{watchDebounce}초</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={watchDebounce}
                onChange={e => setWatchDebounce(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">파일 쓰기가 끝난 후 지정 초 동안 무입력 시 동기화</span>
            </div>
          </div>

          {/* Simulation Trigger Bar */}
          {isWatchRunning && (
            <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-amber-300">실시간 파일 시스템 이벤트 감시 중...</span>
                </div>
                {countdown !== null && (
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-mono border border-amber-500/30 animate-pulse">
                    ⏳ 동기화 트리거까지 {countdown}초 대기 중
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">테스트 이벤트 발생기:</span>
                <button
                  onClick={() => simulateFileEvent('CREATE')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-medium border border-slate-700"
                >
                  + 새 파일 작성 이벤트
                </button>
                <button
                  onClick={() => simulateFileEvent('MODIFY')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-medium border border-slate-700"
                >
                  ✎ 파일 수정(저장) 이벤트
                </button>
                <button
                  onClick={() => simulateFileEvent('DELETE')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-rose-400 font-medium border border-slate-700"
                >
                  ✕ 파일 삭제 이벤트
                </button>
              </div>
            </div>
          )}

          {/* Real-time Event Stream */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>실시간 변경 감지 이벤트 스트림</span>
              <button onClick={() => setWatchLogs([])} className="text-[11px] text-slate-500 hover:text-slate-400">
                로그 지우기
              </button>
            </div>
            <div className="p-3 bg-slate-950/80 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1.5">
              {watchLogs.map((log, i) => (
                <div key={i} className="leading-relaxed hover:text-white transition-colors">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: RoboVault */}
      {activeModule === 'vault' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">Module 4/5</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  RoboVault - DPAPI 기반 제로-로그인 NAS 보안 볼트
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Windows Credential Manager P/Invoke 및 DPAPI 가역 암호화로 비밀번호 평문 노출 0%를 보장합니다.
              </p>
            </div>

            <button
              onClick={() => openWizard('vault')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm shrink-0"
            >
              <Wand2 className="w-4 h-4 text-emerald-400" />
              <span>🧙‍♂️ 보안 볼트 마법사</span>
            </button>
          </div>

          {/* Module 4 실전 활용 예시 콜아웃 박스 */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-emerald-300">실전 활용 예시: 회사 NAS/네트워크 공유 비밀번호 노출 없는 자동 무인 인증</h4>
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">상황:</strong> 사내 공유 서버나 시놀로지 NAS(\\192.168.0.50\Backup)에 자동 백업을 걸어둘 때, 배치 파일이나 스케줄러에 암호를 평문(Text)으로 적어두면 누군가 열어보고 탈취할 위험이 있고, 적어두지 않으면 "로그인 세션이 만료되었습니다"라며 백업이 멈출 때 사용합니다.
            </p>
            <p className="text-xs text-slate-400">
              <strong className="text-emerald-300">사용 방법:</strong> 대상 NAS 경로와 계정/비밀번호를 입력하고 <strong className="text-white">[🔒 Windows 볼트에 보안 등록]</strong>을 클릭하세요. 비밀번호는 즉시 Windows DPAPI 및 자격 증명 관리자에 안전하게 암호화 보관되며, 백업 스크립트나 로그에 1글자도 노출되지 않고 Robocopy가 자동으로 안전하게 인증을 통과합니다.
            </p>
          </div>

          {/* Add / Manage Credentials Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-xs font-bold text-slate-200 block">새 NAS 자격 증명 보안 등록</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">대상 NAS 공유 경로</label>
                <input
                  type="text"
                  value={vaultTarget}
                  onChange={e => setVaultTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="\\NAS-SERVER\Share"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">인증 계정명 (Username)</label>
                <input
                  type="text"
                  value={vaultUser}
                  onChange={e => setVaultUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="backup_user"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">비밀번호 (DPAPI 암호화)</label>
                <div className="relative">
                  <input
                    type={vaultShowPass ? 'text' : 'password'}
                    value={vaultPass}
                    onChange={e => setVaultPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setVaultShowPass(!vaultShowPass)}
                    className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    {vaultShowPass ? '숨기기' : '표시'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSaveVault}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>🔒 보안 볼트에 암호화 등록 (DPAPI)</span>
              </button>
              <span className="text-[11px] text-emerald-400 font-mono">
                {vaultStatus}
              </span>
            </div>
          </div>

          {/* Active Vault Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-400">
              보안 볼트에 보관된 등록 자격 증명 목록
            </div>
            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {vaultItems.map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/30">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{item.target}</span>
                      <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      계정: <strong className="text-slate-300">{item.user}</strong> (비밀번호: DPAPI 보호됨 ••••••••)
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500 text-[11px] hidden sm:inline">{item.modified}</span>
                    <button
                      onClick={() => handleDeleteVault(item.target)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title="자격 증명 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: RoboTimeMachine */}
      {activeModule === 'timemachine' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 text-xs font-bold font-mono">Module 5/5</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-pink-400" />
                  RoboTimeMachine - NTFS 스마트 하드링크 &amp; 타임머신 버전 보관소
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Win32 CreateHardLinkW API로 이전 백업본과 동일한 파일은 0바이트 하드링크로 연결하여 디스크 용량을 90% 절약합니다.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => openWizard('timemachine')}
                className="px-3.5 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Wand2 className="w-4 h-4 text-pink-400" />
                <span>🧙‍♂️ 타임머신 마법사</span>
              </button>

              <button
                onClick={handleCreateSnapshot}
                disabled={isCreatingTm}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-pink-600/20 transition-all shrink-0"
              >
                <History className={`w-4 h-4 ${isCreatingTm ? 'animate-spin' : ''}`} />
                <span>{isCreatingTm ? '스냅샷 생성 중...' : '⏳ 타임머신 증분 스냅샷 생성'}</span>
              </button>
            </div>
          </div>

          {/* Module 5 실전 활용 예시 콜아웃 박스 */}
          <div className="bg-pink-950/30 border border-pink-500/40 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-pink-400" />
              <h4 className="text-xs font-bold text-pink-300">실전 활용 예시: 날짜별(2026-09-17, 2026-09-18...) 과거 복원 보관소 (용량 90% 절약)</h4>
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">상황:</strong> 어제나 그저께 파일 상태로 언제든 되돌리고 싶어서 날짜별 백업 폴더를 매일 남겨두고 싶은데, 매일 전체 복사를 하면 며칠 만에 수백 기가바이트의 하드 디스크 용량이 꽉 차버릴 때 사용합니다.
            </p>
            <p className="text-xs text-slate-400">
              <strong className="text-pink-300">사용 방법:</strong> 원본 폴더와 타임머신 보관소 경로를 지정하고 <strong className="text-white">[⏳ 타임머신 증분 스냅샷 생성]</strong> 버튼을 누르세요. 바뀐 파일만 새로 저장하고 어제와 똑같은 파일은 0바이트 NTFS 하드링크로 연결하여, 10일치 백업 폴더가 각각 온전한 파일처럼 보이면서도 디스크 용량은 단 1회분(최대 90% 이상 절약)만 차지합니다!
            </p>
          </div>

          {/* Repo Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-400 block mb-1 font-medium">원본 폴더 (Source)</label>
              <input
                type="text"
                value={tmSource}
                onChange={e => setTmSource(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-400 block mb-1 font-medium">타임머신 버전 보관소 (Snapshot Repo)</label>
              <input
                type="text"
                value={tmRepo}
                onChange={e => setTmRepo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Savings KPI Banner */}
          <div className="p-4 bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-800/60 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-white">NTFS 하드링크 물리 용량 절감 통계</span>
              </div>
              <p className="text-[11px] text-slate-400">
                각 스냅샷 폴더는 완전한 독립 폴더로 탐색기에서 브라우징되지만, 실제로는 변경되지 않은 파일이 동일 MFT 클러스터를 공유합니다.
              </p>
            </div>
            <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">가상 전체 용량</span>
                <span className="font-bold text-slate-300">55.4 GB</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">실제 디스크 점유</span>
                <span className="font-bold text-pink-400">18.5 GB</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-300 font-bold text-center">
                66.6% 용량 절약
              </div>
            </div>
          </div>

          {/* Snapshots Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-400">
              날짜별 타임머신 스냅샷 아카이브 목록
            </div>
            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {tmSnapshots.map((snap, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/30">
                  <div className="flex items-center space-x-3">
                    <Folder className="w-4 h-4 text-pink-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200">{snap.id}</div>
                      <div className="text-[11px] text-slate-400">
                        전체: {snap.files}개 파일 | 하드링크 재활용: <span className="text-emerald-400">{snap.hardlinks}개</span> | 신규 복사: <span className="text-amber-400">{snap.newFiles}개</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-right">
                    <div>
                      <div className="text-slate-300 font-bold">{snap.physicalSize}</div>
                      <div className="text-[10px] text-slate-500">가상: {snap.virtualSize}</div>
                    </div>
                    <span className="px-2 py-1 rounded bg-pink-500/20 text-pink-300 font-bold text-[10px] border border-pink-500/30 shrink-0">
                      {snap.savings}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5 Core DLL Wizard Modal */}
      <CoreDllWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialModule={wizardModule}
        currentJob={currentJob}
        setCurrentJob={setCurrentJob}
      />

    </div>
  );
};
