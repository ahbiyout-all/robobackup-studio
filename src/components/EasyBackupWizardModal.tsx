import React, { useState, useEffect } from 'react';
import {
  Wand2,
  HardDrive,
  Network,
  RefreshCw,
  Archive,
  Folder,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Calendar,
  FileCode,
  ShieldCheck,
  Zap,
  Clock,
  Check,
  Sparkles
} from 'lucide-react';
import { BackupJob, RobocopyFlags } from '../types';
import { DEFAULT_FLAGS } from '../utils/robocopy';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export type WizardPurpose = 'usb' | 'nas' | 'mirror' | 'archive';
export type WizardBackupMode = 'incremental' | 'mirror' | 'full';

interface EasyBackupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJob: BackupJob;
  setCurrentJob: React.Dispatch<React.SetStateAction<BackupJob>>;
  onStartJob?: () => void;
  onOpenScheduler?: () => void;
}

export const EasyBackupWizardModal: React.FC<EasyBackupWizardModalProps> = ({
  isOpen,
  onClose,
  currentJob,
  setCurrentJob,
  onStartJob,
  onOpenScheduler
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [purpose, setPurpose] = useState<WizardPurpose>('usb');
  
  // Step 2 state
  const [sourcePath, setSourcePath] = useState<string>(currentJob.sourcePath || 'C:\\Users\\Public\\Documents');
  const [targetPath, setTargetPath] = useState<string>(currentJob.targetPath || 'D:\\Backup_Storage\\MyBackup');
  const [pathWarning, setPathWarning] = useState<string | null>(null);

  // Step 3 state
  const [mode, setMode] = useState<WizardBackupMode>('incremental');
  const [preventLock, setPreventLock] = useState<boolean>(true);
  const [useMultiThread, setUseMultiThread] = useState<boolean>(true);
  const [allowTimeOffset, setAllowTimeOffset] = useState<boolean>(true);

  // Step 4 state (Dry run)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationDone, setSimulationDone] = useState<boolean>(false);
  const [simFileCount, setSimFileCount] = useState<number>(142);
  const [simTotalBytes, setSimTotalBytes] = useState<number>(1850000000); // 1.85 GB
  const [simDeleteCount, setSimDeleteCount] = useState<number>(0);
  const [simDurationSec, setSimDurationSec] = useState<number>(14);

  // Step 5 state
  const [copiedBat, setCopiedBat] = useState<boolean>(false);

  // Synchronize initial paths when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSourcePath(currentJob.sourcePath || 'C:\\Users\\Public\\Documents');
      setTargetPath(currentJob.targetPath || 'D:\\Backup_Storage\\MyBackup');
      setSimulationDone(false);
      setCopiedBat(false);
    }
  }, [isOpen]);

  // Validate paths on change
  useEffect(() => {
    if (!sourcePath.trim() || !targetPath.trim()) {
      setPathWarning('원본과 대상 폴더를 모두 입력해 주세요.');
      return;
    }
    const cleanSrc = sourcePath.trim().replace(/[\\/]+$/, '').toLowerCase();
    const cleanTgt = targetPath.trim().replace(/[\\/]+$/, '').toLowerCase();

    if (cleanSrc === cleanTgt) {
      setPathWarning('⚠️ 경고: 원본과 대상 폴더가 동일합니다. 다른 위치를 지정하세요.');
    } else if (cleanTgt.startsWith(cleanSrc + '\\')) {
      setPathWarning('⚠️ 경고: 대상 폴더가 원본 폴더 내부에 포함되어 무한 복사 루프가 발생할 수 있습니다.');
    } else if (cleanSrc === 'c:' || cleanSrc === 'c:\\') {
      setPathWarning('💡 알림: C:\\ 드라이브 전체는 시스템 보호 파일이 많아 하위 작업 폴더(예: C:\\Users\\...)를 권장합니다.');
    } else {
      setPathWarning(null);
    }
  }, [sourcePath, targetPath]);

  if (!isOpen) return null;

  // Handle Purpose Selection
  const handleSelectPurpose = (selected: WizardPurpose) => {
    setPurpose(selected);
    if (selected === 'usb') {
      setMode('incremental');
      setAllowTimeOffset(true);
      if (!targetPath.startsWith('D:\\') && !targetPath.startsWith('E:\\')) {
        setTargetPath('E:\\USB_Backup\\MyFiles');
      }
    } else if (selected === 'nas') {
      setMode('incremental');
      setAllowTimeOffset(true);
      if (!targetPath.startsWith('\\\\')) {
        setTargetPath('\\\\192.168.0.100\\Backup_Storage');
      }
    } else if (selected === 'mirror') {
      setMode('mirror');
      setAllowTimeOffset(true);
    } else if (selected === 'archive') {
      setMode('incremental');
      setTargetPath('D:\\Archive_Storage\\OldFiles_Backup');
    }
  };

  // Run dry-run simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // realistic dynamic calculation
      const fakeFiles = Math.floor(Math.random() * 80) + 95;
      const fakeBytes = fakeFiles * (Math.floor(Math.random() * 8000000) + 4500000);
      setSimFileCount(fakeFiles);
      setSimTotalBytes(fakeBytes);
      setSimDeleteCount(mode === 'mirror' ? Math.floor(Math.random() * 3) : 0);
      setSimDurationSec(Math.max(5, Math.round(fakeBytes / (100 * 1024 * 1024))));
      setIsSimulating(false);
      setSimulationDone(true);
    }, 1200);
  };

  // Build flags based on wizard choices
  const getWizardFlags = (): Partial<RobocopyFlags> => {
    const isNetworkTarget = targetPath.trim().startsWith('\\\\') || purpose === 'nas';
    const flags: Partial<RobocopyFlags> = {
      ...DEFAULT_FLAGS,
      copySubdirsWithEmpty: mode !== 'mirror',
      mirror: mode === 'mirror',
      excludeOlder: mode === 'incremental',
      excludeChanged: false,
      threads: useMultiThread ? 8 : 1,
      retryCount: preventLock ? 1 : 2,
      waitTime: preventLock ? 1 : 3,
      fft: allowTimeOffset,
      restartableBackupMode: !isNetworkTarget,
      noProgress: true,
    };
    return flags;
  };

  // Apply to main job
  const applySettingsToJob = () => {
    const flags = getWizardFlags();
    setCurrentJob(prev => ({
      ...prev,
      sourcePath: sourcePath.trim(),
      targetPath: targetPath.trim(),
      flags: {
        ...prev.flags,
        ...flags
      },
      name: purpose === 'usb' ? '외장하드/USB 안심 백업' :
            purpose === 'nas' ? 'NAS 네트워크 무인 백업' :
            purpose === 'mirror' ? '완전 거울(미러) 동기화' : '아카이브 보관 백업'
    }));
  };

  // Actions in Step 5
  const handleStartNow = () => {
    applySettingsToJob();
    onClose();
    if (onStartJob) {
      setTimeout(() => onStartJob(), 100);
    }
  };

  const handleScheduleNow = () => {
    applySettingsToJob();
    onClose();
    if (onOpenScheduler) {
      setTimeout(() => onOpenScheduler(), 100);
    }
  };

  const handleExportBat = () => {
    const flags = getWizardFlags();
    let cmd = `robocopy "${sourcePath.trim()}" "${targetPath.trim()}" *.*`;
    if (flags.mirror) cmd += ' /MIR';
    else if (flags.copySubdirsWithEmpty) cmd += ' /E';
    if (flags.excludeOlder) cmd += ' /XO';
    if (flags.excludeChanged) cmd += ' /XC';
    if (flags.fft) cmd += ' /FFT';
    if (flags.threads && flags.threads > 1) cmd += ` /MT:${flags.threads}`;
    if (flags.retryCount !== undefined) cmd += ` /R:${flags.retryCount}`;
    if (flags.waitTime !== undefined) cmd += ` /W:${flags.waitTime}`;
    cmd += ' /NP /ZB /TEE /LOG+:"C:\\RoboBackup_EasyLog.txt"';

    const batContent = `@echo off\r\nchcp 65001 > nul\r\ntitle RoboBackup Studio - 원클릭 안심 백업\r\necho ====================================================\r\necho [RoboBackup Studio] 초보자 안심 원클릭 백업 시작\r\necho 원본: ${sourcePath}\r\necho 대상: ${targetPath}\r\necho ====================================================\r\n\r\n${cmd}\r\n\r\necho.\r\necho 백업이 안전하게 완료되었습니다.\r\npause\r\n`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RoboBackup_EasyBackup.bat';
    a.click();
    URL.revokeObjectURL(url);
    setCopiedBat(true);
    setTimeout(() => setCopiedBat(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">초보자 안심 백업 마법사</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Easy Wizard
                </span>
              </div>
              <p className="text-xs text-slate-400">복잡한 설정 없이 질문에 답변하면 최적의 백업이 완성됩니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Indicator Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
            {[
              { step: 1, label: '1. 목적 선택' },
              { step: 2, label: '2. 폴더 지정' },
              { step: 3, label: '3. 방식/속도' },
              { step: 4, label: '4. 안심 점검' },
              { step: 5, label: '5. 완료/실행' }
            ].map((s) => {
              const isActive = currentStep === s.step;
              const isPassed = currentStep > s.step;
              return (
                <div
                  key={s.step}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                      : isPassed
                      ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-800/40'
                      : 'bg-slate-800/40 text-slate-400'
                  }`}
                >
                  {isPassed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: Purpose Selection */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center sm:text-left">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>어떤 백업을 하고 싶으신가요?</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">원하시는 백업 목적을 선택하시면 최적화된 안전 규칙이 자동 구성됩니다.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* Purpose 1 */}
                <button
                  type="button"
                  onClick={() => handleSelectPurpose('usb')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    purpose === 'usb'
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                  }`}
                >
                  {purpose === 'usb' && (
                    <div className="absolute top-3 right-3 text-indigo-400">
                      <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 border border-blue-500/30">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-sm text-white mb-1">💻 PC ➔ 외장하드 / USB 백업</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    사진, 문서, 작업 파일들을 외장 드라이브에 안전하게 보관합니다. (가장 대중적)
                  </p>
                </button>

                {/* Purpose 2 */}
                <button
                  type="button"
                  onClick={() => handleSelectPurpose('nas')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    purpose === 'nas'
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                  }`}
                >
                  {purpose === 'nas' && (
                    <div className="absolute top-3 right-3 text-indigo-400">
                      <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/30">
                    <Network className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-sm text-white mb-1">🌐 PC ➔ NAS / 네트워크 백업</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    사내 공유기나 가정용 시놀로지/큐냅 NAS로 네트워크 무인 자동 복사합니다.
                  </p>
                </button>

                {/* Purpose 3 */}
                <button
                  type="button"
                  onClick={() => handleSelectPurpose('mirror')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    purpose === 'mirror'
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                  }`}
                >
                  {purpose === 'mirror' && (
                    <div className="absolute top-3 right-3 text-indigo-400">
                      <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-sm text-white mb-1">🔄 폴더 간 완전 일치 (거울 복제)</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    원본과 대상을 100% 동일하게 만듭니다. 원본에서 지운 파일은 대상에서도 지워집니다.
                  </p>
                </button>

                {/* Purpose 4 */}
                <button
                  type="button"
                  onClick={() => handleSelectPurpose('archive')}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    purpose === 'archive'
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                  }`}
                >
                  {purpose === 'archive' && (
                    <div className="absolute top-3 right-3 text-indigo-400">
                      <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
                    <Archive className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-sm text-white mb-1">📦 대용량 파일 장기 보관 아카이브</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    자주 수정되지 않는 프로젝트나 이전 연도 자료를 별도 보관소로 안전하게 이동/복사합니다.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Folder Selection */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-white">어디에 있는 파일을 어디로 저장할까요?</h4>
                <p className="text-xs text-slate-400 mt-1">백업할 원본 폴더와 저장할 대상 위치를 지정해 주세요.</p>
              </div>

              <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                {/* Source Folder */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <span>📂 원본(Source) 폴더 (백업할 내 파일 위치)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sourcePath}
                      onChange={(e) => setSourcePath(e.target.value)}
                      placeholder="예: C:\Users\YourName\Documents"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const sample = 'C:\\Users\\Public\\Documents';
                        setSourcePath(sample);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
                      title="기본 공용 문서 경로 적용"
                    >
                      내 문서
                    </button>
                  </div>
                </div>

                {/* Target Folder */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-emerald-400" />
                    <span>📁 대상(Target) 폴더 (저장할 위치)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      placeholder={purpose === 'nas' ? '예: \\\\192.168.0.100\\Backup' : '예: D:\\Backup_Storage\\MyFiles'}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (purpose === 'nas') setTargetPath('\\\\192.168.0.100\\Backup');
                        else setTargetPath('D:\\Backup_Storage\\MyBackup');
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
                      title="추천 저장 경로 적용"
                    >
                      추천 위치
                    </button>
                  </div>
                </div>

                {/* Smart Safety Alert Callout */}
                {pathWarning && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>{pathWarning}</div>
                  </div>
                )}

                {targetPath.startsWith('\\\\') && (
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 text-xs text-blue-300">
                    <Network className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>🌐 NAS/네트워크 공유 폴더가 감지되었습니다. (자격증명 자동 연동 지원)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Mode & Speed Options */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-white">어떤 방식으로 복사할까요?</h4>
                <p className="text-xs text-slate-400 mt-1">이해하기 쉬운 한글 설명으로 안전한 복사 방식을 선택하세요.</p>
              </div>

              {/* Mode Cards */}
              <div className="space-y-2.5">
                {/* Incremental */}
                <div
                  onClick={() => setMode('incremental')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    mode === 'incremental'
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">🟢 [초보자 추천 / 안심] 스마트 증분 백업</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          기존 파일 100% 보존
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        새로 생기거나 수정된 파일만 전송합니다. 대상 폴더에 이미 있던 파일은 절대 지우지 않아 가장 안전합니다.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="wizardMode"
                    checked={mode === 'incremental'}
                    onChange={() => setMode('incremental')}
                    className="mt-1.5 text-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {/* Mirror */}
                <div
                  onClick={() => setMode('mirror')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    mode === 'mirror'
                      ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
                      : 'bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">🟡 [주의 필요] 거울(미러) 동기화 (/MIR)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                          완전 동기화
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        원본과 대상의 내용이 완벽히 똑같아집니다. <strong className="text-amber-300">원본에서 삭제한 파일은 대상 폴더에서도 삭제</strong>됩니다.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="wizardMode"
                    checked={mode === 'mirror'}
                    onChange={() => setMode('mirror')}
                    className="mt-1.5 text-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Safe Toggles */}
              <div className="pt-2 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-300 mb-2">💡 초보자를 위한 추천 안심 옵션 (자동 적용)</h5>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">파일 잠김 방지 (/R:1 /W:1)</div>
                        <div className="text-[11px] text-slate-400">카톡/엑셀 등으로 열려있는 파일 때문에 멈추지 않고 안전하게 진행</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preventLock}
                      onChange={(e) => setPreventLock(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">초고속 8스레드 병렬 복사 (/MT:8)</div>
                        <div className="text-[11px] text-slate-400">8개 채널 동시 전송으로 윈도우 일반 복사 대비 4~8배 고속 처리</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useMultiThread}
                      onChange={(e) => setUseMultiThread(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">외장하드/NAS 시간 2초 오차 허용 (/FFT)</div>
                        <div className="text-[11px] text-slate-400">FAT/exFAT 파일시스템 시간 오차로 인한 불필요한 반복 복사 방지</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowTimeOffset}
                      onChange={(e) => setAllowTimeOffset(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Dry-run Safety Preview */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-white">안심 사전 시뮬레이션 점검</h4>
                <p className="text-xs text-slate-400 mt-1">
                  실제 파일 쓰기나 삭제 없이, 무엇이 어떻게 복사될지 가상으로 3초 만에 검증합니다.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">가상 시뮬레이션 검증 (/L 모드)</div>
                    <div className="text-xs text-slate-400">실제 데이터에는 아무런 영향도 주지 않으므로 안심하고 테스트하세요.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? '검증 분석 중...' : '🔍 3초 안심 사전점검 실행'}</span>
                  </button>
                </div>

                {/* Simulation Result Box */}
                {simulationDone ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <strong>사전 안전 점검 통과!</strong> 대상 위치 접근 및 파일 검사가 아무런 오류 없이 완료되었습니다.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400">복사 대상 파일</div>
                        <div className="text-base font-bold text-white mt-0.5">{simFileCount} 개</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400">전송 예정 용량</div>
                        <div className="text-base font-bold text-indigo-400 mt-0.5">{formatBytes(simTotalBytes)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400">삭제 예정 파일</div>
                        <div className={`text-base font-bold mt-0.5 ${simDeleteCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {simDeleteCount} 개 {simDeleteCount === 0 ? '(안전)' : ''}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[11px] text-slate-400">예상 소요 시간</div>
                        <div className="text-base font-bold text-sky-400 mt-0.5">약 {simDurationSec}초</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
                    위 버튼을 클릭하여 백업 시작 전 안전 상태를 확인하세요.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Finish & Actions */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-base font-bold text-white">백업 구성이 안전하게 완료되었습니다!</h4>
                <p className="text-xs text-slate-400 mt-1">원하시는 실행 방식을 선택해 주세요.</p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/30 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">백업 목적:</span>
                  <span className="font-semibold text-indigo-300">
                    {purpose === 'usb' ? '💻 외장하드/USB 백업' :
                     purpose === 'nas' ? '🌐 NAS 네트워크 백업' :
                     purpose === 'mirror' ? '🔄 완전 거울(미러) 동기화' : '📦 아카이브 보관'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">원본 경로:</span>
                  <span className="font-mono text-white max-w-[280px] sm:max-w-md truncate">{sourcePath}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">대상 경로:</span>
                  <span className="font-mono text-emerald-400 max-w-[280px] sm:max-w-md truncate">{targetPath}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">적용 모드:</span>
                  <span className="font-semibold text-white">
                    {mode === 'incremental' ? '🟢 스마트 증분 (안전 보존)' : '🟡 미러링 (/MIR)'} • 8스레드 고속 전송
                  </span>
                </div>
              </div>

              {/* 3 Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Action 1: Run Now */}
                <button
                  type="button"
                  onClick={handleStartNow}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-left transition-all shadow-lg shadow-emerald-600/20 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="font-bold text-sm">지금 바로 실행</div>
                  <div className="text-[11px] text-emerald-100/80 mt-0.5">라이브 콘솔에서 실시간 진행률 확인</div>
                </button>

                {/* Action 2: Schedule */}
                <button
                  type="button"
                  onClick={handleScheduleNow}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-left transition-all shadow-lg shadow-indigo-600/20 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-sm">매일 자동 백업 등록</div>
                  <div className="text-[11px] text-indigo-100/80 mt-0.5">윈도우 작업 스케줄러 무인 자동화</div>
                </button>

                {/* Action 3: Export BAT */}
                <button
                  type="button"
                  onClick={handleExportBat}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-left border border-slate-700 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center mb-2 border border-purple-500/30">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>원클릭 .bat 내보내기</span>
                    {copiedBat && <span className="text-[10px] text-emerald-400 font-normal">다운로드됨!</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">바탕화면에서 더블클릭 실행 파일 생성</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{currentStep === 1 ? '닫기' : '이전 단계'}</span>
          </button>

          <div className="flex items-center space-x-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2 && pathWarning && pathWarning.includes('동일')) {
                    alert('원본과 대상 폴더가 동일할 수 없습니다.');
                    return;
                  }
                  if (currentStep === 3 && !simulationDone) {
                    // Pre-run simulation automatically when advancing to step 4
                    handleRunSimulation();
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
              >
                <span>다음 단계</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    applySettingsToJob();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  설정만 저장
                </button>
                <button
                  type="button"
                  onClick={handleStartNow}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/30"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>백업 지금 시작</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
