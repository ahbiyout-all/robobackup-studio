import { ThemeId } from './themes';
export type { ThemeId };
export type AppTheme = ThemeId;

export type BackupStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export type LogLevel = 'HEADER' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'PROGRESS' | 'SKIPPED';

export interface RobocopyLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  filePath?: string;
  bytesTransferred?: number;
}

export interface ScheduleConfig {
  enabled: boolean;
  taskName?: string;
  frequency: 'interval' | 'daily' | 'weekly' | 'logon';
  intervalMinutes: number;
  dailyTime: string; // "14:30"
  weeklyDays: string[]; // ["Mon", "Wed", "Fri"]
  runWithHighestPrivileges: boolean;
}

export interface RobocopyFlags {
  // Mode
  mirror: boolean; // /MIR
  copySubdirsWithEmpty: boolean; // /E
  copySubdirsNoEmpty: boolean; // /S
  purge: boolean; // /PURGE
  
  // Options
  threads: number; // /MT:n (1-128)
  restartMode: boolean; // /Z
  backupMode: boolean; // /B
  restartableBackupMode: boolean; // /ZB
  
  // Retry
  retryCount: number; // /R:n
  waitTime: number; // /W:n
  
  // Formatting & Performance
  fft: boolean; // /FFT (FAT file time)
  noProgress: boolean; // /NP
  noDirectoryList: boolean; // /NDL
  noFileList: boolean; // /NFL
  verbose: boolean; // /V
  includeTimestamps: boolean; // /TS
  fullPathNames: boolean; // /FP
  bytesLogging?: boolean; // /BYTES
  
  // 1. 보안 및 특수 권한 모드 (Security & Metadata)
  copyAll?: boolean; // /COPYALL
  copySec?: boolean; // /SEC
  secFix?: boolean; // /SECFIX
  timFix?: boolean; // /TIMFIX
  noOffload?: boolean; // /NOOFFLOAD

  // 2. 성능 & I/O 대역폭 제어 (Performance & Throttling)
  ipg?: number; // /IPG:n (Inter-Packet Gap, ms)
  copySymlink?: boolean; // /SL
  copyJunction?: boolean; // /SJ
  excludeJunctions?: boolean; // /XJ

  // 3. 정밀 필터링 및 조건부 복사 (Advanced Filtering)
  excludeFiles: string[]; // /XF
  excludeDirs: string[]; // /XD
  minAgeDays?: number; // /MINAGE:n
  maxAgeDays?: number; // /MAXAGE:n
  minFileSizeMb?: number; // /MIN:n (MB 단위)
  maxFileSizeMb?: number; // /MAX:n (MB 단위)
  excludeOlder?: boolean; // /XO
  excludeNewer?: boolean; // /XN
  excludeChanged?: boolean; // /XC
  excludeSame?: boolean; // /XU
  excludeExtra?: boolean; // /XX
  excludeLonely?: boolean; // /XL

  // 4. 실시간 감시 & 실행 시간대 (Real-time & Schedule Window)
  monitorChangesCount?: number; // /MON:n
  monitorWaitMinutes?: number; // /MOT:m
  runHours?: string; // /RH:hhmm-hhmm
  perFileTimeCheck?: boolean; // /PF

  // 5. NAS 및 파일시스템 호환성 (NAS & File Systems)
  fatFileNames?: boolean; // /FAT

  // Custom extra raw flags
  customFlags: string;
}

export interface NasAuthConfig {
  isNasDetected: boolean;
  server: string;
  sharePath: string;
  username: string;
  password?: string;
  authMode: 'cmdkey' | 'net_use';
  isConnected: boolean;
  autoDisconnect: boolean;
  lastTestedStatus?: 'success' | 'failed' | 'idle';
  lastTestedMessage?: string;
}

export interface NasCredentialItem {
  id: string;
  target: string;
  type: 'cmdkey' | 'net_use';
  username: string;
  status: string;
  driveLetter?: string;
  isMatched?: boolean;
}

export interface ScannedFileInfo {
  id: string;
  name: string;
  relativePath: string;
  sizeBytes: number;
  lastModifiedMs: number;
  isExcluded?: boolean;
  exclusionReason?: string;
}

export interface BackupJob {
  id: string;
  name: string;
  description: string;
  sourcePath: string;
  targetPath: string;
  flags: RobocopyFlags;
  schedule: ScheduleConfig;
  nasAuth?: NasAuthConfig;
  status: BackupStatus;
  lastRun?: string;
  lastRunStatus?: 'success' | 'failed' | 'partial';
  totalFiles: number;
  copiedFiles: number;
  totalDirs?: number;
  copiedDirs?: number;
  totalBytes: number;
  copiedBytes: number;
  currentSpeedMbps: number;
  progressPercent: number;
  remainingBytes?: number;
  estimatedRemainingSeconds?: number;
  estimatedRemainingTimeFormatted?: string;
  logEntries: RobocopyLogEntry[];
  realFiles?: ScannedFileInfo[];
  scannedAt?: string;
  failedCount?: number;
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  category: 'mirror' | 'incremental' | 'system' | 'nas' | 'media';
  icon: string;
  flags: Partial<RobocopyFlags>;
}

export interface CsharpSnippet {
  id: string;
  title: string;
  filename: string;
  language: string;
  description: string;
  code: string;
}

export interface RegisteredTaskItem {
  id: string;
  taskName: string;
  displayName: string;
  sourcePath: string;
  targetPath: string;
  frequency: 'daily' | 'weekly' | 'interval' | 'logon';
  timeInfo: string;
  status: 'Ready' | 'Running' | 'Disabled' | 'Queued';
  nextRunTime: string;
  lastRunTime: string;
  lastResult: string;
  hasError?: boolean;
  runWithHighestPrivileges: boolean;
  commandSummary: string;
  description: string;
  createdAt: string;
}

export interface RegisteredCleanupTaskItem {
  id: string;
  taskName: string;
  displayName: string;
  targetFolder: string;
  ruleDescription: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY' | 'ONSTART' | 'ONLOGON';
  timeInfo: string;
  status: 'Ready' | 'Running' | 'Disabled';
  nextRunTime: string;
  lastRunTime: string;
  lastResult: string;
  runWithHighestPrivileges: boolean;
  powershellCommand: string;
  createdAt: string;
  logFilePath?: string;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  intervalHours?: number;
}


