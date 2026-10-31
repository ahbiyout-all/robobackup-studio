import { RobocopyFlags, PresetProfile, BackupJob, CsharpSnippet, ScannedFileInfo, ScheduleConfig } from '../types';

export interface FilterEvaluationResult {
  annotatedFiles: ScannedFileInfo[];
  totalFiles: number;
  totalBytes: number;
  includedFiles: ScannedFileInfo[];
  includedBytes: number;
  excludedFiles: ScannedFileInfo[];
  excludedBytes: number;
}

export function evaluateFileExclusions(files: ScannedFileInfo[], flags: RobocopyFlags): FilterEvaluationResult {
  const now = Date.now();
  const annotatedFiles: ScannedFileInfo[] = [];
  const includedFiles: ScannedFileInfo[] = [];
  const excludedFiles: ScannedFileInfo[] = [];
  let totalBytes = 0;
  let includedBytes = 0;
  let excludedBytes = 0;

  for (const file of files) {
    totalBytes += file.sizeBytes;
    let isExcluded = false;
    let exclusionReason = '';

    // 1. /XF Check (excludeFiles)
    if (flags.excludeFiles && flags.excludeFiles.length > 0) {
      for (const pattern of flags.excludeFiles) {
        const p = pattern.trim().toLowerCase();
        if (!p) continue;
        const nameLower = file.name.toLowerCase();
        if (p.startsWith('*.')) {
          const ext = p.substring(1);
          if (nameLower.endsWith(ext)) {
            isExcluded = true;
            exclusionReason = `/XF 파일 확장자 (${pattern})`;
            break;
          }
        } else if (p.startsWith('~$') && nameLower.startsWith('~$')) {
          isExcluded = true;
          exclusionReason = `/XF 오피스 임시 파일 (${pattern})`;
          break;
        } else if (p.includes('*')) {
          const regex = new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
          if (regex.test(nameLower)) {
            isExcluded = true;
            exclusionReason = `/XF 와일드카드 (${pattern})`;
            break;
          }
        } else if (nameLower === p) {
          isExcluded = true;
          exclusionReason = `/XF 정확한 파일명 (${pattern})`;
          break;
        }
      }
    }

    // 2. /XD Check (excludeDirs)
    if (!isExcluded && flags.excludeDirs && flags.excludeDirs.length > 0) {
      const relPathLower = file.relativePath.toLowerCase().replace(/\//g, '\\');
      const dirParts = relPathLower.split('\\');
      const parentDirs = dirParts.slice(0, -1);
      for (const exDir of flags.excludeDirs) {
        const d = exDir.trim().toLowerCase();
        if (!d) continue;
        if (parentDirs.some(dir => dir === d || dir.endsWith(`\\${d}`) || dir.includes(d))) {
          isExcluded = true;
          exclusionReason = `/XD 제외 디렉터리 (${exDir})`;
          break;
        }
      }
    }

    // 3. /MIN /MAX File Size Check
    if (!isExcluded && flags.minFileSizeMb && flags.minFileSizeMb > 0) {
      const minBytes = flags.minFileSizeMb * 1024 * 1024;
      if (file.sizeBytes < minBytes) {
        isExcluded = true;
        exclusionReason = `/MIN 최소 크기 미달 (< ${flags.minFileSizeMb} MB)`;
      }
    }

    if (!isExcluded && flags.maxFileSizeMb && flags.maxFileSizeMb > 0) {
      const maxBytes = flags.maxFileSizeMb * 1024 * 1024;
      if (file.sizeBytes > maxBytes) {
        isExcluded = true;
        exclusionReason = `/MAX 최대 크기 초과 (> ${flags.maxFileSizeMb} MB)`;
      }
    }

    // 4. /MINAGE /MAXAGE Age Check
    if (!isExcluded && file.lastModifiedMs > 0) {
      const ageDays = Math.max(0, (now - file.lastModifiedMs) / (1000 * 60 * 60 * 24));
      if (flags.minAgeDays && flags.minAgeDays > 0) {
        if (ageDays < flags.minAgeDays) {
          isExcluded = true;
          exclusionReason = `/MINAGE 최근 변경 파일 제외 (< ${flags.minAgeDays}일)`;
        }
      }
      if (!isExcluded && flags.maxAgeDays && flags.maxAgeDays > 0) {
        if (ageDays > flags.maxAgeDays) {
          isExcluded = true;
          exclusionReason = `/MAXAGE 오래된 파일 제외 (> ${flags.maxAgeDays}일)`;
        }
      }
    }

    const annotated: ScannedFileInfo = {
      ...file,
      isExcluded,
      exclusionReason: isExcluded ? exclusionReason : undefined,
    };

    annotatedFiles.push(annotated);
    if (isExcluded) {
      excludedFiles.push(annotated);
      excludedBytes += file.sizeBytes;
    } else {
      includedFiles.push(annotated);
      includedBytes += file.sizeBytes;
    }
  }

  return {
    annotatedFiles,
    totalFiles: files.length,
    totalBytes,
    includedFiles,
    includedBytes,
    excludedFiles,
    excludedBytes,
  };
}

export function calculateNextScheduleRun(schedule: ScheduleConfig): { nextRunStr: string; timeRemainingStr: string } {
  if (!schedule.enabled) {
    return { nextRunStr: '예약 비활성화 (수동 실행 모드)', timeRemainingStr: '-' };
  }

  const now = new Date();

  if (schedule.frequency === 'logon') {
    return { nextRunStr: 'Windows 사용자 로그인 즉시 실행 (On Logon)', timeRemainingStr: '다음 로그인 시점' };
  }

  if (schedule.frequency === 'interval') {
    const mins = Math.max(1, schedule.intervalMinutes || 30);
    const nextDate = new Date(now.getTime() + mins * 60 * 1000);
    return {
      nextRunStr: `${nextDate.toLocaleDateString()} ${nextDate.toLocaleTimeString()}`,
      timeRemainingStr: `약 ${mins}분 후`,
    };
  }

  const [hoursStr, minsStr] = (schedule.dailyTime || '03:00').split(':');
  const targetHour = parseInt(hoursStr) || 0;
  const targetMin = parseInt(minsStr) || 0;

  const nextDate = new Date(now);
  nextDate.setHours(targetHour, targetMin, 0, 0);

  if (nextDate.getTime() <= now.getTime()) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  if (schedule.frequency === 'weekly' && schedule.weeklyDays && schedule.weeklyDays.length > 0) {
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const targetDays = schedule.weeklyDays.map(d => dayMap[d]).filter(d => d !== undefined);
    if (targetDays.length > 0) {
      let attempts = 0;
      while (!targetDays.includes(nextDate.getDay()) && attempts < 8) {
        nextDate.setDate(nextDate.getDate() + 1);
        attempts++;
      }
    }
  }

  const diffMs = nextDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    nextRunStr: `${nextDate.toLocaleDateString()} ${nextDate.toLocaleTimeString()}`,
    timeRemainingStr: `${diffHours > 0 ? `${diffHours}시간 ` : ''}${diffMinutes}분 후`,
  };
}

export const DEFAULT_FLAGS: RobocopyFlags = {
  mirror: true,
  copySubdirsWithEmpty: false,
  copySubdirsNoEmpty: false,
  purge: false,
  threads: 16,
  restartMode: false,
  backupMode: false,
  restartableBackupMode: true,
  retryCount: 2,
  waitTime: 5,
  fft: true,
  noProgress: false,
  noDirectoryList: false,
  noFileList: false,
  verbose: false,
  includeTimestamps: true,
  fullPathNames: true,
  bytesLogging: false,
  excludeFiles: ['*.tmp', 'desktop.ini', 'Thumbs.db', '~$*'],
  excludeDirs: ['$RECYCLE.BIN', 'System Volume Information', 'node_modules', '.git'],
  customFlags: '',
  // Advanced flags default
  copyAll: false,
  copySec: false,
  secFix: false,
  timFix: false,
  noOffload: false,
  ipg: 0,
  copySymlink: false,
  copyJunction: false,
  excludeJunctions: true,
  excludeOlder: false,
  excludeNewer: false,
  excludeChanged: false,
  excludeSame: false,
  excludeExtra: false,
  excludeLonely: false,
  fatFileNames: false,
  perFileTimeCheck: false,
};

export function formatRobocopyPath(path: string, defaultFallback: string = ''): string {
  if (!path || !path.trim()) {
    return defaultFallback ? `"${defaultFallback}"` : '""';
  }
  let clean = path.trim();
  // Strip surrounding quotes if already present
  if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2) {
    clean = clean.substring(1, clean.length - 1).trim();
  }

  if (clean.endsWith('\\') || clean.endsWith('/')) {
    // Check if it is a drive root like "C:\" or "D:/"
    if (clean.length === 3 && /^[a-zA-Z]:[\\/]$/.test(clean)) {
      return `"${clean[0]}:\\\\"`;
    }
    // Remove trailing slashes/backslashes to avoid the Windows CLI `\"` escape quote parsing bug
    clean = clean.replace(/[\\/]+$/, '');
  }

  return `"${clean}"`;
}

export function buildRobocopyCommand(source: string, target: string, flags: RobocopyFlags): string {
  const parts: string[] = ['robocopy'];

  const cleanSource = formatRobocopyPath(source, 'C:\\SourcePath');
  const cleanTarget = formatRobocopyPath(target, 'D:\\BackupPath');

  parts.push(cleanSource);
  parts.push(cleanTarget);

  // Copy modes
  if (flags.mirror) {
    parts.push('/MIR');
  } else {
    if (flags.copySubdirsWithEmpty) parts.push('/E');
    else if (flags.copySubdirsNoEmpty) parts.push('/S');
    if (flags.purge) parts.push('/PURGE');
  }

  // Backup modes
  if (flags.restartableBackupMode) {
    parts.push('/ZB');
  } else if (flags.backupMode) {
    parts.push('/B');
  } else if (flags.restartMode) {
    parts.push('/Z');
  }

  // Security & Permissions
  if (flags.copyAll) {
    parts.push('/COPYALL');
  } else if (flags.copySec) {
    parts.push('/SEC');
  }
  if (flags.secFix) parts.push('/SECFIX');
  if (flags.timFix) parts.push('/TIMFIX');
  if (flags.noOffload) parts.push('/NOOFFLOAD');

  // Multi-threading & Throttling
  if (flags.threads > 1) {
    parts.push(`/MT:${flags.threads}`);
  }
  if (flags.ipg && flags.ipg > 0) {
    parts.push(`/IPG:${flags.ipg}`);
  }

  // Symlinks & Junctions
  if (flags.copySymlink) parts.push('/SL');
  if (flags.copyJunction) parts.push('/SJ');
  if (flags.excludeJunctions) parts.push('/XJ');

  // Retry & Wait
  parts.push(`/R:${flags.retryCount}`);
  parts.push(`/W:${flags.waitTime}`);

  // Options & Formatting
  if (flags.fft) parts.push('/FFT');
  if (flags.fatFileNames) parts.push('/FAT');
  if (flags.noProgress) parts.push('/NP');
  if (flags.noDirectoryList) parts.push('/NDL');
  if (flags.noFileList) parts.push('/NFL');
  if (flags.verbose) parts.push('/V');
  if (flags.includeTimestamps) parts.push('/TS');
  if (flags.fullPathNames) parts.push('/FP');
  if (flags.bytesLogging) parts.push('/BYTES');

  // Advanced Filtering (Exclusions & Inclusions)
  if (flags.excludeOlder) parts.push('/XO');
  if (flags.excludeNewer) parts.push('/XN');
  if (flags.excludeChanged) parts.push('/XC');
  if (flags.excludeSame) parts.push('/XU');
  if (flags.excludeExtra) parts.push('/XX');
  if (flags.excludeLonely) parts.push('/XL');

  // Size filters (converted from MB to Bytes if needed)
  if (flags.minFileSizeMb && flags.minFileSizeMb > 0) {
    parts.push(`/MIN:${flags.minFileSizeMb * 1024 * 1024}`);
  }
  if (flags.maxFileSizeMb && flags.maxFileSizeMb > 0) {
    parts.push(`/MAX:${flags.maxFileSizeMb * 1024 * 1024}`);
  }

  // File and Directory Exclusions
  if (flags.excludeFiles && flags.excludeFiles.length > 0) {
    const exFiles = flags.excludeFiles.filter(f => f.trim() !== '').join(' ');
    if (exFiles) parts.push(`/XF ${exFiles}`);
  }

  if (flags.excludeDirs && flags.excludeDirs.length > 0) {
    const exDirs = flags.excludeDirs.filter(d => d.trim() !== '').join(' ');
    if (exDirs) parts.push(`/XD ${exDirs}`);
  }

  if (flags.minAgeDays && flags.minAgeDays > 0) {
    parts.push(`/MINAGE:${flags.minAgeDays}`);
  }

  if (flags.maxAgeDays && flags.maxAgeDays > 0) {
    parts.push(`/MAXAGE:${flags.maxAgeDays}`);
  }

  // Real-time Monitoring & Time Window
  if (flags.monitorChangesCount && flags.monitorChangesCount > 0) {
    parts.push(`/MON:${flags.monitorChangesCount}`);
  }
  if (flags.monitorWaitMinutes && flags.monitorWaitMinutes > 0) {
    parts.push(`/MOT:${flags.monitorWaitMinutes}`);
  }
  if (flags.runHours && flags.runHours.trim()) {
    parts.push(`/RH:${flags.runHours.trim()}`);
  }
  if (flags.perFileTimeCheck) {
    parts.push('/PF');
  }

  if (flags.customFlags && flags.customFlags.trim()) {
    parts.push(flags.customFlags.trim());
  }

  return parts.join(' ');
}

// NAS / UNC Path Helper Functions
export function isUncPath(path: string): boolean {
  if (!path) return false;
  const trimmed = path.trim();
  return trimmed.startsWith('\\\\') || trimmed.startsWith('//');
}

export function extractUncServer(path: string): string {
  if (!isUncPath(path)) return '';
  const normalized = path.trim().replace(/\//g, '\\');
  const parts = normalized.substring(2).split('\\');
  return parts[0] || '';
}

export function extractUncShare(path: string): string {
  if (!isUncPath(path)) return '';
  const normalized = path.trim().replace(/\//g, '\\');
  const parts = normalized.substring(2).split('\\');
  if (parts.length < 2) return `\\\\${parts[0]}`;
  return `\\\\${parts[0]}\\${parts[1]}`;
}

export function buildCmdkeyAddCommand(server: string, username: string, password?: string): string {
  const cleanServer = server.trim() || 'YOUR_NAS_IP_OR_HOST';
  const cleanUser = username.trim() || 'admin';
  const cleanPass = password && password.trim() ? password.trim() : 'NAS_PASSWORD';
  return `cmdkey /add:${cleanServer} /user:${cleanUser} /pass:${cleanPass}`;
}

export function buildCmdkeyDeleteCommand(server: string): string {
  const cleanServer = server.trim() || 'YOUR_NAS_IP_OR_HOST';
  return `cmdkey /delete:${cleanServer}`;
}

export function buildNetUseConnectCommand(sharePath: string, username: string, password?: string): string {
  const cleanShare = extractUncShare(sharePath) || sharePath.trim() || '\\\\YOUR_NAS_IP_OR_HOST\\SHARE_NAME';
  const cleanUser = username.trim() || 'admin';
  const cleanPass = password && password.trim() ? `"${password.trim()}"` : '"NAS_PASSWORD"';
  return `net use "${cleanShare}" ${cleanPass} /user:"${cleanUser}" /persistent:no`;
}

export function buildNetUseDisconnectCommand(sharePath: string): string {
  const cleanShare = extractUncShare(sharePath) || sharePath.trim();
  return cleanShare ? `net use "${cleanShare}" /delete /y` : 'net use * /delete /y';
}

export function generateNasBatchScript(job: BackupJob, nasAuth?: { server: string; sharePath: string; username: string; password?: string; authMode: 'cmdkey' | 'net_use'; autoDisconnect: boolean }): string {
  const robocopyCmd = buildRobocopyCommand(job.sourcePath, job.targetPath, job.flags);
  const share = extractUncShare(nasAuth?.sharePath || '') || extractUncShare(job.targetPath) || extractUncShare(job.sourcePath) || '\\\\YOUR_NAS_IP_OR_HOST\\SHARE_NAME';
  const server = nasAuth?.server || extractUncServer(share) || extractUncServer(job.targetPath) || 'YOUR_NAS_IP_OR_HOST';
  const user = nasAuth?.username || 'admin';
  const pass = nasAuth?.password || 'YOUR_PASSWORD';

  if (nasAuth?.authMode === 'cmdkey') {
    return `@echo off
chcp 65001 >nul
echo ====================================================================
echo [RoboBackup Studio] NAS Windows Credential Auto-Backup
echo ====================================================================
echo Target NAS Server: ${server}
echo (Windows Credential Manager / cmdkey 자격 증명을 사용하여 인증합니다)
echo.

echo [*] Testing NAS Network Connectivity...
ping -n 1 ${server} >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] NAS Ping 응답이 없습니다. 방화벽 설정에 따라 정상일 수 있습니다.
)

echo [*] Starting Robocopy High-Speed Sync...
${robocopyCmd}
set ROBO_EXIT=%errorlevel%

echo.
if %ROBO_EXIT% leq 7 (
    echo [SUCCESS] Backup completed successfully with exit code: %ROBO_EXIT%
) else (
    echo [ERROR] Backup finished with errors or warnings. Exit code: %ROBO_EXIT%
)
exit /b %ROBO_EXIT%`;
  }

  // net use mode
  return `@echo off
chcp 65001 >nul
echo ====================================================================
echo [RoboBackup Studio] NAS Network Session Auto-Backup (net use)
echo ====================================================================
echo.

echo [1/3] Connecting SMB Session to NAS: ${share}...
net use "${share}" "${pass}" /user:"${user}" /persistent:no
if %errorlevel% neq 0 (
    echo [ERROR] NAS 네트워크 연결 및 계정 인증 실패!
    echo 아이디 및 비밀번호를 확인하세요.
    pause
    exit /b 1
)

echo [2/3] Executing Robocopy Multi-Thread Sync...
${robocopyCmd}
set ROBO_EXIT=%errorlevel%

${nasAuth?.autoDisconnect ? `echo [3/3] Disconnecting Temporary NAS Session...
net use "${share}" /delete /y` : `echo [3/3] NAS Session Kept Alive.`}

echo.
if %ROBO_EXIT% leq 7 (
    echo [SUCCESS] Robocopy completed successfully. (ExitCode: %ROBO_EXIT%)
) else (
    echo [ERROR] Robocopy reported errors. (ExitCode: %ROBO_EXIT%)
)
exit /b %ROBO_EXIT%`;
}

export const PRESET_PROFILES: PresetProfile[] = [
  {
    id: 'fast_mirror',
    name: '🚀 고속 미러 백업 (Fast Mirror)',
    description: '16스레드 다중 처리와 FAT 시간차 허용(/FFT)을 사용하여 변경된 파일만 초고속으로 동기화합니다.',
    category: 'mirror',
    icon: 'Zap',
    flags: {
      mirror: true,
      threads: 16,
      restartableBackupMode: true,
      retryCount: 2,
      waitTime: 3,
      fft: true,
      excludeFiles: ['*.tmp', '~$*', 'desktop.ini', 'Thumbs.db'],
      excludeDirs: ['$RECYCLE.BIN', 'System Volume Information', 'node_modules'],
    },
  },
  {
    id: 'safe_incremental',
    name: '🛡️ 안전 증분 백업 (Safe Incremental)',
    description: '원본 삭제 없이 하위 폴더의 모든 신규/수정된 파일만 보존하며 안전하게 백업합니다.',
    category: 'incremental',
    icon: 'Shield',
    flags: {
      mirror: false,
      copySubdirsWithEmpty: true,
      purge: false,
      threads: 8,
      restartableBackupMode: true,
      retryCount: 3,
      waitTime: 5,
      fft: true,
    },
  },
  {
    id: 'nas_network',
    name: '🌐 NAS & 네트워크 공유 동기화',
    description: '네트워크 재연결 모드(/ZB)와 패킷 지연 최소화 세팅으로 안정성을 극대화합니다.',
    category: 'nas',
    icon: 'HardDrive',
    flags: {
      mirror: true,
      threads: 8,
      restartableBackupMode: true,
      retryCount: 5,
      waitTime: 10,
      fft: true,
    },
  },
  {
    id: 'system_image',
    name: '🔐 시스템 및 보안 권한 백업',
    description: '파일 데이터뿐만 아니라 NTFS ACL 보안 권한 및 소유자 정보까지 복사합니다.',
    category: 'system',
    icon: 'Lock',
    flags: {
      mirror: true,
      backupMode: true,
      threads: 4,
      retryCount: 5,
      waitTime: 5,
      customFlags: '/COPY:DATSOU',
    },
  },
  {
    id: 'documents_photos',
    name: '📁 문서 & 사진 미디어 아카이브',
    description: '32스레드로 대량의 소형 이미지 및 문서 파일 복사 속도를 최적화합니다.',
    category: 'media',
    icon: 'FolderArchive',
    flags: {
      mirror: false,
      copySubdirsWithEmpty: true,
      threads: 32,
      retryCount: 1,
      waitTime: 2,
      fft: true,
      excludeFiles: ['*.tmp', '*.log', '~$*'],
    },
  },
];

export function generateSchtasksCommand(job: BackupJob): string {
  const taskName = job.schedule.taskName?.trim() || `RoboBackup_${job.name.replace(/[^a-zA-Z0-9_]/g, '')}`;
  const robocopyCmd = buildRobocopyCommand(job.sourcePath, job.targetPath, job.flags);
  
  let scheduleArgs = '';
  if (job.schedule.frequency === 'daily') {
    scheduleArgs = `/sc DAILY /st ${job.schedule.dailyTime || '03:00'}`;
  } else if (job.schedule.frequency === 'weekly') {
    scheduleArgs = `/sc WEEKLY /d MON,WED,FRI /st ${job.schedule.dailyTime || '03:00'}`;
  } else if (job.schedule.frequency === 'interval') {
    scheduleArgs = `/sc MINUTE /mo ${job.schedule.intervalMinutes || 60}`;
  } else {
    scheduleArgs = `/sc ONLOGON`;
  }

  const privs = job.schedule.runWithHighestPrivileges ? '/rl HIGHEST' : '';

  return `schtasks /create /tn "${taskName}" /tr "cmd.exe /c ${robocopyCmd}" ${scheduleArgs} ${privs} /f`;
}

export function generateTaskSchedulerXml(job: BackupJob): string {
  const taskName = job.schedule.taskName?.trim() || `RoboBackup_${job.name.replace(/[^a-zA-Z0-9_]/g, '')}`;
  const robocopyCmd = buildRobocopyCommand(job.sourcePath, job.targetPath, job.flags);

  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>${new Date().toISOString()}</Date>
    <Author>RoboBackup Studio</Author>
    <Description>Robocopy Scheduled Backup: ${job.name}</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${new Date().toISOString().split('T')[0]}T${job.schedule.dailyTime || '03:00'}:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <RunLevel>${job.schedule.runWithHighestPrivileges ? 'HighestAvailable' : 'LeastPrivilege'}</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <ExecutionTimeLimit>PT4H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>cmd.exe</Command>
      <Arguments>/c \${robocopyCmd}</Arguments>
    </Exec>
  </Actions>
</Task>`;
}

export const CSHARP_MVVM_TEMPLATES: CsharpSnippet[] = [
  {
    id: 'mainwindow_xaml',
    title: 'MainWindow.xaml (UI View)',
    filename: 'Views/MainWindow.xaml',
    language: 'xml',
    description: '드래그 앤 드롭 파일/폴더 선택, 실시간 진행률, 스케줄 상태 조회/삭제 및 오래된 파일 자동정리 탭이 완비된 다크 테마 WPF UI 레이아웃입니다.',
    code: `<Window x:Class="RoboBackupStudio.Views.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:vm="clr-namespace:RoboBackupStudio.ViewModels"
        mc:Ignorable="d"
        Title="RoboBackup Studio v2.17.8 - High Performance Robocopy Studio" Height="880" Width="1160"
        Background="#0b0f19" Foreground="#f8fafc">

    <Window.DataContext>
        <vm:MainViewModel/>
    </Window.DataContext>

    <Window.Resources>
        <BooleanToVisibilityConverter x:Key="BooleanToVisibilityConverter"/>
        
        <!-- High Contrast ComboBox Style (Dark Black Text on Light Box) -->
        <Style TargetType="ComboBox">
            <Setter Property="Background" Value="#f8fafc"/>
            <Setter Property="Foreground" Value="#0f172a"/>
            <Setter Property="BorderBrush" Value="#64748b"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10,6"/>
            <Setter Property="VerticalContentAlignment" Value="Center"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
        </Style>

        <!-- ComboBoxItem Style (Crisp Black Text in Dropdown) -->
        <Style TargetType="ComboBoxItem">
            <Setter Property="Background" Value="#ffffff"/>
            <Setter Property="Foreground" Value="#0f172a"/>
            <Setter Property="Padding" Value="10,8"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="Background" Value="#2563eb"/>
                    <Setter Property="Foreground" Value="#ffffff"/>
                </Trigger>
                <Trigger Property="IsSelected" Value="True">
                    <Setter Property="Background" Value="#1d4ed8"/>
                    <Setter Property="Foreground" Value="#ffffff"/>
                </Trigger>
            </Style.Triggers>
        </Style>

        <!-- DatePicker Style (Crisp Black Text) -->
        <Style TargetType="DatePicker">
            <Setter Property="Background" Value="#f8fafc"/>
            <Setter Property="Foreground" Value="#0f172a"/>
            <Setter Property="BorderBrush" Value="#64748b"/>
            <Setter Property="Padding" Value="6,4"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
        </Style>
    </Window.Resources>

    <Grid Margin="16">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <!-- Top Header Navigation Bar -->
        <Border Grid.Row="0" Background="#1e293b" CornerRadius="12" Padding="16,12" Margin="0,0,0,16" BorderThickness="1" BorderBrush="#334155">
            <DockPanel>
                <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                    <Border Background="#2563eb" CornerRadius="8" Width="36" Height="36" Margin="0,0,12,0">
                        <TextBlock Text="⚡" Foreground="White" FontSize="20" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                    </Border>
                    <StackPanel VerticalAlignment="Center">
                        <StackPanel Orientation="Horizontal">
                            <TextBlock Text="RoboBackup" Foreground="#ffffff" FontSize="20" FontWeight="Bold"/>
                            <TextBlock Text="Studio" Foreground="#60a5fa" FontSize="20" FontWeight="Bold" Margin="4,0,0,0"/>
                            <Border Background="#10b981" CornerRadius="10" Padding="8,2" Margin="10,0,0,0" VerticalAlignment="Center">
                                <TextBlock Text="v2.17.8" Foreground="White" FontSize="11" FontWeight="Bold"/>
                            </Border>
                        </StackPanel>
                        <TextBlock Text="Windows High-Speed Robocopy GUI &amp; C# WPF Generator" Foreground="#94a3b8" FontSize="11"/>
                    </StackPanel>
                </StackPanel>

                <StackPanel DockPanel.Dock="Right" Orientation="Horizontal" HorizontalAlignment="Right" VerticalAlignment="Center">
                    <!-- Admin Status Badge & Restart Button -->
                    <Button Command="{Binding RestartAsAdminCommand}" Height="30" Padding="10,2" Margin="0,0,10,0" Background="#1e1b4b" Foreground="#a5b4fc" BorderBrush="#6366f1" BorderThickness="1" Cursor="Hand">
                        <TextBlock Text="{Binding AdminStatusText}" FontSize="12" FontWeight="SemiBold"/>
                    </Button>
                    <Border Background="#0f172a" CornerRadius="8" Padding="12,6" BorderThickness="1" BorderBrush="#334155">
                        <StackPanel Orientation="Horizontal">
                            <TextBlock Text="상태: " Foreground="#94a3b8" FontSize="12"/>
                            <TextBlock Text="{Binding StatusText}" Foreground="#38bdf8" FontSize="12" FontWeight="Bold"/>
                        </StackPanel>
                    </Border>
                </StackPanel>
            </DockPanel>
        </Border>

        <!-- Main Tab Workspace -->
        <TabControl Grid.Row="1" Background="Transparent" BorderThickness="0">
            <!-- TAB 1: 백업 프로필 설계 -->
            <TabItem Header="🎯 백업 프로필 설계">
                <!-- 원본/대상 경로 바인딩 및 Robocopy 플래그 설정 구역 -->
            </TabItem>

            <!-- TAB 2: 라이브 동기화 -->
            <TabItem Header="⚡ 라이브 동기화">
                <!-- 실시간 Robocopy 실행 제어 및 로그 출력 구역 -->
            </TabItem>

            <!-- TAB 3: 작업 스케줄러 (Task Scheduler) -->
            <TabItem Header="⏰ 작업 스케줄러">
                <Border Background="#1e293b" CornerRadius="12" Padding="24" Margin="0,16,0,0" BorderThickness="1" BorderBrush="#334155">
                    <StackPanel MaxWidth="800">
                        <!-- Task Registration Status Box -->
                        <Border Background="#0f172a" CornerRadius="10" Padding="16" Margin="0,0,0,20" BorderThickness="1" BorderBrush="#334155">
                            <StackPanel>
                                <DockPanel Margin="0,0,0,8">
                                    <StackPanel Orientation="Horizontal" DockPanel.Dock="Left">
                                        <TextBlock Text="📋 작업 스케줄러 등록 현황: " Foreground="#cbd5e1" FontSize="14" FontWeight="Bold"/>
                                        <TextBlock Text="{Binding TaskStatusSummary}" Foreground="#38bdf8" FontSize="14" FontWeight="Bold"/>
                                    </StackPanel>
                                    <StackPanel Orientation="Horizontal" DockPanel.Dock="Right" HorizontalAlignment="Right">
                                        <Button Command="{Binding RefreshTaskStatusCommand}" Content="🔄 현황 새로고침" Padding="8,4" Margin="0,0,6,0" Background="#334155" Foreground="#f8fafc" Cursor="Hand"/>
                                        <Button Command="{Binding DeleteTaskCommand}" Content="🗑️ 작업 스케줄 삭제" Padding="8,4" Background="#991b1b" Foreground="#ffffff" Cursor="Hand"/>
                                    </StackPanel>
                                </DockPanel>
                                <TextBox Text="{Binding TaskStatusDetails}" IsReadOnly="True" TextWrapping="Wrap" Background="#020617" Foreground="#a7f3d0" FontFamily="Consolas" FontSize="11" Padding="8"/>
                            </StackPanel>
                        </Border>

                        <!-- Frequency & Date Picker Grid -->
                        <Grid Margin="0,0,0,16">
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="*"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>
                            <StackPanel Grid.Column="0" Margin="0,0,12,0">
                                <TextBlock Text="🔄 스케줄 실행 주기" Foreground="#cbd5e1" FontSize="13" FontWeight="Bold" Margin="0,0,0,6"/>
                                <ComboBox SelectedValue="{Binding ScheduleFrequency, Mode=TwoWay}" SelectedValuePath="Tag" Height="38">
                                    <ComboBoxItem Content="📅 매일 실행 (Daily)" Tag="daily" IsSelected="True"/>
                                    <ComboBoxItem Content="🗓️ 매주 실행 (Weekly)" Tag="weekly"/>
                                    <ComboBoxItem Content="⏱️ 매시간 실행 (Hourly)" Tag="hourly"/>
                                </ComboBox>
                            </StackPanel>
                            <StackPanel Grid.Column="1">
                                <TextBlock Text="📅 백업 시작 날짜" Foreground="#cbd5e1" FontSize="13" FontWeight="Bold" Margin="0,0,0,6"/>
                                <DatePicker SelectedDate="{Binding ScheduleStartDate}" Height="38" VerticalContentAlignment="Center"/>
                            </StackPanel>
                        </Grid>

                        <Button Command="{Binding RegisterTaskCommand}" Content="📅 윈도우 작업 스케줄러에 신규 작업 등록하기" Height="44" Background="#2563eb" Foreground="White" FontSize="14" FontWeight="Bold" BorderThickness="0" Cursor="Hand"/>
                    </StackPanel>
                </Border>
            </TabItem>

            <!-- TAB 4: 오래된 파일 자동 정리 (Auto Cleanup) -->
            <TabItem Header="🧹 오래된 파일 자동정리">
                <Border Background="#1e293b" CornerRadius="12" Padding="24" Margin="0,16,0,0" BorderThickness="1" BorderBrush="#334155">
                    <StackPanel MaxWidth="800">
                        <TextBlock Text="🧹 백업/아카이브 폴더 오래된 파일 자동 정리" Foreground="#ffffff" FontSize="16" FontWeight="Bold" Margin="0,0,0,8"/>
                        
                        <StackPanel Margin="0,0,0,16">
                            <TextBlock Text="📂 정리 대상 폴더 경로" Foreground="#cbd5e1" FontSize="13" FontWeight="Bold" Margin="0,0,0,6"/>
                            <Grid>
                                <Grid.ColumnDefinitions>
                                    <ColumnDefinition Width="*"/>
                                    <ColumnDefinition Width="Auto"/>
                                </Grid.ColumnDefinitions>
                                <TextBox Grid.Column="0" Text="{Binding CleanupFolderPath, UpdateSourceTrigger=PropertyChanged}" Background="#0f172a" Foreground="#f8fafc" Padding="10"/>
                                <Button Grid.Column="1" Command="{Binding BrowseCleanupFolderCommand}" Content="📁 찾아보기..." Padding="16,0" Margin="8,0,0,0" Background="#334155" Foreground="White"/>
                            </Grid>
                        </StackPanel>

                        <Grid Margin="0,0,0,16">
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="*"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>
                            <StackPanel Grid.Column="0" Margin="0,0,12,0">
                                <TextBlock Text="⚙️ 삭제 조건 규칙" Foreground="#cbd5e1" FontSize="13" FontWeight="Bold" Margin="0,0,0,6"/>
                                <RadioButton Content="📅 기간 기준 (N일 이상 경과)" IsChecked="{Binding IsCleanupTypeDays, Mode=OneWay}" GroupName="CleanupTypeGroup" Foreground="#f8fafc"/>
                                <RadioButton Content="💾 용량 기준 (총 N GB 초과 시)" IsChecked="{Binding IsCleanupTypeSize, Mode=OneWay}" GroupName="CleanupTypeGroup" Foreground="#f8fafc" Margin="0,6,0,0"/>
                                <RadioButton Content="⚡ 모두 적용 (기간 + 용량 결합)" IsChecked="{Binding IsCleanupTypeBoth, Mode=OneWay}" GroupName="CleanupTypeGroup" Foreground="#a7f3d0" Margin="0,6,0,0"/>
                            </StackPanel>
                            <StackPanel Grid.Column="1">
                                <TextBlock Text="📊 상세 임계값 설정" Foreground="#cbd5e1" FontSize="13" FontWeight="Bold" Margin="0,0,0,6"/>
                                <TextBox Text="{Binding CleanupDays}" Visibility="{Binding IsCleanupTypeDays, Converter={StaticResource BooleanToVisibilityConverter}}" Background="#0f172a" Foreground="#38bdf8" Padding="8" FontSize="14"/>
                                <TextBox Text="{Binding CleanupMaxGb}" Visibility="{Binding IsCleanupTypeSize, Converter={StaticResource BooleanToVisibilityConverter}}" Background="#0f172a" Foreground="#38bdf8" Padding="8" FontSize="14"/>
                            </StackPanel>
                        </Grid>

                        <Grid Margin="0,0,0,16">
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="*"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>
                            <Button Grid.Column="0" Command="{Binding ScanCleanupFilesCommand}" Content="🔍 대상 파일 스캔 (미리보기)" Height="40" Margin="0,0,6,0" Background="#2563eb" Foreground="White"/>
                            <Button Grid.Column="1" Command="{Binding ExecuteCleanupCommand}" Content="⚠️ 오래된 파일 정리 실행" Height="40" Margin="6,0,0,0" Background="#dc2626" Foreground="White"/>
                        </Grid>

                        <Border Background="#0f172a" CornerRadius="8" Padding="12" BorderThickness="1" BorderBrush="#334155">
                            <ListBox ItemsSource="{Binding CleanupPreviewList}" Height="130" Background="#020617" Foreground="#cbd5e1" FontFamily="Consolas" FontSize="11"/>
                        </Border>
                    </StackPanel>
                </Border>
            </TabItem>
        </TabControl>
    </Grid>
</Window>`
  },
  {
    id: 'main_viewmodel',
    title: 'MainViewModel.cs (ViewModel)',
    filename: 'ViewModels/MainViewModel.cs',
    language: 'csharp',
    description: 'UAC 권한 판단, 작업 스케줄러 등록/조회/삭제 및 오래된 파일 기간별/용량별 클린업 로직이 집약된 핵심 비즈니스 로직 ViewModel 클래스입니다.',
    code: `using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace RoboBackupStudio.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        // Properties
        private string _sourcePath = @"C:\\SourceFolder";
        private string _destinationPath = @"D:\\BackupTarget";
        private string _statusText = "대기 중 (Ready)";
        private bool _isAdmin = false;
        private bool _isTaskRegistered = false;
        private string _taskStatusDetails = "스케줄 상태 확인 중...";

        // Auto Cleanup Configuration & Task Scheduler (v1.3.0)
        private string _cleanupFolderPath = @"C:\\RoboBackup\\Archives";
        private string _cleanupType = "days"; // "days" or "size"
        private int _cleanupDays = 30;
        private double _cleanupMaxGb = 100.0;
        private bool _cleanupIncludeSubdirs = true;
        private string _cleanupFilePattern = "*.*";
        private ObservableCollection<string> _cleanupPreviewList = new ObservableCollection<string>();
        private string _cleanupStatusSummary = "정기 파일 삭제 규칙을 설정하고 스캔하세요.";

        // Cleanup Scheduler
        private string _cleanupScheduleFrequency = "weekly";
        private DateTime _cleanupScheduleStartDate = DateTime.Today;
        private int _cleanupScheduleHour = 4;
        private int _cleanupScheduleMinute = 0;
        private bool _cleanupRunWithHighestPrivileges = true;
        private bool _isCleanupTaskRegistered = false;
        private string _cleanupTaskStatusDetails = "자동정리 스케줄 상태 확인 중...";

        public MainViewModel()
        {
            IsAdmin = CheckIsAdmin();
            RestartAsAdminCommand = new RelayCommand(_ => RestartAsAdmin());
            RefreshTaskStatusCommand = new RelayCommand(_ => CheckScheduledTaskStatus());
            DeleteTaskCommand = new RelayCommand(_ => DeleteTask());

            // Auto Cleanup Scheduler Commands
            RegisterCleanupTaskCommand = new RelayCommand(_ => RegisterCleanupTask());
            RefreshCleanupTaskStatusCommand = new RelayCommand(_ => CheckCleanupTaskStatus());
            DeleteCleanupTaskCommand = new RelayCommand(_ => DeleteCleanupTask());

            BrowseCleanupFolderCommand = new RelayCommand(_ => BrowseCleanupFolder());
            ScanCleanupFilesCommand = new RelayCommand(_ => ScanCleanupFiles());
            ExecuteCleanupCommand = new RelayCommand(_ => ExecuteCleanup());

            CheckScheduledTaskStatus();
            CheckCleanupTaskStatus();
        }

        public bool IsAdmin
        {
            get => _isAdmin;
            set { _isAdmin = value; OnPropertyChanged(); OnPropertyChanged(nameof(AdminStatusText)); }
        }

        public string AdminStatusText => IsAdmin ? "🛡️ 관리자 권한 실행 중" : "⚠️ 일반 권한 실행 중";

        public bool IsTaskRegistered
        {
            get => _isTaskRegistered;
            set { _isTaskRegistered = value; OnPropertyChanged(); OnPropertyChanged(nameof(TaskStatusSummary)); }
        }

        public string TaskStatusDetails
        {
            get => _taskStatusDetails;
            set { _taskStatusDetails = value; OnPropertyChanged(); }
        }

        public string TaskStatusSummary => IsTaskRegistered ? "🟢 작업 스케줄 등록됨 (Active)" : "⚪ 작업 스케줄 미등록 (Not Registered)";

        // Auto Cleanup Encapsulations
        public string CleanupFolderPath
        {
            get => _cleanupFolderPath;
            set { _cleanupFolderPath = value; OnPropertyChanged(); }
        }

        public string CleanupType
        {
            get => _cleanupType;
            set { _cleanupType = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCleanupTypeDays)); OnPropertyChanged(nameof(IsCleanupTypeSize)); }
        }

        public bool IsCleanupTypeDays => CleanupType == "days";
        public bool IsCleanupTypeSize => CleanupType == "size";

        public int CleanupDays
        {
            get => _cleanupDays;
            set { _cleanupDays = Math.Max(1, value); OnPropertyChanged(); }
        }

        public double CleanupMaxGb
        {
            get => _cleanupMaxGb;
            set { _cleanupMaxGb = Math.Max(0.1, value); OnPropertyChanged(); }
        }

        public bool CleanupIncludeSubdirs
        {
            get => _cleanupIncludeSubdirs;
            set { _cleanupIncludeSubdirs = value; OnPropertyChanged(); }
        }

        public string CleanupFilePattern
        {
            get => _cleanupFilePattern;
            set { _cleanupFilePattern = value; OnPropertyChanged(); }
        }

        public ObservableCollection<string> CleanupPreviewList => _cleanupPreviewList;

        public string CleanupStatusSummary
        {
            get => _cleanupStatusSummary;
            set { _cleanupStatusSummary = value; OnPropertyChanged(); }
        }

        // Robocopy Subdirectory Flag Bindings (v2.16.8)
        private bool _isE = true;
        private bool _isS = false;
        private bool _isMir = false;
        public bool IsE { get => _isE; set { _isE = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCopySubdirectoriesWithEmpty)); } }
        public bool IsS { get => _isS; set { _isS = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCopySubdirectoriesNoEmpty)); } }
        public bool IsMir { get => _isMir; set { _isMir = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCopySubdirectoriesWithEmpty)); } }
        public bool IsCopySubdirectoriesWithEmpty { get => IsE || IsMir; set { IsE = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCopySubdirectoriesWithEmpty)); } }
        public bool IsCopySubdirectoriesNoEmpty { get => IsS; set { IsS = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsCopySubdirectoriesNoEmpty)); } }

        // Commands
        public ICommand RestartAsAdminCommand { get; }
        public ICommand RefreshTaskStatusCommand { get; }
        public ICommand DeleteTaskCommand { get; }
        public ICommand BrowseCleanupFolderCommand { get; }
        public ICommand ScanCleanupFilesCommand { get; }
        public ICommand ExecuteCleanupCommand { get; }

        private bool CheckIsAdmin()
        {
            try
            {
                using var identity = WindowsIdentity.GetCurrent();
                var principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch { return false; }
        }

        private void RestartAsAdmin()
        {
            try
            {
                var exePath = Environment.ProcessPath;
                if (string.IsNullOrEmpty(exePath)) return;
                var psi = new ProcessStartInfo { FileName = exePath, UseShellExecute = true, Verb = "runas" };
                Process.Start(psi);
                Application.Current.Shutdown();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"재시작 실패: {ex.Message}", "알림");
            }
        }

        public void CheckScheduledTaskStatus()
        {
            try
            {
                string taskName = "RoboBackupStudio_AutoSync";
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "schtasks.exe",
                    Arguments = $"/query /tn \\"{taskName}\\" /fo LIST",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.Default
                };

                using Process p = Process.Start(psi);
                string output = p.StandardOutput.ReadToEnd();
                p.WaitForExit();

                if (p.ExitCode == 0 && !string.IsNullOrWhiteSpace(output))
                {
                    IsTaskRegistered = true;
                    TaskStatusDetails = output.Trim();
                    
                    // Parse Last Result for Error Detection (v2.17.8)
                    if (output.Contains("마지막 결과:") || output.Contains("Last Result:"))
                    {
                        var lines = output.Split(new[] { "\\r\\n", "\\n" }, StringSplitOptions.None);
                        foreach (var line in lines)
                        {
                            if (line.Contains("마지막 결과:") || line.Contains("Last Result:"))
                            {
                                string result = line.Split(':').Last().Trim();
                                if (result != "0" && result != "0x0" && !result.Contains("(0)"))
                                {
                                    StatusText = "⚠️ 스케줄 오류 감지!";
                                    // Notify user of task failure
                                    System.Windows.Forms.MessageBox.Show($"[알림] 스케줄 작업 '{taskName}'이(가) 비정상 종료되었습니다.\\n마지막 결과 코드: {result}", "스케줄러 경고", System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Warning);
                                }
                                break;
                            }
                        }
                    }
                }
                else
                {
                    IsTaskRegistered = false;
                    TaskStatusDetails = "등록된 자동 백업 스케줄이 없습니다.";
                }
            }
            catch { IsTaskRegistered = false; }
        }

        private void DeleteTask()
        {
            try
            {
                string taskName = "RoboBackupStudio_AutoSync";
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "schtasks.exe",
                    Arguments = $"/delete /tn \\"{taskName}\\" /f",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using Process p = Process.Start(psi);
                p.WaitForExit();
                MessageBox.Show("작업 스케줄이 정상적으로 삭제되었습니다.");
                CheckScheduledTaskStatus();
            }
            catch (Exception ex) { MessageBox.Show(ex.Message); }
        }

        // Auto Cleanup Core Logic (기간별/용량별 삭제)
        private List<FileInfo> GetCandidateFilesForCleanup()
        {
            var results = new List<FileInfo>();
            if (!Directory.Exists(CleanupFolderPath)) return results;

            SearchOption searchOption = CleanupIncludeSubdirs ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;
            DirectoryInfo dir = new DirectoryInfo(CleanupFolderPath);

            var files = dir.GetFiles(string.IsNullOrWhiteSpace(CleanupFilePattern) ? "*.*" : CleanupFilePattern, searchOption)
                           .OrderBy(f => f.LastWriteTime).ToList();

            if (CleanupType == "days")
            {
                DateTime cutoffDate = DateTime.Now.AddDays(-CleanupDays);
                results = files.Where(f => f.LastWriteTime < cutoffDate).ToList();
            }
            else if (CleanupType == "size")
            {
                long targetMaxBytes = (long)(CleanupMaxGb * 1024 * 1024 * 1024);
                long totalBytes = files.Sum(f => f.Length);

                if (totalBytes > targetMaxBytes)
                {
                    long bytesToPurge = totalBytes - targetMaxBytes;
                    long accumulatedPurge = 0;

                    foreach (var file in files)
                    {
                        if (accumulatedPurge >= bytesToPurge) break;
                        results.Add(file);
                        accumulatedPurge += file.Length;
                    }
                }
            }
            return results;
        }

        private void ScanCleanupFiles()
        {
            if (!Directory.Exists(CleanupFolderPath)) return;
            CleanupPreviewList.Clear();
            var candidates = GetCandidateFilesForCleanup();

            long totalBytes = candidates.Sum(f => f.Length);
            CleanupStatusSummary = $"스캔 완료: 총 {candidates.Count}개 파일 ({totalBytes / 1024.0 / 1024.0:N2} MB) 삭제 대상";
            foreach (var f in candidates)
            {
                CleanupPreviewList.Add($"[{f.LastWriteTime:yyyy-MM-dd HH:mm}] ({f.Length / 1024.0 / 1024.0:N2} MB) {f.FullName}");
            }
        }

        private void ExecuteCleanup()
        {
            var candidates = GetCandidateFilesForCleanup();
            if (candidates.Count == 0) return;

            var confirm = MessageBox.Show($"총 {candidates.Count}개 파일을 영구 삭제하시겠습니까?", "확인", MessageBoxButton.YesNo);
            if (confirm != MessageBoxResult.Yes) return;

            foreach (var file in candidates)
            {
                try { file.Delete(); } catch { }
            }
            ScanCleanupFiles();
        }

        public event PropertyChangedEventHandler PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}`
  },
  {
    id: 'robocopy_service',
    title: 'RobocopyService.cs (Process Control & Parser)',
    filename: 'Services/RobocopyService.cs',
    language: 'csharp',
    description: 'Robocopy.exe 백그라운드 프로세스 비동기 실행 및 실시간 Output Stream 정규식 파싱 서비스입니다.',
    code: `using System;
using System.Diagnostics;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio.Services
{
    public class RobocopyResult
    {
        public int ExitCode { get; set; }
        public bool IsSuccess => ExitCode <= 7; // Robocopy exit code <= 7 means success or minor differences
    }

    public class RobocopyService
    {
        public event EventHandler<string> LogReceived;
        public event EventHandler<int> ProgressChanged;

        private static readonly Regex ProgressRegex = new Regex(@"(\\d{1,3})\\s*%", RegexOptions.Compiled);

        public async Task<RobocopyResult> ExecuteBackupAsync(
            string source, 
            string destination, 
            string arguments, 
            CancellationToken cancellationToken)
        {
            var fullArguments = $"\\"{source}\\" \\"{destination}\\" {arguments}";

            var psi = new ProcessStartInfo
            {
                FileName = "robocopy.exe",
                Arguments = fullArguments,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = System.Text.Encoding.Default
            };

            using (var process = new Process { StartInfo = psi })
            {
                process.OutputDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                    {
                        LogReceived?.Invoke(this, e.Data);

                        // 진행률 (%) 추출 정규식
                        var match = ProgressRegex.Match(e.Data);
                        if (match.Success && int.TryParse(match.Groups[1].Value, out int percent))
                        {
                            ProgressChanged?.Invoke(this, percent);
                        }
                    }
                };

                process.Start();
                process.BeginOutputReadLine();

                using (cancellationToken.Register(() =>
                {
                    try
                    {
                        if (!process.HasExited)
                        {
                            process.Kill(true);
                        }
                    }
                    catch { }
                }))
                {
                    await Task.Run(() => process.WaitForExit(), cancellationToken);
                }

                return new RobocopyResult { ExitCode = process.ExitCode };
            }
        }
    }
}`
  },
  {
    id: 'app_manifest',
    title: 'app.manifest (UAC Configuration)',
    filename: 'app.manifest',
    language: 'xml',
    description: 'WPF 애플리케이션 시작 시 항상 로컬 관리자 권한(UAC Elevation)을 명시적으로 요구하는 매니페스트 설정입니다.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.0.0.0" name="RoboBackupStudio.app"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <!-- 항상 관리자 권한 승인 창(UAC) 요청 -->
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>`
  },
  {
    id: 'program_cs',
    title: 'Program.cs (Dual GUI / Windows Service Entry Point)',
    filename: 'Program.cs',
    language: 'csharp',
    description: '일반 실행 시 WPF GUI(App.xaml)를 실행하고, SCM/--service 실행 시 ServiceBase.Run()을 즉시 호출하여 오류 1053 없는 백그라운드 서비스 데몬을 구동하는 스마트 진입점입니다.',
    code: `using System;
using System.IO;
using System.Linq;
using System.ServiceProcess;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio
{
    public static class Program
    {
        [STAThread]
        public static void Main(string[] args)
        {
            // Register process-level unhandled exception handler
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                var ex = e.ExceptionObject as Exception;
                App.LogServiceEvent($"[Process Unhandled Exception] {ex?.ToString()}");
            };

            // Detect if running as a Windows Service (SCM invocation or explicit argument)
            bool isServiceFlag = args != null && args.Any(arg =>
                arg.Equals("--service", StringComparison.OrdinalIgnoreCase) ||
                arg.Equals("/service", StringComparison.OrdinalIgnoreCase) ||
                arg.Equals("-service", StringComparison.OrdinalIgnoreCase));

            // When Windows Service Control Manager (SCM) starts a service in Session 0,
            // Environment.UserInteractive is false, or the --service parameter is passed.
            if (isServiceFlag || !Environment.UserInteractive)
            {
                try
                {
                    App.LogServiceEvent("RoboBackupStudio initiating Windows Service Control Manager handshake (ServiceBase.Run)...");
                    ServiceBase.Run(new RoboBackupWindowsService());
                    return;
                }
                catch (Exception ex)
                {
                    App.LogServiceEvent($"[Windows Service Startup Error] {ex}");
                    return;
                }
            }

            // Normal Desktop Interactive GUI Mode (WPF)
            try
            {
                var app = new App();
                app.Run();
            }
            catch (Exception ex)
            {
                App.LogServiceEvent($"[WPF Application Startup Error] {ex}");
            }
        }
    }
}`
  },
  {
    id: 'robobackup_service_cs',
    title: 'RoboBackupWindowsService.cs (Windows Service Engine)',
    filename: 'Services/RoboBackupWindowsService.cs',
    language: 'csharp',
    description: 'Windows SCM 핸드셰이크(OnStart/OnStop/OnShutdown)와 백그라운드 스케줄러 큐 감시 및 무인 백업을 실행하는 윈도우 서비스 엔진입니다.',
    code: `using System;
using System.Diagnostics;
using System.IO;
using System.ServiceProcess;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio
{
    public class RoboBackupWindowsService : ServiceBase
    {
        private CancellationTokenSource? _cts;
        private Task? _workerTask;

        public RoboBackupWindowsService()
        {
            ServiceName = "RoboBackupService";
            CanStop = true;
            CanShutdown = true;
            CanPauseAndContinue = false;
            AutoLog = true;
        }

        protected override void OnStart(string[] args)
        {
            App.LogServiceEvent("=== [RoboBackupService] Windows Service Started Successfully (SCM Handshake OK) ===");
            _cts = new CancellationTokenSource();
            _workerTask = Task.Run(() => WorkerLoopAsync(_cts.Token));
        }

        protected override void OnStop()
        {
            App.LogServiceEvent("=== [RoboBackupService] Windows Service Stopping... ===");
            try
            {
                _cts?.Cancel();
                _workerTask?.Wait(TimeSpan.FromSeconds(5));
            }
            catch (Exception ex)
            {
                App.LogServiceEvent($"[RoboBackupService Stop Exception] {ex.Message}");
            }
            finally
            {
                App.LogServiceEvent("=== [RoboBackupService] Windows Service Stopped ===");
            }
        }

        protected override void OnShutdown()
        {
            App.LogServiceEvent("=== [RoboBackupService] System Shutdown Detected. Terminating Service Cleanly ===");
            OnStop();
        }

        private async Task WorkerLoopAsync(CancellationToken token)
        {
            App.LogServiceEvent("[RoboBackupService] Background Worker Engine Active (Monitoring Schedules, Tasks & NAS Connectivity).");

            while (!token.IsCancellationRequested)
            {
                try
                {
                    App.LogServiceEvent($"[RoboBackupService Heartbeat] Service running normally at {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
                    CheckAndExecuteQueuedTasks();
                }
                catch (Exception ex)
                {
                    App.LogServiceEvent($"[RoboBackupService Worker Loop Error] {ex.Message}");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(1), token);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private void CheckAndExecuteQueuedTasks()
        {
            try
            {
                string baseDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RoboBackupStudio");
                string queueDir = Path.Combine(baseDir, "Queue");
                if (Directory.Exists(queueDir))
                {
                    var scriptFiles = Directory.GetFiles(queueDir, "*.bat");
                    foreach (var file in scriptFiles)
                    {
                        try
                        {
                            App.LogServiceEvent($"[RoboBackupService] Executing queued backup batch: {Path.GetFileName(file)}");
                            var psi = new ProcessStartInfo("cmd.exe", $"/c \\"{file}\\"")
                            {
                                CreateNoWindow = true,
                                UseShellExecute = false
                            };
                            using var proc = Process.Start(psi);
                            proc?.WaitForExit(600000);
                            try { File.Delete(file); } catch { }
                        }
                        catch (Exception ex)
                        {
                            App.LogServiceEvent($"[RoboBackupService Task Error] Failed to execute {file}: {ex.Message}");
                        }
                    }
                }
            }
            catch { }
        }
    }
}`
  },
  {
    id: 'csproj',
    title: 'RoboBackupStudio.csproj (.NET 8.0 WPF Project)',
    filename: 'RoboBackupStudio.csproj',
    language: 'xml',
    description: '모던 .NET 8.0 WPF 단일 독립 실행형(Self-Contained Single-File) 프로젝트 파일입니다.',
    code: `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWPF>true</UseWPF>
    <UseWindowsForms>true</UseWindowsForms>
    <ApplicationManifest>app.manifest</ApplicationManifest>
    <ApplicationIcon>robocopy.ico</ApplicationIcon>
    <StartupObject>RoboBackupStudio.Program</StartupObject>
    <Version>2.10.1</Version>
    <AssemblyVersion>2.10.1.0</AssemblyVersion>
    <FileVersion>2.10.1.0</FileVersion>
    <AssemblyTitle>RoboBackup Studio</AssemblyTitle>
    <Product>RoboBackup Studio - High Performance Robocopy GUI</Product>
    <Copyright>Copyright © 2026 AhBiYout</Copyright>
    <LangVersion>latest</LangVersion>
  </PropertyGroup>

  <!-- Service Controller NuGet package for Windows Service Management -->
  <ItemGroup>
    <PackageReference Include="System.ServiceProcess.ServiceController" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <Resource Include="robocopy.ico" />
    <Resource Include="robocopy.png" />
    <Resource Include="assets\\**" />
    <None Update="robocopy.ico">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
    <None Update="robocopy.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
  </ItemGroup>

</Project>`
  },
  {
    id: 'installer_iss',
    title: 'installer.iss (Inno Setup 6 Universal Script)',
    filename: 'installer.iss',
    language: 'ini',
    description: 'Windows 10, 11 및 Server 환경에서 Program Files 풀림 설치와 Windows 서비스 자동 등록을 지원하는 Inno Setup 6 스크립트입니다.',
    code: `; ====================================================================
; RoboBackup Studio - Inno Setup 6 Universal Installer Script
; Developer: AhBiYout
; Blog: https://ahbiyoutvibe.blogspot.com/
; ====================================================================

#define MyAppName "RoboBackup Studio"
#define MyAppVersion "v2.17.2"
#define MyAppPublisher "AhBiYout"
#define MyAppURL "https://ahbiyoutvibe.blogspot.com/"
#define MyAppExeName "RoboBackupStudio.exe"
#define MyAppOutputName "RoboBackupStudio_v2.17.2_Setup"

[Setup]
AppId={{8B237C9F-3F1E-4E2F-A5C0-9A2E12F3D9A1}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\\{#MyAppName}
DisableProgramGroupPage=yes
DefaultGroupName={#MyAppName}
OutputDir=publish
OutputBaseFilename={#MyAppOutputName}
SetupIconFile=robocopy.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "serviceinstall"; Description: "Windows 서비스로 자동 등록하여 부팅 시 백그라운드 무인 백업 실행 (권장)"; GroupDescription: "동작 모드 및 서비스 설정:"

[Files]
Source: "publish\\app\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "docs\\PATCH_NOTES.md"; DestDir: "{app}\\docs"; Flags: ignoreversion skipifsourcedoesntexist
Source: "docs\\LICENSE.txt"; DestDir: "{app}\\docs"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{autoprograms}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; IconFilename: "{app}\\robocopy.ico"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; IconFilename: "{app}\\robocopy.ico"; Tasks: desktopicon

[Run]
Filename: "{sys}\\sc.exe"; Parameters: "create RoboBackupService binPath= \\"\\"\\"{app}\\{#MyAppExeName}\\"\\" --service\\"\\" start= auto DisplayName= \\"\\"RoboBackup Studio Automation Service\\"\\""; Tasks: serviceinstall; Flags: runhidden
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "sc.exe"; Parameters: "stop RoboBackupService"; Flags: runhidden; RunOnceId: "StopRoboBackupService"
Filename: "sc.exe"; Parameters: "delete RoboBackupService"; Flags: runhidden; RunOnceId: "DeleteRoboBackupService"`
  },
  {
    id: 'build_bat',
    title: 'build.bat (Failsafe Auto-Build Script)',
    filename: 'build.bat',
    language: 'bat',
    description: '.NET 8 독립 실행 바이너리와 Inno Setup 설치 프로그램을 오류 없이 안전하게 컴파일하는 방탄 빌드 배치 스크립트입니다.',
    code: `@echo off
setlocal

REM ====================================================================
REM  RoboBackup Studio - High Performance Build Pipeline
REM  Developer: AhBiYout
REM  Blog: https://ahbivibelog.blogspot.com/
REM ====================================================================

cd /d "%~dp0"

REM 1. Set Project Name and Default Version
set "APP_NAME=RoboBackupStudio"
set "PATCH_FILE=docs\\PATCH_NOTES.md"
set "VERSION=v2.16.0"

if exist "%PATCH_FILE%" (
    echo [*] Reading latest patch version from %PATCH_FILE%...
    for /f "tokens=2 delims=[]" %%A in ('findstr /r /c:"^##.*\[v[0-9]" "%PATCH_FILE%"') do (
        if not "%%A"=="" (
            set "VERSION=%%A"
            goto :VERSION_FOUND
        )
    )
)

:VERSION_FOUND
echo ====================================================================
echo  [RoboBackup Studio] Starting Automated Build Pipeline...
echo ====================================================================
echo [*] Target Release Version: %VERSION%
echo.

REM 2. Check .NET SDK Installation
where dotnet >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :DOTNET_NOT_FOUND

echo [*] .NET SDK detected:
dotnet --version
echo.
goto :PREPARE_DIRS

:DOTNET_NOT_FOUND
echo.
echo [ERROR] .NET SDK is not installed or not found in system PATH.
echo Please install .NET 8.0 SDK from: https://dotnet.microsoft.com/download
echo.
goto :FINAL_SUMMARY

:PREPARE_DIRS
REM 3. Prepare Publish Directory
if not exist "publish" mkdir "publish"
if not exist "publish\\app" mkdir "publish\\app"

REM ====================================================================
REM [STEP 1] Compile Portable Self-Contained Single-File Executable
REM ====================================================================
echo ====================================================================
echo [*] [1/2] Compiling Portable Single-File EXE (Windows 10/11/Server)...
echo ====================================================================
echo [*] Running dotnet publish (Self-Contained Single-File)...
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true -o "./publish"

if exist "publish\\%APP_NAME%.exe" (
    copy /y "publish\\%APP_NAME%.exe" "publish\\%APP_NAME%_%VERSION%_Portable.exe" >nul
    echo.
    echo [OK] 1. Portable Single-File Ready: publish\\%APP_NAME%_%VERSION%_Portable.exe
)
if not exist "publish\\%APP_NAME%.exe" (
    echo.
    echo [WARNING] Portable single-file compilation encountered an issue.
)

REM ====================================================================
REM [STEP 2] Compile Unpacked App for Windows Installer & SCM Service
REM ====================================================================
echo.
echo ====================================================================
echo [*] [2/2] Compiling Unpacked App for Setup Installer (Program Files)...
echo ====================================================================
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=false -o "./publish/app"

if exist "publish\\app\\%APP_NAME%.exe" echo [OK] 2. Unpacked Application Binaries Ready in: publish\\app\\
if not exist "publish\\app\\%APP_NAME%.exe" echo [WARNING] Unpacked application compilation encountered an issue.

REM ====================================================================
REM [STEP 3] Compile Windows Installer with Inno Setup (If Installed)
REM ====================================================================
echo.
echo ====================================================================
echo [*] Checking Inno Setup Compiler (ISCC.exe)...
echo ====================================================================

set "ISCC_PATH="
if exist "%ProgramFiles(x86)%\\Inno Setup 6\\ISCC.exe" set "ISCC_PATH=%ProgramFiles(x86)%\\Inno Setup 6\\ISCC.exe"
if exist "%ProgramFiles%\\Inno Setup 6\\ISCC.exe" set "ISCC_PATH=%ProgramFiles%\\Inno Setup 6\\ISCC.exe"
if exist "%ProgramFiles(x86)%\\Inno Setup 5\\ISCC.exe" set "ISCC_PATH=%ProgramFiles(x86)%\\Inno Setup 5\\ISCC.exe"

if "%ISCC_PATH%"=="" goto :INNO_NOT_FOUND

echo [*] Inno Setup Compiler found: "%ISCC_PATH%"
echo [*] Building Windows Installer (.exe)...
"%ISCC_PATH%" /DMyAppVersion="%VERSION%" /DMyAppOutputName="%APP_NAME%_%VERSION%_Setup" "installer.iss"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] 3. Windows Setup Installer Ready: publish\\%APP_NAME%_%VERSION%_Setup.exe
)
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Inno Setup compilation encountered an issue.
)
goto :FINAL_SUMMARY

:INNO_NOT_FOUND
echo [INFO] Inno Setup (ISCC.exe) not found.
echo        To build the setup installer (.exe), download Inno Setup:
echo        https://jrsoftware.org/isdl.php

:FINAL_SUMMARY
echo.
echo ====================================================================
echo  [BUILD FINISHED] RoboBackup Studio Compilation Summary
echo ====================================================================
echo  Target Release Version: %VERSION%
echo.
echo  Available Artifacts in publish\\ directory:
if exist "publish\\%APP_NAME%_%VERSION%_Portable.exe" echo   [1] publish\\%APP_NAME%_%VERSION%_Portable.exe  (Standalone Single-File)
if exist "publish\\%APP_NAME%_%VERSION%_Setup.exe" echo   [2] publish\\%APP_NAME%_%VERSION%_Setup.exe     (Inno Setup Installer)
if exist "publish\\app\\%APP_NAME%.exe" echo   [3] publish\\app\\%APP_NAME%.exe                (Unpacked Folder App)
echo ====================================================================
echo.
echo Press any key to exit...
pause >nul`
  },
  {
    id: 'build_ps1',
    title: 'build.ps1 (PowerShell Build Pipeline)',
    filename: 'build.ps1',
    language: 'powershell',
    description: 'PowerShell 환경에서 인코딩 문제 없이 즉시 실행 가능한 자동 빌드 스크립트입니다.',
    code: `# ====================================================================
# RoboBackup Studio - High Performance PowerShell Build Pipeline
# Developer: AhBiYout
# Blog: ahbivibelog.blogspot.com
# ====================================================================
$ErrorActionPreference = "Continue"

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " [RoboBackup Studio] Starting Automatic Build Pipeline (PowerShell)" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

$AppName = "RoboBackupStudio"
$PatchFile = "docs\\PATCH_NOTES.md"
$Version = "v2.16.0"

if (Test-Path $PatchFile) {
    $lines = Get-Content $PatchFile
    foreach ($line in $lines) {
        if ($line -match '##\\s+📌\\s+\\[(v[0-9\\.]+)\\]') {
            $Version = $matches[1]
            break
        }
    }
}

Write-Host "[*] Target Release Version: $Version" -ForegroundColor Yellow

if (!(Test-Path "publish")) { New-Item -ItemType Directory -Path "publish" | Out-Null }
if (!(Test-Path "publish\\app")) { New-Item -ItemType Directory -Path "publish\\app" | Out-Null }

# 1. Compile Single-File Portable
Write-Host "\`n[*] [1/2] Compiling Portable Single-File EXE..." -ForegroundColor Green
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true -o "./publish"

if (Test-Path "publish\\$AppName.exe") {
    Copy-Item -Force "publish\\$AppName.exe" "publish\\\${AppName}_\${Version}_Portable.exe"
    Write-Host "[OK] 1. Portable Executable: publish\\\${AppName}_\${Version}_Portable.exe" -ForegroundColor Green
}

# 2. Compile Unpacked App
Write-Host "\`n[*] [2/2] Compiling Unpacked App for Installer & SCM Service..." -ForegroundColor Green
dotnet publish RoboBackupStudio.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=false -o "./publish/app" | Out-Null

if (Test-Path "publish\\app\\$AppName.exe") {
    Write-Host "[OK] 2. Unpacked Binaries Ready: publish\\app\\" -ForegroundColor Green
}

# 3. Inno Setup
Write-Host "\`n[*] Checking Inno Setup Compiler (ISCC.exe)..." -ForegroundColor Green
$isccPaths = @(
    "\${env:ProgramFiles(x86)}\\Inno Setup 6\\ISCC.exe",
    "\${env:ProgramFiles}\\Inno Setup 6\\ISCC.exe",
    "\${env:ProgramFiles(x86)}\\Inno Setup 5\\ISCC.exe"
)

$iscc = $null
foreach ($path in $isccPaths) {
    if (Test-Path $path) { $iscc = $path; break }
}

if ($iscc) {
    Write-Host "[*] Inno Setup found at: $iscc" -ForegroundColor Green
    & $iscc "/DMyAppVersion=$Version" "/DMyAppOutputName=\${AppName}_\${Version}_Setup" "installer.iss"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] 3. Setup Installer Created: publish\\\${AppName}_\${Version}_Setup.exe" -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] Inno Setup not found. Download from https://jrsoftware.org/isdl.php to build Setup.exe" -ForegroundColor Yellow
}

Write-Host "\`n====================================================================" -ForegroundColor Cyan
Write-Host " [FINISHED] Build Summary" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Get-ChildItem "publish\\*.exe" | Select-Object Name, Length | Format-Table -AutoSize
Read-Host "Press Enter to exit..."`
  }
];
