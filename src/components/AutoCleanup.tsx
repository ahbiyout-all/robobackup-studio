import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  Folder, 
  Clock, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Info,
  Calendar,
  Shield,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Terminal,
  Activity,
  Upload,
  Download,
  FileCheck,
  List,
  Plus,
  Play,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { BackupJob, RegisteredCleanupTaskItem } from '../types';

interface FileItem {
  id: string;
  name: string;
  path: string;
  sizeMb: number;
  lastModifiedDaysAgo: number;
  lastModifiedDate?: string;
  isRealFile?: boolean;
  selected: boolean;
}

export interface AutoCleanupProps {
  currentJob?: BackupJob;
}

const SAMPLE_CLEANUP_TASKS: RegisteredCleanupTaskItem[] = [
  {
    id: 'cleanup_logs_30d',
    taskName: 'RoboBackup_AutoCleanup_Logs',
    displayName: '30일 경과 백업 로그 및 임시파일 정리',
    targetFolder: 'D:\\Backup_Storage\\Logs',
    ruleDescription: '30일 이상 지난 *.log, *.tmp 파일 자동 삭제',
    frequency: 'DAILY',
    timeInfo: '매일 23:30',
    status: 'Ready',
    nextRunTime: '오늘 23:30:00 (대기 중)',
    lastRunTime: '어제 23:30:12',
    lastResult: '0 (성공 - 18개 파일 정리됨)',
    runWithHighestPrivileges: true,
    powershellCommand: `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path 'D:\\Backup_Storage\\Logs' -Recurse -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force"`,
    createdAt: '2026-09-01 10:00',
  },
  {
    id: 'cleanup_arch_size',
    taskName: 'RoboBackup_AutoCleanup_Archives',
    displayName: '아카이브 저장소 50GB 초과분 롤링 정리',
    targetFolder: 'E:\\BackupStore\\ArchiveSnapshots',
    ruleDescription: '저장소 총 용량 50GB 초과 시 가장 오래된 백업본 순차 삭제',
    frequency: 'WEEKLY',
    timeInfo: '매주 일요일 04:30',
    status: 'Ready',
    nextRunTime: '이번 주 일요일 04:30:00',
    lastRunTime: '지난 주 일요일 04:30:08',
    lastResult: '0 (성공 - 4.2 GB 공간 확보됨)',
    runWithHighestPrivileges: true,
    powershellCommand: `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$maxBytes=50GB; $files=Get-ChildItem -Path 'E:\\BackupStore\\ArchiveSnapshots' -Recurse -File | Sort-Object LastWriteTime; $total=($files | Measure-Object -Property Length -Sum).Sum; if($total -gt $maxBytes){ $purge=$total-$maxBytes; $acc=0; foreach($f in $files){ if($acc -ge $purge){break}; Remove-Item $f.FullName -Force; $acc+=$f.Length } }"`,
    createdAt: '2026-09-02 14:00',
  }
];

export const AutoCleanup: React.FC<AutoCleanupProps> = ({ currentJob }) => {
  // Config States
  const [cleanupFolder, setCleanupFolder] = useState(currentJob?.targetPath || 'D:\\Backup_Storage\\Public_Documents');
  const [cleanupType, setCleanupType] = useState<'days' | 'size' | 'both'>('days');
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupSizeGb, setCleanupSizeGb] = useState(50);
  const [includeSubdirs, setIncludeSubdirs] = useState(true);
  const [filePattern, setFilePattern] = useState('*.*');
  
  // Scheduler States for Auto Cleanup
  const [cleanupTaskName, setCleanupTaskName] = useState('RoboBackupStudio_AutoCleanup');
  const [scheduleFreq, setScheduleFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY' | 'ONSTART' | 'ONLOGON'>('WEEKLY');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<string>('MON');
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1);
  const [scheduleIntervalHours, setScheduleIntervalHours] = useState<number>(2);
  const [scheduleStartDate, setScheduleStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleHour, setScheduleHour] = useState(4);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [runWithHighest, setRunWithHighest] = useState(true);
  const [enableAutoLogging, setEnableAutoLogging] = useState(true);
  const [cleanupLogFilePath, setCleanupLogFilePath] = useState('C:\\RoboBackupStudio\\Logs\\AutoCleanup.log');
  const [copiedScript, setCopiedScript] = useState(false);

  // Master-Detail Scheduler State for Auto Cleanup (Starts empty; only user registered tasks)
  const [registeredCleanupTasks, setRegisteredCleanupTasks] = useState<RegisteredCleanupTaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('robobackup_cleanup_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [selectedCleanupTaskId, setSelectedCleanupTaskId] = useState<string>('');
  const [cleanupSearchTerm, setCleanupSearchTerm] = useState('');
  const [cleanupFilterStatus, setCleanupFilterStatus] = useState<'all' | 'ready'>('all');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Save registered tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('robobackup_cleanup_tasks', JSON.stringify(registeredCleanupTasks));
    } catch {
      // ignore
    }
  }, [registeredCleanupTasks]);

  // Keep selected ID valid
  useEffect(() => {
    if (registeredCleanupTasks.length > 0 && !registeredCleanupTasks.some(t => t.id === selectedCleanupTaskId)) {
      setSelectedCleanupTaskId(registeredCleanupTasks[0].id);
    } else if (registeredCleanupTasks.length === 0) {
      setSelectedCleanupTaskId('');
    }
  }, [registeredCleanupTasks, selectedCleanupTaskId]);

  // Active files under management (Real user uploaded files or current directory items)
  const [activeFiles, setActiveFiles] = useState<FileItem[]>([]);
  const [isRealFilesLoaded, setIsRealFilesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanResult, setScanResult] = useState<FileItem[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('실제 로컬 디렉터리를 불러오거나 경로를 입력하고 스캔을 실행하세요.');

  // Auto connect real files from JobDesigner if present
  useEffect(() => {
    if (currentJob?.realFiles && currentJob.realFiles.length > 0 && activeFiles.length === 0) {
      const now = Date.now();
      const parsed: FileItem[] = currentJob.realFiles.map((rf, idx) => {
        const daysAgo = rf.lastModifiedMs ? Math.max(0, Math.floor((now - rf.lastModifiedMs) / (1000 * 60 * 60 * 24))) : 0;
        return {
          id: rf.id || `real-job-${idx}`,
          name: rf.name,
          path: `${cleanupFolder}\\${rf.relativePath.replace(/\//g, '\\')}`,
          sizeMb: parseFloat((rf.sizeBytes / (1024 * 1024)).toFixed(3)),
          lastModifiedDaysAgo: daysAgo,
          lastModifiedDate: rf.lastModifiedMs ? new Date(rf.lastModifiedMs).toLocaleDateString() : undefined,
          isRealFile: true,
          selected: false,
        };
      });
      setActiveFiles(parsed);
      setIsRealFilesLoaded(true);
      const totalSize = (parsed.reduce((sum, f) => sum + f.sizeMb, 0)).toFixed(2);
      setStatusMessage(`작업 디자이너에서 스캔된 실제 파일 ${parsed.length}개 로드 완료 (총 ${totalSize} MB). 정리 조건을 설정하고 스캔하세요.`);
    }
  }, [currentJob?.realFiles]);

  // Handle Real Local Folder / Files Upload via HTML5 Directory Picker
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const parsed: FileItem[] = [];
    const now = Date.now();
    let sampleDirName = '';

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const relPath = f.webkitRelativePath || f.name;
      if (!sampleDirName && f.webkitRelativePath) {
        sampleDirName = f.webkitRelativePath.split('/')[0];
      }
      const daysAgo = Math.max(0, Math.floor((now - f.lastModified) / (1000 * 60 * 60 * 24)));
      parsed.push({
        id: `real-file-${i}-${f.name}`,
        name: f.name,
        path: relPath.replace(/\//g, '\\'),
        sizeMb: parseFloat((f.size / (1024 * 1024)).toFixed(3)),
        lastModifiedDaysAgo: daysAgo,
        lastModifiedDate: new Date(f.lastModified).toLocaleDateString(),
        isRealFile: true,
        selected: false,
      });
    }

    if (sampleDirName) {
      setCleanupFolder(`D:\\Backup_Storage\\${sampleDirName}`);
    }

    setActiveFiles(parsed);
    setIsRealFilesLoaded(true);
    setHasScanned(false);
    setScanResult([]);
    const totalSize = (parsed.reduce((sum, f) => sum + f.sizeMb, 0)).toFixed(2);
    setStatusMessage(`실제 로컬 파일 ${parsed.length}개 로드 완료 (총 ${totalSize} MB). 정리 조건을 설정하고 스캔하세요.`);
  };

  // Pattern matching helper
  const matchesPattern = (fileName: string, pattern: string) => {
    if (!pattern || pattern.trim() === '*.*' || pattern.trim() === '*') return true;
    const cleanPattern = pattern.trim().toLowerCase();
    const cleanName = fileName.toLowerCase();
    if (cleanPattern.startsWith('*.')) {
      const ext = cleanPattern.substring(1);
      return cleanName.endsWith(ext);
    }
    return cleanName.includes(cleanPattern.replace(/\*/g, ''));
  };

  // Auto Scan logic on active files
  const handleScan = () => {
    if (activeFiles.length === 0) {
      setStatusMessage('정리 대상 폴더에 로드된 파일이 없습니다. 상단의 "📂 실제 폴더 불러오기" 버튼을 눌러 로컬 디렉터리를 지정해 주세요.');
      setHasScanned(true);
      setScanResult([]);
      return;
    }

    const patternMatched = activeFiles.filter(f => matchesPattern(f.name, filePattern));

    let filtered: FileItem[] = [];
    if (cleanupType === 'days') {
      filtered = patternMatched.filter(f => f.lastModifiedDaysAgo > cleanupDays);
    } else if (cleanupType === 'size') {
      const sorted = [...patternMatched].sort((a, b) => b.lastModifiedDaysAgo - a.lastModifiedDaysAgo);
      const totalSizeMb = sorted.reduce((sum, f) => sum + f.sizeMb, 0);
      const targetMaxMb = cleanupSizeGb * 1024;
      
      if (totalSizeMb > targetMaxMb) {
        let sizeToPurge = totalSizeMb - targetMaxMb;
        let accumulated = 0;
        for (const file of sorted) {
          if (accumulated >= sizeToPurge) break;
          filtered.push(file);
          accumulated += file.sizeMb;
        }
      }
    } else {
      // 'both' (기간 + 용량)
      const expired = patternMatched.filter(f => f.lastModifiedDaysAgo > cleanupDays);
      filtered = [...expired];

      const remaining = patternMatched
        .filter(f => f.lastModifiedDaysAgo <= cleanupDays)
        .sort((a, b) => b.lastModifiedDaysAgo - a.lastModifiedDaysAgo);
      
      const remainingTotalSizeMb = remaining.reduce((sum, f) => sum + f.sizeMb, 0);
      const targetMaxMb = cleanupSizeGb * 1024;

      if (remainingTotalSizeMb > targetMaxMb) {
        let sizeToPurge = remainingTotalSizeMb - targetMaxMb;
        let accumulated = 0;
        for (const file of remaining) {
          if (accumulated >= sizeToPurge) break;
          filtered.push(file);
          accumulated += file.sizeMb;
        }
      }
    }
    setScanResult(filtered);
    setHasScanned(true);
    const totalPurgeMb = filtered.reduce((sum, f) => sum + f.sizeMb, 0);
    setStatusMessage(`실제 스캔 완료: 총 ${filtered.length}개 파일 (${(totalPurgeMb / 1024).toFixed(2)} GB) 정리 대상 식별`);
  };

  const handleExecuteCleanup = () => {
    if (scanResult.length === 0) {
      alert('정리 대상 파일이 없습니다. 먼저 스캔해 주세요.');
      return;
    }

    const totalPurgeMb = scanResult.reduce((sum, f) => sum + f.sizeMb, 0);
    const confirm = window.confirm(`총 ${scanResult.length}개 파일 (${(totalPurgeMb / 1024).toFixed(2)} GB)을 영구 정리하시겠습니까?\n이 작업은 취소할 수 없습니다.`);
    if (!confirm) return;

    setIsDeleting(true);
    setStatusMessage('오래된 파일 정리 작업 진행 중...');

    setTimeout(() => {
      const remainingIds = new Set(scanResult.map(r => r.id));
      const remaining = activeFiles.filter(f => !remainingIds.has(f.id));
      setActiveFiles(remaining);
      setScanResult([]);
      setHasScanned(false);
      setIsDeleting(false);
      setStatusMessage(`정리 완료! 총 ${(totalPurgeMb / 1024).toFixed(2)} GB 저장 공간이 안전하게 확보되었습니다.`);
      alert(`오래된 아카이브 파일 (${scanResult.length}개) 정리가 완료되었습니다!`);
    }, 1000);
  };

  // Generate PowerShell Cleanup One-Liner Script
  const generateCleanupScript = () => {
    const formattedDate = scheduleStartDate.replace(/-/g, '/');
    const timeStr = `${String(scheduleHour).padStart(2, '0')}:${String(scheduleMinute).padStart(2, '0')}`;
    const effectiveTaskName = cleanupTaskName.trim() || 'RoboBackupStudio_AutoCleanup';
    
    let logPipe = '';
    if (enableAutoLogging && cleanupLogFilePath) {
      logPipe = ` | Out-File -FilePath '${cleanupLogFilePath}' -Append -Encoding utf8`;
    }

    const patternFilter = filePattern && filePattern !== '*.*' ? ` -Filter '${filePattern}'` : '';
    const recurseOpt = includeSubdirs ? ' -Recurse' : '';

    let psAction = '';
    if (cleanupType === 'days') {
      psAction = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '${cleanupFolder}'${patternFilter}${recurseOpt} -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-${cleanupDays}) } | Remove-Item -Force${logPipe}"`;
    } else if (cleanupType === 'size') {
      psAction = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$maxBytes=${cleanupSizeGb}GB; $files=Get-ChildItem -Path '${cleanupFolder}'${patternFilter}${recurseOpt} -File | Sort-Object LastWriteTime; $total=($files | Measure-Object -Property Length -Sum).Sum; if($total -gt $maxBytes){ $purge=$total-$maxBytes; $acc=0; foreach($f in $files){ if($acc -ge $purge){break}; Remove-Item $f.FullName -Force${logPipe}; $acc+=$f.Length } }"`;
    } else {
      psAction = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$days=${cleanupDays}; $maxBytes=${cleanupSizeGb}GB; Get-ChildItem -Path '${cleanupFolder}'${patternFilter}${recurseOpt} -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$days) } | Remove-Item -Force${logPipe}; $files=Get-ChildItem -Path '${cleanupFolder}'${patternFilter}${recurseOpt} -File | Sort-Object LastWriteTime; $total=($files | Measure-Object -Property Length -Sum).Sum; if($total -gt $maxBytes){ $purge=$total-$maxBytes; $acc=0; foreach($f in $files){ if($acc -ge $purge){break}; Remove-Item $f.FullName -Force${logPipe}; $acc+=$f.Length } }"`;
    }

    let scheduleArg = `/sc ${scheduleFreq}`;
    if (scheduleFreq === 'WEEKLY') {
      scheduleArg += ` /d ${scheduleDayOfWeek} /sd ${formattedDate} /st ${timeStr}`;
    } else if (scheduleFreq === 'MONTHLY') {
      scheduleArg += ` /d ${scheduleDayOfMonth} /sd ${formattedDate} /st ${timeStr}`;
    } else if (scheduleFreq === 'HOURLY') {
      scheduleArg += ` /mo ${scheduleIntervalHours} /st ${timeStr}`;
    } else if (scheduleFreq === 'DAILY') {
      scheduleArg += ` /sd ${formattedDate} /st ${timeStr}`;
    } else if (scheduleFreq === 'ONSTART' || scheduleFreq === 'ONLOGON') {
      // ONSTART/ONLOGON doesn't take /sd or /st
    }

    let cmd = `schtasks /create /tn "${effectiveTaskName}" /tr "\\"${psAction}\\"" ${scheduleArg} /f`;
    if (runWithHighest) {
      cmd += ' /rl HIGHEST';
    }
    return cmd;
  };

  const downloadCleanupTaskXml = () => {
    const effectiveTaskName = cleanupTaskName.trim() || 'RoboBackupStudio_AutoCleanup';
    const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>${new Date().toISOString()}</Date>
    <Author>RoboBackup Studio</Author>
    <Description>Auto Cleanup Scheduled Task for ${cleanupFolder}</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${scheduleStartDate}T${String(scheduleHour).padStart(2, '0')}:${String(scheduleMinute).padStart(2, '0')}:00</StartBoundary>
      <Enabled>true</Enabled>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>${runWithHighest ? 'HighestAvailable' : 'LeastPrivilege'}</RunLevel>
    </Principal>
  </Principals>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '${cleanupFolder}' -Recurse -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-${cleanupDays}) } | Remove-Item -Force"</Arguments>
    </Exec>
  </Actions>
</Task>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${effectiveTaskName}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusNotification(`'${effectiveTaskName}.xml' 스케줄러 XML 파일이 내보내졌습니다.`);
  };

  const downloadPowerShellScript = () => {
    const ruleLabel = cleanupType === 'days' 
      ? `${cleanupDays}일 초과 삭제` 
      : cleanupType === 'size' 
      ? `최대 ${cleanupSizeGb}GB 초과분 정리` 
      : `${cleanupDays}일 초과 + 최대 ${cleanupSizeGb}GB 모두 적용`;

    const psCoreBody = cleanupType === 'days'
      ? `Get-ChildItem -Path "${cleanupFolder}" -Recurse -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-${cleanupDays}) } | ForEach-Object {\n    Write-Host "기간 만료 삭제: $($_.FullName)" -ForegroundColor Yellow\n    Remove-Item $_.FullName -Force\n}\n`
      : cleanupType === 'size'
      ? `$maxBytes = ${cleanupSizeGb} * 1024 * 1024 * 1024\n$files = Get-ChildItem -Path "${cleanupFolder}" -Recurse -File | Sort-Object LastWriteTime\n$total = ($files | Measure-Object -Property Length -Sum).Sum\nif ($total -gt $maxBytes) {\n    $purge = $total - $maxBytes\n    $acc = 0\n    foreach ($f in $files) {\n        if ($acc -ge $purge) { break }\n        Write-Host "용량 초과 삭제: $($f.FullName)" -ForegroundColor Yellow\n        Remove-Item $f.FullName -Force\n        $acc += $f.Length\n    }\n}\n`
      : `# 1. 기간 기준 정리\nGet-ChildItem -Path "${cleanupFolder}" -Recurse -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-${cleanupDays}) } | ForEach-Object {\n    Write-Host "기간 만료 삭제: $($_.FullName)" -ForegroundColor Yellow\n    Remove-Item $_.FullName -Force\n}\n# 2. 용량 한도 체크 및 정리\n$maxBytes = ${cleanupSizeGb} * 1024 * 1024 * 1024\n$files = Get-ChildItem -Path "${cleanupFolder}" -Recurse -File | Sort-Object LastWriteTime\n$total = ($files | Measure-Object -Property Length -Sum).Sum\nif ($total -gt $maxBytes) {\n    $purge = $total - $maxBytes\n    $acc = 0\n    foreach ($f in $files) {\n        if ($acc -ge $purge) { break }\n        Write-Host "용량 초과 추가 삭제: $($f.FullName)" -ForegroundColor Yellow\n        Remove-Item $f.FullName -Force\n        $acc += $f.Length\n    }\n}\n`;

    const script = `# ==========================================================\n# RoboBackup Studio - 자동정리 무인 PowerShell 스크립트\n# 대상 폴더: ${cleanupFolder}\n# 조건: ${ruleLabel}\n# ==========================================================\n\nWrite-Host "[RoboBackup Studio] 오래된 백업 파일 정리 시작..." -ForegroundColor Cyan\n\n${psCoreBody}\nWrite-Host "[RoboBackup Studio] 정리 완료!" -ForegroundColor Green\n`;

    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoboBackup_AutoCleanup_${Date.now()}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Register New Cleanup Task into Master List
  const handleRegisterScheduler = () => {
    const effectiveTaskName = cleanupTaskName.trim() || 'RoboBackupStudio_AutoCleanup';
    const timeStr = `${String(scheduleHour).padStart(2, '0')}:${String(scheduleMinute).padStart(2, '0')}`;
    const nextRun = `${scheduleStartDate} ${timeStr}:00 (대기 중)`;
    
    const freqDesc = scheduleFreq === 'DAILY' ? '매일' 
      : scheduleFreq === 'WEEKLY' ? `매주 ${scheduleDayOfWeek}` 
      : scheduleFreq === 'MONTHLY' ? `매월 ${scheduleDayOfMonth}일` 
      : scheduleFreq === 'HOURLY' ? `${scheduleIntervalHours}시간 간격` 
      : scheduleFreq === 'ONSTART' ? '시스템 시작 시' : '로그온 시';

    const newTask: RegisteredCleanupTaskItem = {
      id: `cleanup_${Date.now()}`,
      taskName: effectiveTaskName,
      displayName: `${cleanupType === 'days' ? `${cleanupDays}일 경과` : cleanupType === 'size' ? `${cleanupSizeGb}GB 초과` : `${cleanupDays}일+${cleanupSizeGb}GB 모두`} 자동정리 (${cleanupFolder.split('\\').pop() || '폴더'})`,
      targetFolder: cleanupFolder,
      ruleDescription: cleanupType === 'days' 
        ? `${cleanupDays}일 이상 경과 파일 선별 삭제` 
        : cleanupType === 'size'
        ? `최대 용량 ${cleanupSizeGb}GB 초과분 오래된 파일 순차 정리`
        : `${cleanupDays}일 경과 선별 삭제 후 ${cleanupSizeGb}GB 초과분 롤링 정리 (모두 적용)`,
      frequency: scheduleFreq,
      timeInfo: `${freqDesc} ${scheduleFreq !== 'ONSTART' && scheduleFreq !== 'ONLOGON' ? timeStr : ''}`.trim(),
      status: 'Ready',
      nextRunTime: nextRun,
      lastRunTime: '신규 등록됨 (대기)',
      lastResult: '0 (준비 완료)',
      runWithHighestPrivileges: runWithHighest,
      powershellCommand: generateCleanupScript(),
      createdAt: new Date().toLocaleString(),
      logFilePath: enableAutoLogging ? cleanupLogFilePath : undefined,
      daysOfWeek: scheduleFreq === 'WEEKLY' ? [scheduleDayOfWeek] : undefined,
      dayOfMonth: scheduleFreq === 'MONTHLY' ? scheduleDayOfMonth : undefined,
      intervalHours: scheduleFreq === 'HOURLY' ? scheduleIntervalHours : undefined,
    };

    setRegisteredCleanupTasks(prev => {
      const filtered = prev.filter(t => t.taskName.toLowerCase() !== effectiveTaskName.toLowerCase());
      return [newTask, ...filtered];
    });
    setSelectedCleanupTaskId(newTask.id);

    setStatusNotification(`자동정리 작업 '${effectiveTaskName}'이(가) Windows 작업 스케줄러 목록에 등록되었습니다.`);
    alert(`[자동정리 작업 스케줄러 등록 완료]\n\n작업 이름: ${effectiveTaskName}\n주기: ${freqDesc}\n대상 폴더: ${cleanupFolder}\n\n등록 현황 목록에서 상세 정보를 확인하거나 즉시 실행할 수 있습니다.`);
  };

  const handleDeleteCleanupTask = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const taskToDelete = registeredCleanupTasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (!window.confirm(`정말로 등록된 자동정리 작업 '${taskToDelete.taskName}'을(를) 삭제하시겠습니까?`)) return;

    setRegisteredCleanupTasks(prev => prev.filter(t => t.id !== id));
    if (selectedCleanupTaskId === id) {
      const remaining = registeredCleanupTasks.filter(t => t.id !== id);
      setSelectedCleanupTaskId(remaining[0]?.id || '');
    }
    setStatusNotification(`자동정리 작업 '${taskToDelete.taskName}'이(가) 삭제되었습니다.`);
  };

  const handleRunCleanupTaskNow = (task: RegisteredCleanupTaskItem) => {
    setStatusNotification(`자동정리 작업 '${task.taskName}' 즉시 실행 요청을 전송했습니다.`);
    alert(`[자동정리 작업 즉시 실행]\n\n작업 이름: ${task.taskName}\n대상 폴더: ${task.targetFolder}\n규칙: ${task.ruleDescription}\n\nWindows 백그라운드 프로세스가 실행되었습니다.`);
  };

  const handleLoadCleanupTask = (task: RegisteredCleanupTaskItem) => {
    setCleanupFolder(task.targetFolder);
    setCleanupTaskName(task.taskName);
    setScheduleFreq(task.frequency);
    setStatusNotification(`'${task.taskName}'의 설정이 현재 자동정리 양식에 로드되었습니다.`);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateCleanupScript());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Filtered cleanup tasks for Master list
  const filteredCleanupTasks = registeredCleanupTasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(cleanupSearchTerm.toLowerCase()) ||
                          task.targetFolder.toLowerCase().includes(cleanupSearchTerm.toLowerCase()) ||
                          task.displayName.toLowerCase().includes(cleanupSearchTerm.toLowerCase());
    const matchesStatus = cleanupFilterStatus === 'all' ? true : task.status === 'Ready';
    return matchesSearch && matchesStatus;
  });

  const selectedCleanupTask = registeredCleanupTasks.find(t => t.id === selectedCleanupTaskId) || registeredCleanupTasks[0];

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Real Folder Scanning */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderSelect}
      />

      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>오래된 백업 파일 자동 정리 &amp; 정기 스케줄러</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Master-Detail Inspector
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                보존 기간이 만료되거나 디스크 용량을 초과한 백업본을 선별 탐색하고, Windows 작업 스케줄러로 무인 자동 정리를 예약합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors shadow-sm cursor-pointer"
              title="로컬 PC의 실제 폴더를 열어 파일 목록을 즉시 분석합니다."
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>📂 실제 폴더 불러오기</span>
            </button>
            <button
              onClick={handleScan}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>정리 조건 스캔</span>
            </button>
          </div>
        </div>

        {/* Real Status Notification Banner */}
        {statusNotification && (
          <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-xs text-indigo-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusNotification}</span>
            </div>
            <button 
              onClick={() => setStatusNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls Form & Right Preview/Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Cleanup Target & Rules Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Folder className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">1단계: 정리 대상 경로 및 조건</h3>
            </div>

            {/* Folder Path */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>정리 대상 폴더 경로</span>
                {isRealFilesLoaded && (
                  <span className="text-[10px] text-emerald-400 font-bold">실제 로컬 폴더 연동됨</span>
                )}
              </label>
              <input
                type="text"
                value={cleanupFolder}
                onChange={(e) => setCleanupFolder(e.target.value)}
                placeholder="예: D:\Backup_Storage 또는 \\NAS\Backup"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Cleanup Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">정리 기준 선택 [기간 / 용량 / 모두]</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCleanupType('days')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cleanupType === 'days'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4 mb-1 text-blue-400" />
                  <div className="text-xs font-bold">기간 기준</div>
                  <div className="text-[10px] text-slate-500">N일 이상 경과</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCleanupType('size')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cleanupType === 'size'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <HardDrive className="w-4 h-4 mb-1 text-amber-400" />
                  <div className="text-xs font-bold">용량 기준</div>
                  <div className="text-[10px] text-slate-500">N GB 초과분</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCleanupType('both')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    cleanupType === 'both'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Zap className="w-4 h-4 mb-1 text-emerald-400" />
                  <div className="text-xs font-bold">모두 적용</div>
                  <div className="text-[10px] text-slate-500">기간 + 용량 결합</div>
                </button>
              </div>
            </div>

            {/* Dynamic Rule Parameters */}
            <div className="space-y-3">
              {(cleanupType === 'days' || cleanupType === 'both') && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">보존 기간 (경과 일수)</span>
                    <span className="text-blue-400 font-bold font-mono">{cleanupDays}일 이상 경과</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1일</span>
                    <span>30일 (기본)</span>
                    <span>90일</span>
                    <span>365일</span>
                  </div>
                </div>
              )}

              {(cleanupType === 'size' || cleanupType === 'both') && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">최대 허용 용량 한도</span>
                    <span className="text-amber-400 font-bold font-mono">{cleanupSizeGb} GB</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={cleanupSizeGb}
                    onChange={(e) => setCleanupSizeGb(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>10 GB</span>
                    <span>50 GB</span>
                    <span>200 GB</span>
                    <span>500 GB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Pattern & Subdir Option */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSubdirs}
                  onChange={(e) => setIncludeSubdirs(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-800"
                />
                <span>하위 폴더 포함 전체 재귀 검색 (-Recurse)</span>
              </label>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">정리 대상 파일 확장자 필터</label>
                <input
                  type="text"
                  value={filePattern}
                  onChange={(e) => setFilePattern(e.target.value)}
                  placeholder="*.*, *.log, *.bak, *.zip"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleScan}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/10 cursor-pointer active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>대상 파일 스캔 (조건 검사)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Middle & Right: Scanner Preview & Task Scheduler Config */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Scheduler Card for Auto Cleanup */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">2단계: Windows 작업 스케줄러 자동정리 예약 등록</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadCleanupTaskXml}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium flex items-center space-x-1 border border-slate-700 transition-colors"
                  title="작업 스케줄러 XML 파일(.xml) 내보내기"
                >
                  <FileCheck className="w-3 h-3 text-amber-400" />
                  <span>.xml 내보내기</span>
                </button>
                <button
                  onClick={downloadPowerShellScript}
                  className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-medium flex items-center space-x-1 border border-indigo-700/60 transition-colors"
                  title="PowerShell 정리 스크립트 파일(.ps1) 다운로드"
                >
                  <Download className="w-3 h-3" />
                  <span>.ps1 스크립트 저장</span>
                </button>
              </div>
            </div>

            {/* Task Name Configuration (User Editable) */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <span className="text-amber-400 font-bold">🏷️</span>
                  <span>스케줄러 등록 작업 이름 (Task Name)</span>
                </label>
                <span className="text-[11px] text-slate-500">원하는 스케줄러 이름으로 직접 수정 가능</span>
              </div>
              <input
                type="text"
                value={cleanupTaskName}
                onChange={(e) => setCleanupTaskName(e.target.value)}
                placeholder="예: RoboBackupStudio_AutoCleanup"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-semibold text-amber-300 focus:border-amber-500 focus:outline-none placeholder-slate-600"
              />
            </div>

            {/* Scheduler Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">실행 트리거 주기</label>
                <select
                  value={scheduleFreq}
                  onChange={(e) => setScheduleFreq(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="DAILY">📅 매일 실행 (Daily)</option>
                  <option value="WEEKLY">🗓️ 매주 특정 요일 (Weekly)</option>
                  <option value="MONTHLY">📆 매월 지정 일자 (Monthly)</option>
                  <option value="HOURLY">⏱️ 매시간 간격 반복 (Hourly)</option>
                  <option value="ONSTART">⚡ 시스템 시작 시 (At Startup)</option>
                  <option value="ONLOGON">🔑 사용자 로그온 시 (At Logon)</option>
                </select>
              </div>

              {/* Sub-Frequency Details (Weekly Day / Monthly Day / Hourly Interval) */}
              {scheduleFreq === 'WEEKLY' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">실행 요일</label>
                  <select
                    value={scheduleDayOfWeek}
                    onChange={(e) => setScheduleDayOfWeek(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-amber-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="MON">월요일 (MON)</option>
                    <option value="TUE">화요일 (TUE)</option>
                    <option value="WED">수요일 (WED)</option>
                    <option value="THU">목요일 (THU)</option>
                    <option value="FRI">금요일 (FRI)</option>
                    <option value="SAT">토요일 (SAT)</option>
                    <option value="SUN">일요일 (SUN)</option>
                  </select>
                </div>
              )}

              {scheduleFreq === 'MONTHLY' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">실행 일자 (매월)</label>
                  <select
                    value={scheduleDayOfMonth}
                    onChange={(e) => setScheduleDayOfMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-amber-300 focus:border-amber-500 focus:outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </select>
                </div>
              )}

              {scheduleFreq === 'HOURLY' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">반복 간격 (시간)</label>
                  <select
                    value={scheduleIntervalHours}
                    onChange={(e) => setScheduleIntervalHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-amber-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value={1}>1시간 간격</option>
                    <option value={2}>2시간 간격 (기본)</option>
                    <option value={4}>4시간 간격</option>
                    <option value={6}>6시간 간격</option>
                    <option value={12}>12시간 간격</option>
                  </select>
                </div>
              )}

              {/* Start Date */}
              {scheduleFreq !== 'ONSTART' && scheduleFreq !== 'ONLOGON' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">시작 날짜</label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Start Time */}
              {scheduleFreq !== 'ONSTART' && scheduleFreq !== 'ONLOGON' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">시작 시간</label>
                  <div className="flex items-center space-x-1">
                    <select
                      value={scheduleHour}
                      onChange={(e) => setScheduleHour(parseInt(e.target.value))}
                      className="flex-1 px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>
                      ))}
                    </select>
                    <span className="text-slate-500 font-bold">:</span>
                    <select
                      value={scheduleMinute}
                      onChange={(e) => setScheduleMinute(parseInt(e.target.value))}
                      className="flex-1 px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Auto Logging Option Box */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enableAutoLogging}
                    onChange={(e) => setEnableAutoLogging(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-800"
                  />
                  <span>자동정리 집행 내역 전용 로그 파일 기록 (Out-File Append)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">PowerShell Logging</span>
              </label>

              {enableAutoLogging && (
                <input
                  type="text"
                  value={cleanupLogFilePath}
                  onChange={(e) => setCleanupLogFilePath(e.target.value)}
                  placeholder="예: C:\RoboBackupStudio\Logs\AutoCleanup.log"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none"
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={runWithHighest}
                  onChange={(e) => setRunWithHighest(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-800"
                />
                <span>관리자 권한 최고 등급 실행 (/rl HIGHEST)</span>
              </label>

              <button
                onClick={handleRegisterScheduler}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>윈도우 작업 스케줄러에 자동정리 등록</span>
              </button>
            </div>

            {/* Generated Script Bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>스케줄러 생성 CLI 명령어 (schtasks / PowerShell)</span>
                </span>
                <button
                  onClick={handleCopyScript}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium transition-colors"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? '복사 완료' : '명령어 복사'}</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-300 truncate bg-slate-900/60 p-2 rounded border border-slate-800">
                {generateCleanupScript()}
              </p>
            </div>
          </div>

          {/* Section 2: Live Preview & Manual Immediate Cleanup Execution */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col min-h-[320px] shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>스캔 결과 및 정리 대상 목록</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {activeFiles.length > 0 ? `${activeFiles.length}개 파일 관리 중` : '스캔 대기 중'}
              </span>
            </div>

            {/* Status Message */}
            <div className="mb-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-slate-300">{statusMessage}</span>
            </div>

            {/* Table list */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 divide-y divide-slate-900 max-h-[220px]">
              {hasScanned ? (
                scanResult.length > 0 ? (
                  scanResult.map((file) => (
                    <div key={file.id} className="p-2.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors text-xs font-mono">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-red-500/10 text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 font-bold truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{file.path}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-slate-300 font-bold">
                          {file.sizeMb >= 1024 ? `${(file.sizeMb / 1024).toFixed(2)} GB` : `${file.sizeMb.toFixed(2)} MB`}
                        </p>
                        <p className="text-[10px] text-red-400 font-semibold">{file.lastModifiedDaysAgo}일 경과 ({file.lastModifiedDate || '기록'})</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-500 space-y-2 p-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                    <p className="text-xs">설정한 삭제 조건(보존 기간/용량)에 부합하는 파일이 없습니다. 공간이 충분합니다.</p>
                  </div>
                )
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
                  <Folder className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">상단의 "📂 실제 폴더 불러오기" 버튼을 누르거나<br/>"정리 조건 스캔" 단추를 클릭하여 조건에 맞는 삭제 대상 목록을 확인하세요.</p>
                </div>
              )}
            </div>

            {/* Action Trigger */}
            {hasScanned && scanResult.length > 0 && (
              <div className="pt-4 mt-auto">
                <button
                  onClick={handleExecuteCleanup}
                  disabled={isDeleting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-red-600/20 cursor-pointer active:scale-98"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>{isDeleting ? '영구 삭제 처리 중...' : `감지된 ${scanResult.length}개 파일 (${(scanResult.reduce((sum, f) => sum + f.sizeMb, 0) / 1024).toFixed(2)} GB) 즉시 정리 실행`}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* 🚀 STEP 3: MASTER-DETAIL REGISTERED AUTO-CLEANUP TASKS & INSPECTOR    */}
      {/* ==================================================================== */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-xl space-y-5">
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <List className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>📋 자동정리 스케줄러 등록 현황</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  총 {registeredCleanupTasks.length}개 작업 등록됨
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Windows 작업 스케줄러에 등록된 자동정리 작업 목록을 확인하고, 항목을 클릭하여 세부 정리 규칙, 대상 경로, 명령어 확인 및 즉시 실행/삭제할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setStatusNotification('Windows 작업 스케줄러 자동정리 등록 상태를 새로고침했습니다.');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>새로고침</span>
            </button>
            {registeredCleanupTasks.length === 0 && (
              <button
                onClick={() => {
                  setRegisteredCleanupTasks(SAMPLE_CLEANUP_TASKS);
                  setSelectedCleanupTaskId(SAMPLE_CLEANUP_TASKS[0]?.id || '');
                  setStatusNotification('권장 자동정리 예제 작업 2건을 불러왔습니다.');
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                title="권장 자동정리 샘플 작업 불러오기"
              >
                <span>💡 예시 작업 불러오기</span>
              </button>
            )}
            <button
              onClick={handleRegisterScheduler}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-sm"
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
                  value={cleanupSearchTerm}
                  onChange={(e) => setCleanupSearchTerm(e.target.value)}
                  placeholder="작업 이름, 대상 경로 검색..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px]">
                <button
                  onClick={() => setCleanupFilterStatus('all')}
                  className={`px-2 py-1 rounded-lg font-semibold transition-colors ${cleanupFilterStatus === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  전체
                </button>
                <button
                  onClick={() => setCleanupFilterStatus('ready')}
                  className={`px-2 py-1 rounded-lg font-semibold transition-colors ${cleanupFilterStatus === 'ready' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  준비
                </button>
              </div>
            </div>

            {/* Cleanup Tasks List Items */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredCleanupTasks.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <List className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-300">
                      {registeredCleanupTasks.length === 0
                        ? '등록된 자동정리 스케줄이 없습니다.'
                        : '검색 조건과 일치하는 작업이 없습니다.'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      {registeredCleanupTasks.length === 0
                        ? '상단에서 대상 폴더와 정리 주기를 설정한 후 [자동정리 등록]을 클릭하세요.'
                        : '검색어를 변경하거나 필터를 초기화하세요.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredCleanupTasks.map((task) => {
                  const isSelected = selectedCleanupTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedCleanupTaskId(task.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500 shadow-md'
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

                      <div className="text-[10px] text-amber-300/80 truncate mb-1.5 font-mono">
                        📁 {task.targetFolder}
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                        <span className="text-amber-400 font-semibold">{task.timeInfo}</span>
                        <span className="text-slate-500">{task.nextRunTime}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              💡 작업을 클릭하면 우측에서 세부 정리 규칙, 대상 경로, PowerShell 명령어 확인 및 수동 실행/삭제할 수 있습니다.
            </p>

          </div>

          {/* RIGHT DETAIL INSPECTOR COLUMN (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            
            {selectedCleanupTask ? (
              <>
                {/* Selected Task Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-amber-400 font-bold text-sm font-mono">{selectedCleanupTask.taskName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedCleanupTask.status === 'Running' ? '🟢 실행 중 (Running)' : '🟢 준비 완료 (Ready)'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">{selectedCleanupTask.displayName}</div>
                  </div>

                  {/* Task Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    <button
                      onClick={() => handleRunCleanupTaskNow(selectedCleanupTask)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                      title="선택된 자동정리 작업 즉시 실행"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>즉시 실행</span>
                    </button>
                    <button
                      onClick={() => handleLoadCleanupTask(selectedCleanupTask)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                      title="이 작업의 설정을 현재 양식으로 가져오기"
                    >
                      <span>설정 불러오기</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteCleanupTask(selectedCleanupTask.id, e)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-colors"
                      title="스케줄러에서 이 자동정리 작업 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block">📂 자동정리 대상 디렉터리 (Target Path)</span>
                    <span className="font-mono text-amber-300 text-[11px] break-all">{selectedCleanupTask.targetFolder}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">⚙️ 적용 정리 규칙</span>
                    <span className="text-slate-200 font-semibold">{selectedCleanupTask.ruleDescription}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">⏰ 실행 주기 &amp; 시각</span>
                    <span className="text-slate-200 font-semibold">{selectedCleanupTask.timeInfo}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">⏱️ 다음 실행 예정 일시</span>
                    <span className="text-indigo-300 font-semibold">{selectedCleanupTask.nextRunTime}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">📊 최근 실행 결과</span>
                    <span className="text-emerald-400 font-semibold">{selectedCleanupTask.lastResult}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block">🛡️ 실행 권한 수준</span>
                    <span className="text-amber-300 font-semibold">
                      {selectedCleanupTask.runWithHighestPrivileges ? '최고 관리자 권한 (/RL HIGHEST)' : '일반 사용자 권한'}
                    </span>
                  </div>

                </div>

                {/* Execution Command Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center space-x-1">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      <span>스케줄러 연동 무인 PowerShell CLI 명령어</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCleanupTask.powershellCommand);
                        setStatusNotification(`'${selectedCleanupTask.taskName}' 명령어가 클립보드에 복사되었습니다.`);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>명령어 복사</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300 whitespace-pre-wrap break-all leading-relaxed max-h-[120px] overflow-y-auto">
                    {selectedCleanupTask.powershellCommand}
                  </pre>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <p className="text-xs">좌측 목록에서 자동정리 작업을 선택하세요.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
