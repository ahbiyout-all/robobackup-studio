import React, { useState } from 'react';
import { 
  Folder, 
  FolderOutput, 
  Zap, 
  Copy, 
  Check, 
  Sliders, 
  Play, 
  Plus, 
  X, 
  ShieldCheck, 
  HardDrive, 
  FileCode,
  Info,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Clock,
  Gauge,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { RobocopyFlags, BackupJob, PresetProfile, ScannedFileInfo } from '../types';
import { buildRobocopyCommand, PRESET_PROFILES, DEFAULT_FLAGS, isUncPath, evaluateFileExclusions } from '../utils/robocopy';
import { NasAuthManager } from './NasAuthManager';
import { AdvancedRobocopyMenu } from './AdvancedRobocopyMenu';

interface JobDesignerProps {
  currentJob: BackupJob;
  setCurrentJob: React.Dispatch<React.SetStateAction<BackupJob>>;
  onStartJob: () => void;
  onSaveJob: () => void;
  onOpenEasyWizard?: () => void;
}

// Predefined exclusion presets
export const PRESET_FILE_PATTERNS = [
  { pattern: '*.tmp', label: '임시 파일 (*.tmp)' },
  { pattern: 'thumbs.db', label: '썸네일 (thumbs.db)' },
  { pattern: 'desktop.ini', label: '폴더 설정 (desktop.ini)' },
  { pattern: '*.bak', label: '백업 본 (*.bak)' },
  { pattern: '*.log', label: '로그 파일 (*.log)' },
  { pattern: '~$*', label: 'Office 잠금 (~$*)' },
  { pattern: '*.ds_store', label: 'Mac 메타 (.DS_Store)' },
  { pattern: '*.iso', label: '디스크 이미지 (*.iso)' },
  { pattern: '*.zip', label: '압축 파일 (*.zip)' },
  { pattern: '*.crdownload', label: '다운로드 중 (*.crdownload)' },
];

export const PRESET_DIR_PATTERNS = [
  { pattern: '$RECYCLE.BIN', label: '휴지통 ($RECYCLE.BIN)' },
  { pattern: 'System Volume Information', label: '시스템 복원 (System Volume Info)' },
  { pattern: 'node_modules', label: 'NPM 패키지 (node_modules)' },
  { pattern: '.git', label: 'Git 레포지토리 (.git)' },
  { pattern: 'Temp', label: '임시 폴더 (Temp)' },
  { pattern: 'Cache', label: '캐시 디렉터리 (Cache)' },
  { pattern: 'AppData', label: '앱 데이터 (AppData)' },
  { pattern: '.vs', label: 'VS 캐시 (.vs)' },
  { pattern: 'build', label: '빌드 폴더 (build)' },
  { pattern: 'dist', label: '배포 폴더 (dist)' },
];

// Advanced Master Presets definition
export const ADVANCED_MASTER_PRESETS = [
  {
    id: 'server_migration',
    name: '🏢 서버 마이그레이션',
    desc: 'NTFS 권한 ACL, 소유자 정보, 타임스탬프 완벽 복제 (/COPYALL /ZB /XJ)',
    badge: 'Enterprise',
    color: 'from-purple-900/70 to-slate-900 border-purple-500/50 text-purple-200',
    flags: {
      mirror: true,
      copyAll: true,
      copySec: false,
      restartableBackupMode: true,
      threads: 16,
      excludeJunctions: true,
      fft: true,
      includeTimestamps: true,
      fullPathNames: true,
      noProgress: true,
    } as Partial<RobocopyFlags>,
  },
  {
    id: 'nvme_speed',
    name: '🚀 NVMe / SSD 극한 복사',
    desc: '화면 출력 오버헤드 억제 및 32 멀티스레드 극대화 (/MT:32 /NP /IPG:0)',
    badge: 'Ultra Speed',
    color: 'from-emerald-900/70 to-slate-900 border-emerald-500/50 text-emerald-200',
    flags: {
      threads: 32,
      noProgress: true,
      noDirectoryList: false,
      restartableBackupMode: false,
      restartMode: false,
      backupMode: false,
      ipg: 0,
    } as Partial<RobocopyFlags>,
  },
  {
    id: 'nas_safe',
    name: '🛡️ NAS 안정 동기화',
    desc: 'FAT 2초 시간 오차 허용, 연결 복구 및 짧은 재시도 (/FFT /ZB /R:2 /W:3)',
    badge: 'NAS Sync',
    color: 'from-blue-900/70 to-slate-900 border-blue-500/50 text-blue-200',
    flags: {
      fft: true,
      restartableBackupMode: true,
      threads: 16,
      retryCount: 2,
      waitTime: 3,
      excludeJunctions: true,
    } as Partial<RobocopyFlags>,
  },
  {
    id: 'bandwidth_throttle',
    name: '📉 대역폭 분산 제어',
    desc: '사내 업무망 영향 최소화를 위한 패킷 간 지연 (/IPG:50 /MT:4)',
    badge: 'Throttling',
    color: 'from-amber-900/70 to-slate-900 border-amber-500/50 text-amber-200',
    flags: {
      threads: 4,
      ipg: 50,
      restartableBackupMode: true,
    } as Partial<RobocopyFlags>,
  },
  {
    id: 'night_window',
    name: '🌙 야간 백업 창 전용',
    desc: '지정 시간대(22:00~06:00)에만 복사 및 안전 파일 단위 종료 (/RH /PF)',
    badge: 'Schedule Window',
    color: 'from-indigo-900/70 to-slate-900 border-indigo-500/50 text-indigo-200',
    flags: {
      runHours: '2200-0600',
      perFileTimeCheck: true,
      threads: 16,
      noProgress: true,
    } as Partial<RobocopyFlags>,
  },
];

export const JobDesigner: React.FC<JobDesignerProps> = ({
  currentJob,
  setCurrentJob,
  onStartJob,
  onSaveJob,
  onOpenEasyWizard,
}) => {
  const [copied, setCopied] = useState(false);
  const [dragActiveSource, setDragActiveSource] = useState(false);
  const [dragActiveTarget, setDragActiveTarget] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fast_mirror');
  const [selectedMasterPresetId, setSelectedMasterPresetId] = useState<string | null>(null);
  
  // Collapsible view toggles for cleaner UI
  const [showAdvancedPresets, setShowAdvancedPresets] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  
  const [newExFile, setNewExFile] = useState('');
  const [newExDir, setNewExDir] = useState('');

  const command = buildRobocopyCommand(currentJob.sourcePath, currentJob.targetPath, currentJob.flags);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset: PresetProfile) => {
    setSelectedPresetId(preset.id);
    setSelectedMasterPresetId(null);
    const isNasPreset = preset.id === 'nas_network';
    setCurrentJob((prev) => ({
      ...prev,
      targetPath: isNasPreset && !isUncPath(prev.targetPath) ? '\\\\192.168.0.100\\' : (prev.targetPath.startsWith('\\\\') && !prev.targetPath.endsWith('\\') ? prev.targetPath + '\\' : prev.targetPath),
      flags: {
        ...DEFAULT_FLAGS,
        ...preset.flags,
      },
    }));
  };

  const applyMasterPreset = (master: typeof ADVANCED_MASTER_PRESETS[0]) => {
    setSelectedMasterPresetId(master.id);
    setSelectedPresetId('');
    setCurrentJob((prev) => ({
      ...prev,
      flags: {
        ...prev.flags,
        ...master.flags,
      },
    }));
  };

  const updateFlag = <K extends keyof RobocopyFlags>(key: K, value: RobocopyFlags[K]) => {
    setCurrentJob((prev) => ({
      ...prev,
      flags: {
        ...prev.flags,
        [key]: value,
      },
    }));
  };

  const handleApplyPresetFlags = (partialFlags: Partial<RobocopyFlags>) => {
    setCurrentJob((prev) => ({
      ...prev,
      flags: {
        ...prev.flags,
        ...partialFlags,
      },
    }));
  };

  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [fileFilterTab, setFileFilterTab] = useState<'all' | 'included' | 'excluded'>('all');
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(true);

  // Drag and drop handlers with real file analysis
  const handleSourceDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveSource(true);
  };
  const handleSourceDragLeave = () => setDragActiveSource(false);
  const handleSourceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveSource(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      let totalBytes = 0;
      const realList: ScannedFileInfo[] = [];
      let folderName = '';

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        totalBytes += f.size;
        if (!folderName && f.webkitRelativePath) {
          folderName = f.webkitRelativePath.split('/')[0];
        }
        realList.push({
          id: `drop-f-${i}-${f.name}`,
          name: f.name,
          relativePath: f.webkitRelativePath || f.name,
          sizeBytes: f.size,
          lastModifiedMs: f.lastModified,
        });
      }

      const inferredPath = folderName 
        ? `C:\\Users\\${folderName}` 
        : ((files[0] as any).path ? (files[0] as any).path : `C:\\Source\\${files[0].name}`);

      setCurrentJob(prev => ({
        ...prev,
        sourcePath: inferredPath,
        totalFiles: realList.length,
        totalBytes: totalBytes,
        realFiles: realList,
        scannedAt: new Date().toLocaleTimeString(),
      }));
    }
  };

  const handleTargetDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveTarget(true);
  };
  const handleTargetDragLeave = () => setDragActiveTarget(false);
  const handleTargetDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActiveTarget(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const targetPath = (file as any).path || `D:\\Backup_Target\\${file.name}`;
      setCurrentJob((prev) => ({ ...prev, targetPath }));
    }
  };

  // Evaluate real files with current exclusion flags
  const filterEvaluation = currentJob.realFiles && currentJob.realFiles.length > 0
    ? evaluateFileExclusions(currentJob.realFiles, currentJob.flags)
    : null;

  const addExcludeFile = () => {
    if (!newExFile.trim()) return;
    updateFlag('excludeFiles', [...currentJob.flags.excludeFiles, newExFile.trim()]);
    setNewExFile('');
  };

  const removeExcludeFile = (index: number) => {
    const updated = [...currentJob.flags.excludeFiles];
    updated.splice(index, 1);
    updateFlag('excludeFiles', updated);
  };

  const addExcludeDir = () => {
    if (!newExDir.trim()) return;
    updateFlag('excludeDirs', [...currentJob.flags.excludeDirs, newExDir.trim()]);
    setNewExDir('');
  };

  const removeExcludeDir = (index: number) => {
    const updated = [...currentJob.flags.excludeDirs];
    updated.splice(index, 1);
    updateFlag('excludeDirs', updated);
  };

  const togglePresetFilePattern = (pattern: string) => {
    const exists = currentJob.flags.excludeFiles.some(f => f.toLowerCase() === pattern.toLowerCase());
    if (exists) {
      updateFlag('excludeFiles', currentJob.flags.excludeFiles.filter(f => f.toLowerCase() !== pattern.toLowerCase()));
    } else {
      updateFlag('excludeFiles', [...currentJob.flags.excludeFiles, pattern]);
    }
  };

  const togglePresetDirPattern = (pattern: string) => {
    const exists = currentJob.flags.excludeDirs.some(d => d.toLowerCase() === pattern.toLowerCase());
    if (exists) {
      updateFlag('excludeDirs', currentJob.flags.excludeDirs.filter(d => d.toLowerCase() !== pattern.toLowerCase()));
    } else {
      updateFlag('excludeDirs', [...currentJob.flags.excludeDirs, pattern]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner & Quick Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 mb-1 font-semibold text-sm">
              <Zap className="w-4 h-4" />
              <span>Windows Native Robocopy GUI Builder</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">백업 작업 설정 및 Robocopy CLI 생성기</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              드래그 앤 드롭으로 원본/대상 경로를 지정하고, 다중 스레드(/MT) 및 재시도 옵션을 시각적으로 조정하세요.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {onOpenEasyWizard && (
              <button
                type="button"
                onClick={onOpenEasyWizard}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/40"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>초보자 안심 마법사</span>
              </button>
            )}
            <button
              onClick={onStartJob}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>실시간 테스트 실행</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Profiles Picker with Integrated Advanced Master Presets */}
      <div className="bg-slate-900/70 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-200">초고속 백업 프리셋 선택</h2>
            <span className="text-[11px] text-slate-400 hidden md:inline">| 원클릭으로 최적 플래그가 자동 적용됩니다</span>
          </div>
          
          {/* Toggle for Advanced Master Presets (Requirement 3) */}
          <button
            type="button"
            onClick={() => setShowAdvancedPresets(!showAdvancedPresets)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
              showAdvancedPresets
                ? 'bg-purple-950/80 text-purple-200 border-purple-500 shadow-md shadow-purple-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-900/50 hover:border-purple-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>고급 최적 조합 프리셋 {showAdvancedPresets ? '접기 ▲' : '더보기 ▼'}</span>
          </button>
        </div>

        {/* 1. Core Standard Presets (Always visible, clean and high contrast) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRESET_PROFILES.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            
            const colorThemes: Record<string, { activeBg: string; activeBorder: string; activeText: string; activeBadge: string; dot: string }> = {
              fast_mirror: {
                activeBg: 'bg-gradient-to-br from-blue-900/60 via-blue-950/80 to-slate-900',
                activeBorder: 'border-blue-400 ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/25',
                activeText: 'text-blue-200',
                activeBadge: 'bg-blue-500 text-white',
                dot: 'bg-blue-400',
              },
              safe_incremental: {
                activeBg: 'bg-gradient-to-br from-emerald-900/60 via-emerald-950/80 to-slate-900',
                activeBorder: 'border-emerald-400 ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/25',
                activeText: 'text-emerald-200',
                activeBadge: 'bg-emerald-500 text-white',
                dot: 'bg-emerald-400',
              },
              nas_network: {
                activeBg: 'bg-gradient-to-br from-indigo-900/60 via-indigo-950/80 to-slate-900',
                activeBorder: 'border-indigo-400 ring-2 ring-indigo-500/60 shadow-lg shadow-indigo-500/25',
                activeText: 'text-indigo-200',
                activeBadge: 'bg-indigo-500 text-white',
                dot: 'bg-indigo-400',
              },
              system_image: {
                activeBg: 'bg-gradient-to-br from-amber-900/60 via-amber-950/80 to-slate-900',
                activeBorder: 'border-amber-400 ring-2 ring-amber-500/60 shadow-lg shadow-amber-500/25',
                activeText: 'text-amber-200',
                activeBadge: 'bg-amber-500 text-white',
                dot: 'bg-amber-400',
              },
              documents_photos: {
                activeBg: 'bg-gradient-to-br from-teal-900/60 via-teal-950/80 to-slate-900',
                activeBorder: 'border-teal-400 ring-2 ring-teal-500/60 shadow-lg shadow-teal-500/25',
                activeText: 'text-teal-200',
                activeBadge: 'bg-teal-500 text-white',
                dot: 'bg-teal-400',
              },
            };

            const theme = colorThemes[preset.id] || colorThemes.fast_mirror;

            return (
              <button
                key={preset.id}
                type="button"
                title={`${preset.name}: ${preset.description}`}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.01] group relative border flex items-center justify-between ${
                  isSelected
                    ? `${theme.activeBg} ${theme.activeBorder}`
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`font-bold text-sm transition-colors ${
                  isSelected ? theme.activeText : 'text-slate-200 group-hover:text-white'
                }`}>
                  {preset.name}
                </div>
                {isSelected ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center shrink-0 ${theme.activeBadge}`}>
                    <Check className="w-3 h-3 mr-0.5" />
                    <span>적용</span>
                  </span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-slate-500 transition-colors shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* 2. Collapsible Advanced Master Combinations (Requirement 3: Moved here from Advanced menu) */}
        {showAdvancedPresets && (
          <div className="mt-4 pt-4 border-t border-purple-900/40 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>실무 고급 마스터 조합 (마우스 오버 시 상세 플래그 설명 확인)</span>
              </span>
              <span className="text-[11px] text-slate-400">서버 이전, NVMe 극한 속도, 대역폭 분산 전용</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {ADVANCED_MASTER_PRESETS.map((master) => {
                const isSelected = selectedMasterPresetId === master.id;
                return (
                  <button
                    key={master.id}
                    type="button"
                    title={`${master.name} [${master.badge}]: ${master.desc}`}
                    onClick={() => applyMasterPreset(master)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] group relative flex items-center justify-between ${
                      isSelected
                        ? `bg-gradient-to-br ${master.color} ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/20`
                        : 'bg-slate-950/70 hover:bg-slate-900 border-purple-900/30 hover:border-purple-600/50 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate mr-2">
                      {master.name}
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500 text-white shadow-sm shrink-0">✓ 적용</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 shrink-0">{master.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Drag & Drop Folder Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Source Dropzone */}
        <div
          onDragOver={handleSourceDragOver}
          onDragLeave={handleSourceDragLeave}
          onDrop={handleSourceDrop}
          className={`p-6 rounded-2xl border-2 transition-all ${
            dragActiveSource
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-dashed border-slate-700 bg-slate-900/40 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-blue-400 flex items-center space-x-2">
              <Folder className="w-4 h-4" />
              <span>원본 폴더 (Source Directory)</span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-colors">
                <span>📁 폴더 직접 분석</span>
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    let totalBytes = 0;
                    const realList = [];
                    let folderName = '';
                    for (let i = 0; i < files.length; i++) {
                      const f = files[i];
                      totalBytes += f.size;
                      if (!folderName && f.webkitRelativePath) {
                        folderName = f.webkitRelativePath.split('/')[0];
                      }
                      realList.push({
                        id: `f-${i}-${f.name}`,
                        name: f.name,
                        relativePath: f.webkitRelativePath || f.name,
                        sizeBytes: f.size,
                        lastModifiedMs: f.lastModified,
                      });
                    }
                    const inferredPath = folderName ? `C:\\Users\\${folderName}` : currentJob.sourcePath;
                    setCurrentJob(prev => ({
                      ...prev,
                      sourcePath: inferredPath,
                      totalFiles: files.length,
                      totalBytes: totalBytes,
                      realFiles: realList,
                      scannedAt: new Date().toLocaleTimeString(),
                    }));
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={currentJob.sourcePath}
              onChange={(e) => setCurrentJob((prev) => ({ ...prev, sourcePath: e.target.value }))}
              placeholder="예: C:\Users\Documents\Projects"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
            />
            {currentJob.totalFiles > 0 ? (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
                <span className="font-semibold flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>실제 폴더 분석 완료: {currentJob.totalFiles.toLocaleString()}개 파일 ({(currentJob.totalBytes / (1024 * 1024)).toFixed(2)} MB)</span>
                </span>
                <span className="text-[11px] text-emerald-400/80 font-mono">스캔: {currentJob.scannedAt || '방금'}</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-800/40 text-xs text-slate-400 flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>탐색기에서 폴더를 드래그하여 놓거나 우측 상단 '폴더 직접 분석'을 누르세요.</span>
              </div>
            )}
          </div>
        </div>

        {/* Target Dropzone */}
        <div
          onDragOver={handleTargetDragOver}
          onDragLeave={handleTargetDragLeave}
          onDrop={handleTargetDrop}
          className={`p-6 rounded-2xl border-2 transition-all ${
            dragActiveTarget
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-dashed border-slate-700 bg-slate-900/40 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <FolderOutput className="w-4 h-4" />
              <span>백업 대상 폴더 (Target Directory)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  let nasAddress = currentJob.targetPath.startsWith('\\\\') 
                    ? currentJob.targetPath 
                    : (currentJob.nasAuth?.server ? `\\\\${currentJob.nasAuth.server}\\data\\` : '\\\\192.168.219.112\\data\\');
                  if (nasAddress.startsWith('\\\\') && !nasAddress.endsWith('\\')) {
                    nasAddress += '\\';
                  }
                  setCurrentJob(prev => ({ ...prev, targetPath: nasAddress }));
                  alert(`백업 대상 폴더가 NAS 주소로 설정되었습니다:\n${nasAddress}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center space-x-1"
                title="NAS 네트워크 UNC 주소(\\192.168.219.112\data\)를 대상 폴더로 지정"
              >
                <span>🌐 NAS 주소 적용</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  let defaultAddress = currentJob.targetPath.startsWith('\\\\') 
                    ? currentJob.targetPath 
                    : (currentJob.nasAuth?.server ? `\\\\${currentJob.nasAuth.server}\\data\\` : '\\\\192.168.219.112\\data\\');
                  if (defaultAddress.startsWith('\\\\') && !defaultAddress.endsWith('\\')) {
                    defaultAddress += '\\';
                  }
                  const selected = prompt("NAS 백업 대상 폴더 경로를 입력하거나 지정하세요:\n(규칙: 끝에 역슬래시 \\ 자동 보장)", defaultAddress);
                  if (selected && selected.trim()) {
                    let formatted = selected.trim();
                    if (!formatted.startsWith('\\\\')) {
                      formatted = '\\\\' + formatted.replace(/^[/\\]+/, '');
                    }
                    const parts = formatted.replace(/^\\\\/, '').split(/[\\/]/).filter(Boolean);
                    if (parts.length === 1) {
                      formatted = `\\\\${parts[0]}\\data\\`;
                    } else if (!formatted.endsWith('\\')) {
                      formatted += '\\';
                    }
                    setCurrentJob(prev => ({ ...prev, targetPath: formatted }));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center space-x-1"
                title="NAS 네트워크 주소(\\192.168.219.112\data\) 내의 백업 대상 폴더 선택 및 지정"
              >
                <span>🌐 NAS 폴더 선택...</span>
              </button>

              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700/80 text-slate-200 border border-slate-600/50 text-xs font-bold transition-colors">
                <span>📁 대상 선택</span>
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    let targetFolderName = '';
                    if (files[0].webkitRelativePath) {
                      targetFolderName = files[0].webkitRelativePath.split('/')[0];
                    }
                    const inferredPath = targetFolderName ? `D:\\Backup_Storage\\${targetFolderName}` : currentJob.targetPath;
                    setCurrentJob(prev => ({
                      ...prev,
                      targetPath: inferredPath
                    }));
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={currentJob.targetPath}
              onChange={(e) => setCurrentJob((prev) => ({ ...prev, targetPath: e.target.value }))}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val.startsWith('\\\\') && !val.endsWith('\\')) {
                  setCurrentJob(prev => ({ ...prev, targetPath: val + '\\' }));
                }
              }}
              placeholder="예: D:\Backup_Storage\Projects 또는 \\\\192.168.219.112\\data\\"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono"
            />
            <div className="p-3 rounded-xl bg-slate-800/40 text-xs text-slate-400 flex items-center space-x-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>외장 하드, 로컬 디스크 및 NAS 네트워크 UNC 경로(\\\\NAS\\Backup) 모두 지원합니다.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Real File System Inspector & Pre-Backup Filter Analyzer */}
      {currentJob.realFiles && currentJob.realFiles.length > 0 && filterEvaluation && (
        <div className="bg-slate-900/90 rounded-2xl border border-blue-500/40 shadow-xl overflow-hidden">
          <div 
            onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
            className="p-4 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">실제 로컬 파일 정밀 분석 &amp; 제외 필터 시뮬레이터</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    실제 파일 {filterEvaluation.totalFiles}개 로드됨
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  현재 설정된 Robocopy 옵션(/XF, /XD, /MIN, /MAX, /MINAGE)에 따라 실제 복사 대상과 제외 대상을 실시간 시뮬레이션합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                복사 대상: {filterEvaluation.includedFiles.length}개 ({(filterEvaluation.includedBytes / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <span className="text-rose-400 font-bold bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800/60">
                제외 대상: {filterEvaluation.excludedFiles.length}개 ({(filterEvaluation.excludedBytes / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <button className="p-1 text-slate-400 hover:text-white">
                {isInspectorExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isInspectorExpanded && (
            <div className="p-4 space-y-3 bg-slate-950/60">
              {/* Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFileFilterTab('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      fileFilterTab === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    전체 파일 ({filterEvaluation.totalFiles})
                  </button>
                  <button
                    onClick={() => setFileFilterTab('included')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      fileFilterTab === 'included'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-emerald-400/80 hover:text-emerald-300 border border-slate-800'
                    }`}
                  >
                    🟢 복사 대상 ({filterEvaluation.includedFiles.length})
                  </button>
                  <button
                    onClick={() => setFileFilterTab('excluded')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      fileFilterTab === 'excluded'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-rose-400/80 hover:text-rose-300 border border-slate-800'
                    }`}
                  >
                    🔴 제외 대상 ({filterEvaluation.excludedFiles.length})
                  </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileSearchTerm}
                    onChange={(e) => setFileSearchTerm(e.target.value)}
                    placeholder="파일명 또는 경로 검색..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Real Files Table */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-900/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3 font-semibold">파일명 / 상대경로</th>
                      <th className="py-2 px-3 font-semibold w-24">크기</th>
                      <th className="py-2 px-3 font-semibold w-28">수정일</th>
                      <th className="py-2 px-3 font-semibold w-32">판정 상태</th>
                      <th className="py-2 px-3 font-semibold">사유 및 적용 규칙</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                    {filterEvaluation.annotatedFiles
                      .filter(f => {
                        if (fileFilterTab === 'included') return !f.isExcluded;
                        if (fileFilterTab === 'excluded') return f.isExcluded;
                        return true;
                      })
                      .filter(f => !fileSearchTerm || f.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) || f.relativePath.toLowerCase().includes(fileSearchTerm.toLowerCase()))
                      .slice(0, 100)
                      .map((file, idx) => (
                        <tr key={file.id || idx} className={file.isExcluded ? 'bg-rose-950/10 text-slate-400' : 'hover:bg-slate-800/40 text-slate-200'}>
                          <td className="py-1.5 px-3 truncate max-w-xs font-semibold" title={file.relativePath}>
                            {file.name}
                            <span className="block text-[10px] text-slate-500 font-normal truncate">{file.relativePath}</span>
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            {file.sizeBytes >= 1024 * 1024 
                              ? `${(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                              : `${Math.ceil(file.sizeBytes / 1024)} KB`}
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap text-slate-400">
                            {file.lastModifiedMs ? new Date(file.lastModifiedMs).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            {file.isExcluded ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                ✕ 복사 제외
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                ✓ 복사 대상
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-slate-400 truncate max-w-xs">
                            {file.isExcluded ? (
                              <span className="text-rose-400 font-sans">{file.exclusionReason}</span>
                            ) : (
                              <span className="text-emerald-400/80 font-sans">조건 충족 (정상 복사 대상)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NAS Network Authentication Assistant */}
      <NasAuthManager currentJob={currentJob} setCurrentJob={setCurrentJob} />

      {/* Robocopy Core Flags & Multithreading Section */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Robocopy 핵심 옵션 및 스레드 설정</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">자주 사용하는 복사 모드, 병렬 스레드 및 제외 필터를 빠르게 지정합니다.</p>
          </div>

          {/* Collapsible Toggle for Advanced Options (Requirement 2) */}
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border shrink-0 ${
              showAdvancedOptions
                ? 'bg-blue-950/80 text-blue-200 border-blue-500 shadow-md shadow-blue-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-blue-900/50 hover:border-blue-500'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>고급 옵션 상세 설정 (ACL/필터/대역폭) {showAdvancedOptions ? '접기 ▲' : '클릭하여 펼치기 ▼'}</span>
          </button>
        </div>

        {/* 3-Column Core Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Copy Mode & Multithreading */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
            <h3 className="text-xs font-bold text-blue-400 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>복사 모드 및 성능 스레드</span>
            </h3>

            <div className="space-y-2.5">
              <label 
                title="미러링 모드 (/MIR): 하위 폴더 포함 전체 동기화합니다. 원본에서 삭제된 파일은 대상에서도 자동 삭제됩니다."
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition-colors"
              >
                <span className="text-xs font-semibold text-slate-200">미러링 모드 (/MIR)</span>
                <input
                  type="checkbox"
                  checked={currentJob.flags.mirror}
                  onChange={(e) => {
                    updateFlag('mirror', e.target.checked);
                    if (e.target.checked) updateFlag('copySubdirsWithEmpty', false);
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label 
                title="하위 폴더 전체 복사 (/E): 빈 하위 디렉터리를 포함하여 모든 하위 구조를 복사합니다 (대상 파일 삭제 안 함)."
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition-colors"
              >
                <span className="text-xs font-semibold text-slate-200">하위 폴더 전체 복사 (/E)</span>
                <input
                  type="checkbox"
                  checked={currentJob.flags.copySubdirsWithEmpty}
                  onChange={(e) => {
                    updateFlag('copySubdirsWithEmpty', e.target.checked);
                    if (e.target.checked) updateFlag('mirror', false);
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              {/* Multithreading slider */}
              <div 
                title="멀티스레드 병렬 복사 (/MT): 동시에 여러 파일을 병렬 복사합니다 (NVMe/SSD는 16~32 스레드 권장)."
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/60 space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">병렬 스레드 수 (/MT)</span>
                  <span className="font-mono text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                    {currentJob.flags.threads} Threads
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="64"
                  value={currentJob.flags.threads}
                  onChange={(e) => updateFlag('threads', parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 (단일)</span>
                  <span>16 (권장)</span>
                  <span>64 (초고속 NVMe)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Reliability Options */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
            <h3 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>네트워크 &amp; 안전성 모드</span>
            </h3>

            <div className="space-y-2.5">
              <label 
                title="재개 가능 백업 모드 (/ZB): 네트워크 끊김 시 자동 재개하며, 접근 권한 거부 시 Windows 백업 모드로 전환하여 잠긴 파일을 복사합니다."
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition-colors"
              >
                <span className="text-xs font-semibold text-slate-200">재개 가능 백업 모드 (/ZB)</span>
                <input
                  type="checkbox"
                  checked={currentJob.flags.restartableBackupMode}
                  onChange={(e) => updateFlag('restartableBackupMode', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label 
                title="FAT 시간차 허용 (/FFT): NAS/Linux 파일 시스템과의 2초 타임스탬프 오차를 허용하여 불필요한 전체 재복사를 방지합니다."
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition-colors"
              >
                <span className="text-xs font-semibold text-slate-200">FAT 시간차 허용 (/FFT)</span>
                <input
                  type="checkbox"
                  checked={currentJob.flags.fft}
                  onChange={(e) => updateFlag('fft', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div 
                  title="재시도 횟수 (/R:n): 오류 발생 시 재시도할 횟수를 지정합니다 (기본 2회 권장)."
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60"
                >
                  <span className="text-[11px] text-slate-400 block mb-1">재시도 횟수 (/R)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentJob.flags.retryCount}
                    onChange={(e) => updateFlag('retryCount', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                  />
                </div>
                <div 
                  title="재시도 대기 시간 (/W:n): 오류 재시도 간 대기할 시간(초)을 지정합니다 (기본 3초 권장)."
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60"
                >
                  <span className="text-[11px] text-slate-400 block mb-1">대기 시간 (초) (/W)</span>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={currentJob.flags.waitTime}
                    onChange={(e) => updateFlag('waitTime', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Exclusion Filters (/XF & /XD) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                <X className="w-3.5 h-3.5" />
                <span>제외 파일 &amp; 폴더 필터 (/XF, /XD)</span>
              </h3>
            </div>

            {/* Exclude Files */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">파일 패턴 (/XF)</span>
                <span className="text-slate-400 text-[10px]">클릭으로 추가/제거</span>
              </div>

              {/* Predefined File Pattern Tags */}
              <div className="flex flex-wrap gap-1 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/60">
                {PRESET_FILE_PATTERNS.slice(0, 6).map((item) => {
                  const isActive = currentJob.flags.excludeFiles.some(f => f.toLowerCase() === item.pattern.toLowerCase());
                  return (
                    <button
                      key={item.pattern}
                      type="button"
                      title={item.label}
                      onClick={() => togglePresetFilePattern(item.pattern)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex items-center space-x-0.5 border ${
                        isActive
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 font-semibold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span>{isActive ? '✓' : '+'}</span>
                      <span>{item.pattern}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={newExFile}
                  onChange={(e) => setNewExFile(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExcludeFile()}
                  placeholder="직접 입력: *.tmp"
                  className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
                <button
                  onClick={addExcludeFile}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>추가</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {currentJob.flags.excludeFiles.length === 0 && (
                  <span className="text-[11px] text-slate-500 italic">선택된 파일 제외 항목 없음</span>
                )}
                {currentJob.flags.excludeFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-blue-300 text-[11px] font-mono border border-slate-700"
                  >
                    <span>{file}</span>
                    <button onClick={() => removeExcludeFile(idx)} className="hover:text-red-400 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Exclude Dirs */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">디렉터리 패턴 (/XD)</span>
                <span className="text-slate-400 text-[10px]">클릭으로 추가/제거</span>
              </div>

              {/* Predefined Dir Pattern Tags */}
              <div className="flex flex-wrap gap-1 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/60">
                {PRESET_DIR_PATTERNS.slice(0, 6).map((item) => {
                  const isActive = currentJob.flags.excludeDirs.some(d => d.toLowerCase() === item.pattern.toLowerCase());
                  return (
                    <button
                      key={item.pattern}
                      type="button"
                      onClick={() => togglePresetDirPattern(item.pattern)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex items-center space-x-0.5 border ${
                        isActive
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60 font-semibold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span>{isActive ? '✓' : '+'}</span>
                      <span>{item.pattern}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={newExDir}
                  onChange={(e) => setNewExDir(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExcludeDir()}
                  placeholder="직접 입력: node_modules"
                  className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
                <button
                  onClick={addExcludeDir}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>추가</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {currentJob.flags.excludeDirs.length === 0 && (
                  <span className="text-[11px] text-slate-500 italic">선택된 디렉터리 제외 항목 없음</span>
                )}
                {currentJob.flags.excludeDirs.map((dir, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-emerald-300 text-[11px] font-mono border border-slate-700"
                  >
                    <span>{dir}</span>
                    <button onClick={() => removeExcludeDir(idx)} className="hover:text-red-400 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* 4. Collapsible Advanced Options Detail Hub (Requirement 2: Click to view under basic options) */}
        {showAdvancedOptions && (
          <div className="pt-3 border-t border-slate-800/80 animate-fadeIn">
            <AdvancedRobocopyMenu
              flags={currentJob.flags}
              onUpdateFlag={updateFlag}
              onApplyPresetFlags={handleApplyPresetFlags}
            />
          </div>
        )}
      </div>

      {/* Robocopy Live Command Output Bar */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>실시간 생성된 Robocopy 명령어</span>
          </span>
          <button
            onClick={handleCopyCommand}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? '복사됨!' : '명령어 복사'}</span>
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-sm text-emerald-400 overflow-x-auto select-all">
          {command}
        </div>
      </div>

    </div>
  );
};
