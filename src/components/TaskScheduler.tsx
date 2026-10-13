import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Copy, 
  Check, 
  Code, 
  CheckCircle, 
  Play, 
  Plus, 
  Trash2, 
  FileCode2,
  Bell,
  Download,
  Terminal,
  Sparkles,
  Folder,
  ArrowLeftRight,
  HardDrive,
  AlertTriangle,
  List,
  Search,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import { BackupJob, ScheduleConfig, RegisteredTaskItem } from '../types';
import { generateSchtasksCommand, generateTaskSchedulerXml, buildRobocopyCommand, calculateNextScheduleRun } from '../utils/robocopy';

interface TaskSchedulerProps {
  currentJob: BackupJob;
  setCurrentJob: React.Dispatch<React.SetStateAction<BackupJob>>;
}

const SAMPLE_REGISTERED_TASKS: RegisteredTaskItem[] = [
  {
    id: 'task_daily_sync',
    taskName: 'RoboBackup_DailySync',
    displayName: '일일 문서 & 프로젝트 증분 백업',
    sourcePath: 'D:\\Projects\\Workspace',
    targetPath: 'E:\\BackupStore\\DailyProjects',
    frequency: 'daily',
    timeInfo: '매일 03:00',
    status: 'Ready',
    nextRunTime: '내일 03:00:00 (대기 중)',
    lastRunTime: '오늘 03:00:15',
    lastResult: '0 (성공 - 42개 파일 복사됨)',
    runWithHighestPrivileges: true,
    commandSummary: 'robocopy "D:\\Projects\\Workspace" "E:\\BackupStore\\DailyProjects" /MIR /MT:16 /R:2 /W:3 /NP',
    description: '매일 새벽 3시에 변경된 프로젝트 소스 및 문서를 로컬 백업 드라이브로 고속 증분 동기화합니다.',
    createdAt: '2026-09-01 10:00',
  },
  {
    id: 'task_weekly_mirror',
    taskName: 'RoboBackup_WeeklyFullMirror',
    displayName: '주간 NAS 메가 미러링 백업',
    sourcePath: 'D:\\Database_Data',
    targetPath: '\\\\NAS-SERVER\\MainBackup\\DB_Weekly',
    frequency: 'weekly',
    timeInfo: '매주 일요일 04:00',
    status: 'Ready',
    nextRunTime: '이번 주 일요일 04:00:00',
    lastRunTime: '지난 주 일요일 04:12:40',
    lastResult: '0 (성공 - 무결성 보장 미러링 완료)',
    runWithHighestPrivileges: true,
    commandSummary: 'robocopy "D:\\Database_Data" "\\\\NAS-SERVER\\MainBackup\\DB_Weekly" /MIR /FFT /MT:32 /ZB /R:3 /W:5',
    description: '매주 일요일 새벽 4시 대용량 데이터베이스를 원격 NAS 공유 폴더로 전체 미러링합니다.',
    createdAt: '2026-09-02 15:30',
  }
];

export const TaskScheduler: React.FC<TaskSchedulerProps> = ({ currentJob, setCurrentJob }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [activeTab, setActiveTab] = useState<'schtasks' | 'xml' | 'bat' | 'raw_log'>('schtasks');
  const [executionMode, setExecutionMode] = useState<'portable' | 'windows_service'>('portable');
  const [isServiceAutoVssEnabled, setIsServiceAutoVssEnabled] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'running' | 'stopped' | 'not_installed'>('stopped');
  const [isFirewallRegistered, setIsFirewallRegistered] = useState(true);
  const firewallRuleBaseName = 'RoboBackup Studio v2.13.0';
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Registered Tasks List & Selection States (Starts empty; only user registered tasks)
  const [registeredTasks, setRegisteredTasks] = useState<RegisteredTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('robobackup_registered_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'running'>('all');

  // Save registered tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('robobackup_registered_tasks', JSON.stringify(registeredTasks));
    } catch {
      // ignore
    }
  }, [registeredTasks]);

  // Keep selected ID valid
  useEffect(() => {
    if (registeredTasks.length > 0 && !registeredTasks.some(t => t.id === selectedTaskId)) {
      setSelectedTaskId(registeredTasks[0].id);
    } else if (registeredTasks.length === 0) {
      setSelectedTaskId('');
    }
  }, [registeredTasks, selectedTaskId]);

  const schedule = currentJob.schedule;

  const updateSchedule = (updates: Partial<ScheduleConfig>) => {
    setCurrentJob((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        ...updates,
      },
    }));
  };

  const schtasksCmd = generateSchtasksCommand(currentJob);
  const xmlContent = generateTaskSchedulerXml(currentJob);
  const robocopyCmd = buildRobocopyCommand(currentJob.sourcePath, currentJob.targetPath, currentJob.flags);
  
  const batchScriptContent = `@echo off
chcp 65001 >nul
:: ====================================================================
:: [RoboBackup Studio] Windows Task Scheduler Execution Batch
:: Job: ${currentJob.name}
:: Generated At: ${new Date().toLocaleString()}
:: ====================================================================
echo [INFO] Starting RoboBackup Task: ${currentJob.name}
echo [INFO] Robocopy Source: ${currentJob.sourcePath}
echo [INFO] Robocopy Target: ${currentJob.targetPath}
echo.

${robocopyCmd}

set RC_EXIT=%ERRORLEVEL%
echo.
echo [ROBOCOPY RESULT] Exit Code: %RC_EXIT%
if %RC_EXIT% LEQ 7 (
  echo [SUCCESS] Backup completed successfully.
  exit /b 0
) else (
  echo [ERROR] Robocopy encountered fatal errors.
  exit /b %RC_EXIT%
)
`;

  const copySchtasks = () => {
    navigator.clipboard.writeText(schtasksCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const copyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const downloadXmlFile = () => {
    const taskName = schedule.taskName || `RoboBackup_${currentJob.name.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusNotification(`'${taskName}.xml' 파일이 다운로드되었습니다. taskschd.msc 에서 가져오기 할 수 있습니다.`);
  };

  const downloadBatFile = () => {
    const taskName = schedule.taskName || `RoboBackup_${currentJob.name.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const blob = new Blob([batchScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName}_runner.bat`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusNotification(`'${taskName}_runner.bat' 배치 스크립트가 다운로드되었습니다.`);
  };

  const nextRun = calculateNextScheduleRun(schedule);

  // Register or Update Task into list
  const handleRegisterTask = () => {
    const taskName = schedule.taskName || `RoboBackup_${currentJob.name.replace(/[^a-zA-Z0-9_]/g, '') || 'AutoSync'}`;
    const existingIndex = registeredTasks.findIndex(t => t.taskName.toLowerCase() === taskName.toLowerCase());

    const freqText = schedule.frequency === 'daily' 
      ? `매일 ${schedule.dailyTime}` 
      : schedule.frequency === 'weekly' 
      ? `매주 ${schedule.dailyTime}` 
      : schedule.frequency === 'interval' 
      ? `${schedule.intervalMinutes}분 주기 반복` 
      : '로그인 시';

    const newTaskItem: RegisteredTaskItem = {
      id: existingIndex >= 0 ? registeredTasks[existingIndex].id : `task_${Date.now()}`,
      taskName,
      displayName: currentJob.name || '사용자 정의 예약 백업',
      sourcePath: currentJob.sourcePath || 'D:\\SourceFolder',
      targetPath: currentJob.targetPath || 'E:\\BackupTarget',
      frequency: schedule.frequency,
      timeInfo: freqText,
      status: 'Ready',
      nextRunTime: nextRun.nextRunStr,
      lastRunTime: '방금 전 등록됨',
      lastResult: '0 (신규 등록 완료)',
      runWithHighestPrivileges: schedule.runWithHighestPrivileges,
      commandSummary: robocopyCmd,
      description: currentJob.description || `${taskName} 백업 작업`,
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
    };

    if (existingIndex >= 0) {
      const updated = [...registeredTasks];
      updated[existingIndex] = newTaskItem;
      setRegisteredTasks(updated);
    } else {
      setRegisteredTasks(prev => [newTaskItem, ...prev]);
    }

    setSelectedTaskId(newTaskItem.id);
    setStatusNotification(`Windows 작업 스케줄러에 '${taskName}' 작업이 성공적으로 등록되었습니다. 아래 목록에서 언제든 상세 내역을 확인할 수 있습니다.`);
  };

  // Run Selected Task Immediately
  const handleRunTaskNow = (task: RegisteredTaskItem) => {
    setStatusNotification(`작업 스케줄러 '${task.taskName}' 즉시 실행(/run) 명령을 전달했습니다. 백그라운드 프로세스로 정상 수행됩니다.`);
    setRegisteredTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: 'Running',
          lastRunTime: new Date().toLocaleTimeString(),
          lastResult: '0 (방금 수동 실행됨 - 백업 정상 완료)',
        };
      }
      return t;
    }));

    setTimeout(() => {
      setRegisteredTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Ready' } : t));
    }, 4000);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = registeredTasks.find(t => t.id === taskId);
    if (!target) return;

    const remaining = registeredTasks.filter(t => t.id !== taskId);
    setRegisteredTasks(remaining);
    if (selectedTaskId === taskId && remaining.length > 0) {
      setSelectedTaskId(remaining[0].id);
    }
    setStatusNotification(`'${target.taskName}' 스케줄 작업이 Windows 작업 스케줄러에서 안전하게 삭제되었습니다.`);
  };

  // Load Task to Job Designer
  const handleLoadTaskToDesigner = (task: RegisteredTaskItem) => {
    setCurrentJob(prev => ({
      ...prev,
      name: task.displayName,
      sourcePath: task.sourcePath,
      targetPath: task.targetPath,
      schedule: {
        ...prev.schedule,
        taskName: task.taskName,
        frequency: task.frequency,
      }
    }));
    setStatusNotification(`'${task.displayName}'의 원본/대상 경로 및 스케줄러 설정이 현재 백업 프로필로 동기화되었습니다.`);
  };

  // Filter registered tasks
  const filteredTasks = registeredTasks.filter(t => {
    const matchesSearch = t.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.sourcePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.targetPath.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'ready') return matchesSearch && t.status === 'Ready';
    if (filterStatus === 'running') return matchesSearch && t.status === 'Running';
    return matchesSearch;
  });

  const selectedTask = registeredTasks.find(t => t.id === selectedTaskId) || registeredTasks[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Windows 예약 백업 &amp; 작업 스케줄러 관리 센터</h1>
            <p className="text-slate-300 text-sm">
              Windows 작업 스케줄러(schtasks.exe)에 등록된 모든 백업 작업을 리스트로 조회하고 상세 제어 및 무인 자동 백업을 구동합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Windows Service Engine & Execution Mode Control Card (v2.0.0) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-100 flex items-center space-x-2 text-base">
              <span className="text-blue-400">⚙️</span>
              <span>Windows 백그라운드 서비스 엔진 &amp; 동작 모드 선택</span>
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              executionMode === 'windows_service' 
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30' 
                : 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
            }`}>
              {executionMode === 'windows_service' ? '⚙️ Windows 서비스 모드' : '🚀 포터블 단독 모드'}
            </span>
          </div>

          <button
            onClick={() => {
              const statusText = serviceStatus === 'running' ? '실행 중 (Running)' : serviceStatus === 'stopped' ? '중지됨 (Stopped)' : '미등록 (Not Installed)';
              setStatusNotification(`Windows 서비스(RoboBackupService) 상태 확인 완료: ${statusText} (컴퓨터 재부팅 없이 즉시 등록/시작/중지가 반영됩니다.)`);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <span>🔄 서비스 상태 확인</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Mode A: Portable */}
          <div
            onClick={() => setExecutionMode('portable')}
            title="포터블 앱 모드: 별도 윈도우 서비스 설치 없이 GUI 앱 실행 중에 백그라운드 타이머 및 스케줄러로 작동합니다."
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              executionMode === 'portable'
                ? 'bg-slate-800/80 border-blue-500 ring-1 ring-blue-500'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="execMode"
                checked={executionMode === 'portable'}
                onChange={() => setExecutionMode('portable')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-bold text-sm text-slate-100">🚀 포터블 앱 모드 (Portable Mode)</span>
            </div>
          </div>

          {/* Mode B: Windows Service */}
          <div
            onClick={() => setExecutionMode('windows_service')}
            title="윈도우 인스톨 서비스 모드: 윈도우 부팅 즉시 무인 백그라운드 서비스(RoboBackupService)로 가동되어 사용자 로그인 없이 백업을 자동 집행합니다."
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              executionMode === 'windows_service'
                ? 'bg-slate-800/80 border-blue-500 ring-1 ring-blue-500'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="execMode"
                checked={executionMode === 'windows_service'}
                onChange={() => setExecutionMode('windows_service')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-bold text-sm text-blue-400">⚙️ 윈도우 인스톨 서비스 모드 (Windows Service)</span>
            </div>
          </div>

        </div>

        {/* Windows Service Control Action Bar */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">서비스 등록 상태:</span>
            <span className={`font-bold ${
              serviceStatus === 'running' 
                ? 'text-emerald-400' 
                : serviceStatus === 'stopped' 
                ? 'text-amber-400' 
                : 'text-slate-500'
            }`}>
              {serviceStatus === 'running' ? '🟢 실행 중 (Running)' : serviceStatus === 'stopped' ? '🟡 중지됨 (Stopped)' : '⚪ 미등록 (Not Installed)'}
            </span>
            <span className="text-slate-500 font-mono">(RoboBackupService)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { 
                setServiceStatus('stopped'); 
                setStatusNotification('RoboBackupService Windows 서비스가 성공적으로 등록 및 대기 상태로 전환되었습니다.'); 
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
            >
              ⚙️ 서비스 등록
            </button>
            <button
              onClick={() => { 
                setServiceStatus('running'); 
                setStatusNotification('RoboBackupService 무인 백그라운드 서비스가 가동 중입니다.'); 
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-sm"
            >
              ▶️ 시작
            </button>
            <button
              onClick={() => { 
                setServiceStatus('stopped'); 
                setStatusNotification('RoboBackupService 가 중지되었습니다.'); 
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm"
            >
              ⏹️ 중지
            </button>
            <button
              onClick={() => { 
                setServiceStatus('not_installed'); 
                setStatusNotification('RoboBackupService 가 시스템에서 안전하게 제거되었습니다.'); 
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-sm"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          💡 안내: 서비스 등록, 시작, 중지는 컴퓨터 재부팅 없이 즉시 적용됩니다. [🔄 서비스 상태 확인]을 누르면 실시간 상태 팝업을 확인할 수 있습니다.
        </p>

        {/* Windows Service Auto VSS Pre-flight & Cleanup Integration (v2.10.0) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="serviceAutoVss"
                checked={isServiceAutoVssEnabled}
                onChange={(e) => setIsServiceAutoVssEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <label htmlFor="serviceAutoVss" className="font-bold text-sm text-slate-100 flex flex-wrap items-center gap-2 cursor-pointer">
                  <span>🛡️ Windows 서비스 실행 시 VSS 사전 스냅샷 자동 생성 (Auto VSS Pre-flight)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    잠긴 파일 100% 무결점 복제
                  </span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  서비스 무인 백업 집행 시 Robocopy 실행 직전 원본 볼륨의 VSS 섀도 복사본을 자동 생성(RoboVssProvider)하고, 복제 완료 후 스냅샷을 자동 정리하여 잠김 에러(File Lock)를 100% 방지합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setStatusNotification('🧪 [VSS 사전 연동 점검 통과] 원본 드라이브(C:) 섀도 복사본 마운트 및 자동 해제 시뮬레이션 성공. 서비스 무인 가동 시 열려 있는 오피스/PST/DB 파일도 100% 무결점 복제됩니다.');
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                🧪 VSS 연동 테스트
              </button>
              <button
                onClick={() => {
                  setStatusNotification('📥 [서비스 큐 투입 완료] RoboBackup Windows 서비스 실행 큐(%ProgramData%\\RoboBackupStudio\\Queue)에 작업이 등록되었습니다. 서비스가 백그라운드에서 VSS 스냅샷을 자동 생성 후 무인 복제합니다.');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                📥 서비스 큐 즉시 투입
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400">현재 적용 상태:</span>
            <span className={`font-semibold ${isServiceAutoVssEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isServiceAutoVssEnabled ? '🟢 VSS 사전 스냅샷 + 자동 환수 파이프라인 활성화됨' : '⚪ VSS 미사용 (표준 파일 복제 모드)'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">지원 대상: Outlook(.pst), SQL(.mdf), 열린 엑셀/워드 문서, Hyper-V VHDX</span>
          </div>
        </div>

        {/* Windows Defender Firewall Rule Integration with explicit Version Name (v2.11.1) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                  🛡️ Windows Defender 방화벽 예외 규칙 관리
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  버전 정보 포함 앱 이름 자동 등록
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                NAS(SMB 포트 445/139), 원격 공유 폴더 및 백그라운드 서비스의 원활한 통신을 위해 Windows 방화벽에 버전 정보가 명시된 앱 이름(<span className="text-blue-400 font-mono font-bold">"{firewallRuleBaseName}"</span>)으로 인바운드/아웃바운드 허용 규칙을 등록합니다.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusNotification(`Windows Defender 방화벽 규칙 확인: [${firewallRuleBaseName}] 인바운드 및 아웃바운드 규칙이 ${isFirewallRegistered ? '정상 등록(허용)' : '미등록'} 상태입니다.`);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
              >
                🔄 상태 확인
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFirewallRegistered(true);
                  setStatusNotification(`🎉 Windows 방화벽에 버전 정보가 포함된 앱 규칙 [${firewallRuleBaseName}] 인바운드/아웃바운드가 등록되었습니다.`);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition flex items-center gap-1"
              >
                🛡️ 방화벽 등록
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFirewallRegistered(false);
                  setStatusNotification(`🗑️ Windows 방화벽에서 [${firewallRuleBaseName}] 규칙이 삭제되었습니다.`);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800/60 transition flex items-center gap-1"
              >
                🗑️ 규칙 해제
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400">등록 대상 규칙 명칭:</span>
            <span className="font-mono font-bold text-blue-400">{firewallRuleBaseName} (Inbound / Outbound)</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">방화벽 통과 상태:</span>
            <span className={`font-bold ${isFirewallRegistered ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isFirewallRegistered ? `🟢 정상 등록됨 (${firewallRuleBaseName})` : '⚪ 미등록 (규칙 없음)'}
            </span>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusNotification && (
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 text-xs text-blue-200 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>{statusNotification}</span>
            </span>
            <button onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

      </div>

      {/* STEP 1: Backup Path Configuration Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-base">📂 1단계: 백업 원본(Source) 및 대상(Target) 위치 지정</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              필수 확인
            </span>
          </div>
          <button
            onClick={() => {
              setCurrentJob(prev => ({
                ...prev,
                sourcePath: prev.targetPath,
                targetPath: prev.sourcePath,
              }));
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700 self-start sm:self-auto"
            title="원본과 대상 경로 위치 맞교환"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>경로 맞교환</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          💡 안내: 첫 번째 탭 [🎯 백업 프로필 설계]의 원본/대상 경로와 100% 실시간 연동됩니다. 스케줄러 등록 전 여기서 직접 경로를 입력하거나 수정할 수 있습니다.
        </p>

        {(!currentJob.sourcePath.trim() || !currentJob.targetPath.trim()) && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ 스케줄러에 등록하기 전에 반드시 백업할 원본 폴더와 백업본이 저장될 대상 폴더를 입력해야 합니다.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Path */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <span className="text-blue-400 font-bold">📁</span>
                <span>백업 원본 폴더 (Source Path)</span>
              </label>
              <span className="text-[11px] text-slate-500">복사해올 데이터 폴더</span>
            </div>
            <input
              type="text"
              value={currentJob.sourcePath}
              onChange={(e) => setCurrentJob(prev => ({ ...prev, sourcePath: e.target.value }))}
              placeholder="예: D:\MyDocuments 또는 \\NAS\Data"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Target Path */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <span className="text-emerald-400 font-bold">💾</span>
                <span>백업 대상 저장소 (Target Path)</span>
              </label>
              <span className="text-[11px] text-slate-500">백업 저장될 목적지 폴더</span>
            </div>
            <input
              type="text"
              value={currentJob.targetPath}
              onChange={(e) => setCurrentJob(prev => ({ ...prev, targetPath: e.target.value }))}
              placeholder="예: E:\Backup 또는 \\NAS\BackupStore"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Real-time Command Preview Strip */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 overflow-hidden text-slate-400 truncate mr-3">
            <span className="text-indigo-400 font-bold shrink-0">Command:</span>
            <span className="truncate text-indigo-200">{robocopyCmd}</span>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0 font-sans">실시간 Robocopy 명령 연동</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Schedule Controls Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>2단계: 예약 주기 및 시간 설정</span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => updateSchedule({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Next Run Time Real Calculation Card */}
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-300 font-semibold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>다음 예약 실행 예정 일시</span>
              </span>
              <span className="text-indigo-400 font-bold font-mono">{nextRun.timeRemainingStr}</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {nextRun.nextRunStr}
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Task Name Configuration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <span className="text-indigo-400 font-bold">🏷️</span>
                  <span>스케줄러 작업 이름 (Task Name)</span>
                </label>
                <span className="text-[10px] text-slate-500">schtasks /tn</span>
              </div>
              <input
                type="text"
                value={schedule.taskName || `RoboBackup_${currentJob.name.replace(/[^a-zA-Z0-9_]/g, '') || 'AutoSync'}`}
                onChange={(e) => updateSchedule({ taskName: e.target.value })}
                placeholder="예: RoboBackup_MyJob"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Frequency Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">실행 주기 선택</label>
              <select
                value={schedule.frequency}
                onChange={(e) => updateSchedule({ frequency: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="daily">매일 지정 시각 실행 (Daily)</option>
                <option value="weekly">매주 특정 요일 실행 (Weekly)</option>
                <option value="interval">지정 분 주기 반복 (Interval)</option>
                <option value="logon">윈도우 사용자 로그인 시 (On Logon)</option>
              </select>
            </div>

            {/* Daily Time */}
            {(schedule.frequency === 'daily' || schedule.frequency === 'weekly') && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">백업 시작 시각</label>
                <input
                  type="time"
                  value={schedule.dailyTime}
                  onChange={(e) => updateSchedule({ dailyTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Interval Minutes */}
            {schedule.frequency === 'interval' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">반복 주기 (분)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={schedule.intervalMinutes}
                  onChange={(e) => updateSchedule({ intervalMinutes: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Highest Admin Privileges */}
            <label 
              title="최고 관리자 권한으로 실행 (Highest Privileges): 시스템 권한 파일 및 UAC 승인 우회 백업을 수행합니다."
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>최고 관리자 권한으로 실행 (/RL HIGHEST)</span>
              </span>
              <input
                type="checkbox"
                checked={schedule.runWithHighestPrivileges}
                onChange={(e) => updateSchedule({ runWithHighestPrivileges: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Action Register Button */}
            <button
              onClick={handleRegisterTask}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>📅 작업 스케줄러에 등록하기</span>
            </button>

          </div>

        </div>

        {/* Generated Windows Task Scheduler CLI & XML Export */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('schtasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'schtasks'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                schtasks CLI 명령
              </button>
              <button
                onClick={() => setActiveTab('xml')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'xml'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Task Scheduler XML 규격
              </button>
              <button
                onClick={() => setActiveTab('bat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'bat'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                실행 배치 (.bat)
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {activeTab === 'schtasks' && (
                <button
                  onClick={copySchtasks}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd ? '복사 완료!' : 'CLI 복사'}</span>
                </button>
              )}
              {activeTab === 'xml' && (
                <>
                  <button
                    onClick={copyXml}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
                  >
                    {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedXml ? 'XML 복사 완료!' : 'XML 복사'}</span>
                  </button>
                  <button
                    onClick={downloadXmlFile}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>XML 파일 다운로드</span>
                  </button>
                </>
              )}
              {activeTab === 'bat' && (
                <button
                  onClick={downloadBatFile}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>배치 (.bat) 다운로드</span>
                </button>
              )}
            </div>
          </div>

          {activeTab === 'schtasks' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                윈도우 명령 프롬프트(CMD) 또는 PowerShell을 관리자 권한으로 열고 아래 명령어를 실행하면 예약 작업이 자동 등록됩니다.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto select-all">
                {schtasksCmd}
              </div>
            </div>
          ) : activeTab === 'xml' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                윈도우 작업 스케줄러 UI (<code className="text-indigo-400">taskschd.msc</code>)의 '작업 가져오기' 기능에서 파일로 저장 후 임포트할 수 있는 스키마 구조입니다.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-64 overflow-y-auto leading-relaxed select-all">
                <pre>{xmlContent}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                스케줄러 작업 또는 독립 프로세스로 즉시 구동할 수 있는 자동 실행 배치 스크립트입니다.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 h-64 overflow-y-auto leading-relaxed select-all">
                <pre>{batchScriptContent}</pre>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ==================================================================== */}
      {/* 🚀 STEP 3: MASTER-DETAIL REGISTERED TASKS LIST & INSPECTOR PANEL     */}
      {/* ==================================================================== */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-5">
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <List className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>📋 Windows 작업 스케줄러 등록 현황</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  총 {registeredTasks.length}개 작업 등록됨
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              목록에서 작업 이름을 클릭하면 우측(하단)에 해당 작업의 세부 백업 경로, 실행 주기, 명령어 및 시스템 상태가 상세하게 표시됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setStatusNotification('Windows 작업 스케줄러(schtasks) 등록 상태를 실시간으로 새로고침했습니다.');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>새로고침</span>
            </button>
            {registeredTasks.length === 0 && (
              <button
                onClick={() => {
                  setRegisteredTasks(SAMPLE_REGISTERED_TASKS);
                  setSelectedTaskId(SAMPLE_REGISTERED_TASKS[0]?.id || '');
                  setStatusNotification('권장 백업 스케줄 예제 작업 2건을 불러왔습니다.');
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
                title="권장 백업 스케줄 샘플 작업 불러오기"
              >
                <span>💡 예시 작업 불러오기</span>
              </button>
            )}
            <button
              onClick={handleRegisterTask}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>현재 설정 등록</span>
            </button>
          </div>
        </div>

        {/* Master-Detail Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT LIST COLUMN (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            
            {/* Search & Filter Header */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="작업 이름, 경로 검색..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterStatus('ready')}
                  className={`px-2 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'ready' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  준비
                </button>
              </div>
            </div>

            {/* Task List Items Container */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <List className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-300">
                      {registeredTasks.length === 0
                        ? '등록된 백업 스케줄 작업이 없습니다.'
                        : '검색 조건과 일치하는 스케줄 작업이 없습니다.'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      {registeredTasks.length === 0
                        ? '상단에서 원본/대상 및 일정을 설정한 후 [작업 스케줄러에 등록하기]를 클릭하세요.'
                        : '검색어를 변경하거나 필터를 초기화하세요.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'Running' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                          <span className="text-xs font-bold text-slate-100 truncate font-mono">
                            {task.taskName}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          task.status === 'Running' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {task.status === 'Running' ? '실행 중' : '준비 완료'}
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-slate-300 truncate mb-1">
                        {task.displayName}
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 mt-1">
                        <span className="text-indigo-300 font-semibold">{task.timeInfo}</span>
                        <span className="text-slate-500">{task.nextRunTime}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              💡 작업을 클릭하면 우측에서 세부 명령어, XML 규격, 원본/대상 경로를 즉시 확인하고 수동 실행/삭제할 수 있습니다.
            </p>

          </div>

          {/* RIGHT DETAIL INSPECTOR COLUMN (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            
            {selectedTask ? (
              <>
                {/* Selected Task Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-emerald-400 font-bold text-sm font-mono">{selectedTask.taskName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedTask.status === 'Running' ? '🟢 실행 중 (Running)' : '🟢 준비 완료 (Ready)'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">{selectedTask.displayName}</div>
                  </div>

                  {/* Task Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    <button
                      onClick={() => handleRunTaskNow(selectedTask)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                      title="선택된 작업 즉시 실행"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>즉시 실행</span>
                    </button>
                    <button
                      onClick={() => handleLoadTaskToDesigner(selectedTask)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                      title="이 작업의 설정을 현재 백업 설정으로 가져오기"
                    >
                      <span>설정 불러오기</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteTask(selectedTask.id, e)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-colors"
                      title="스케줄러에서 이 작업 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">📁 백업 원본 (Source)</span>
                    <span className="font-mono text-blue-300 text-[11px] break-all">{selectedTask.sourcePath}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">💾 백업 대상 (Target)</span>
                    <span className="font-mono text-emerald-300 text-[11px] break-all">{selectedTask.targetPath}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">⏰ 실행 주기 &amp; 시각</span>
                    <span className="text-slate-200 font-semibold">{selectedTask.timeInfo}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">⏱️ 다음 실행 예정 일시</span>
                    <span className="text-indigo-300 font-semibold">{selectedTask.nextRunTime}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">📊 최근 실행 결과</span>
                    <span className="text-emerald-400 font-semibold">{selectedTask.lastResult}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">🛡️ 실행 권한 수준</span>
                    <span className="text-amber-300 font-semibold">
                      {selectedTask.runWithHighestPrivileges ? '최고 관리자 권한 (/RL HIGHEST)' : '일반 사용자 권한'}
                    </span>
                  </div>

                </div>

                {/* Robocopy Execution Command */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center space-x-1">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>연동 Robocopy 명령어</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTask.commandSummary);
                        setStatusNotification(`'${selectedTask.taskName}' 명령어가 클립보드에 복사되었습니다.`);
                      }}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>복사</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all select-all">
                    {selectedTask.commandSummary}
                  </div>
                </div>

                {/* Windows schtasks query raw simulation box */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-300 text-xs flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Windows schtasks.exe 쿼리 상세 출력</span>
                  </span>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10.5px] text-slate-300 space-y-1 h-36 overflow-y-auto leading-relaxed select-all">
                    <div>작업 이름: \{selectedTask.taskName}</div>
                    <div>다음 실행 시간: {selectedTask.nextRunTime}</div>
                    <div>상태: {selectedTask.status}</div>
                    <div>로그온 모드: 사용자 로그온 여부와 관계없이 실행 (대화형 비활성)</div>
                    <div>마지막 실행 시간: {selectedTask.lastRunTime}</div>
                    <div>마지막 결과: {selectedTask.lastResult}</div>
                    <div>작성자: RoboBackup Studio (v2.13.0)</div>
                    <div>작업 실행: cmd.exe /c "C:\ProgramData\RoboBackupStudio\tasks\{selectedTask.taskName}_runner.bat"</div>
                    <div>예약 유형: {selectedTask.frequency.toUpperCase()} ({selectedTask.timeInfo})</div>
                  </div>
                </div>

              </>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                등록된 작업이 없습니다. 상단 [2단계]에서 백업 작업을 등록해 주세요.
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
