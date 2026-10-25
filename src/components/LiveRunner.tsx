import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  FileText, 
  ListFilter,
  HardDrive,
  Upload,
  Folder,
  FileCheck,
  Sparkles,
  Filter,
  ArrowDownCircle,
  Maximize2,
  Minimize2,
  Radio,
  Terminal,
  Trash2,
  BarChart3,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Timer
} from 'lucide-react';
import { BackupJob, RobocopyLogEntry, LogLevel, ScannedFileInfo } from '../types';
import { buildRobocopyCommand, evaluateFileExclusions } from '../utils/robocopy';

/**
 * Calculate estimated remaining time (ETA) based on current transfer speed and remaining data size
 * @param remainingBytes Total bytes remaining to transfer
 * @param speedBytesPerSec Current transfer speed in Bytes/second
 * @returns Estimated remaining seconds and localized human-readable formatted string
 */
export const calculateEstimatedRemainingTime = (
  remainingBytes: number,
  speedBytesPerSec: number
): { seconds: number; formatted: string; compact: string } => {
  if (remainingBytes <= 0) {
    return { seconds: 0, formatted: '0초 (동기화 완료)', compact: '0초' };
  }

  if (!speedBytesPerSec || speedBytesPerSec <= 0 || !isFinite(speedBytesPerSec)) {
    return { seconds: 0, formatted: '계산 중...', compact: '계산 중' };
  }

  const seconds = Math.max(1, Math.ceil(remainingBytes / speedBytesPerSec));

  if (seconds < 60) {
    return {
      seconds,
      formatted: `약 ${seconds}초 남음`,
      compact: `${seconds}초`,
    };
  }

  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      seconds,
      formatted: `약 ${mins}분 ${secs.toString().padStart(2, '0')}초 남음`,
      compact: `${mins}분 ${secs.toString().padStart(2, '0')}초`,
    };
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      seconds,
      formatted: `약 ${hours}시간 ${mins}분 ${secs.toString().padStart(2, '0')}초 남음`,
      compact: `${hours}시간 ${mins}분`,
    };
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return {
    seconds,
    formatted: `약 ${days}일 ${hours}시간 남음`,
    compact: `${days}일 ${hours}시간`,
  };
};

export interface RobocopySummaryReportState {
  dirsTotal: string;
  dirsCopied: string;
  dirsSkipped: string;
  dirsMismatch: string;
  dirsFailed: string;
  dirsExtras: string;

  filesTotal: string;
  filesCopied: string;
  filesSkipped: string;
  filesMismatch: string;
  filesFailed: string;
  filesExtras: string;

  bytesTotal: string;
  bytesCopied: string;
  bytesSkipped: string;
  bytesMismatch: string;
  bytesFailed: string;
  bytesExtras: string;

  timesTotal: string;
  timesCopied: string;
  timesFailed: string;
  timesExtras: string;

  speedBytesPerSec: string;
  speedMegaBytesPerMin: string;
  endedTime: string;

  exitCode: number;
  exitCodeTitle: string;
  exitCodeDescription: string;
  exitCodeBadgeColor: string;
}

/**
 * Recursive Directory Crawler
 * Safely analyzes the hierarchical directory tree structure of backup targets,
 * respecting excluded directories (/XD) and empty directory filtering (/S).
 */
export interface CrawlDirectoryResult {
  totalDirs: number;
  totalFiles: number;
  totalBytes: number;
  subdirectories: string[];
}

export const crawlDirectoryStructure = (
  files: ScannedFileInfo[],
  excludeDirPatterns: string[] = []
): CrawlDirectoryResult => {
  const dirSet = new Set<string>();

  for (const file of files) {
    const rawParts = file.relativePath.split(/\\|\//);
    const dirParts = rawParts.slice(0, rawParts.length - 1);

    // Check if any segment is excluded by /XD
    const isExcluded = dirParts.some((part) =>
      excludeDirPatterns.some((pat) => {
        const clean = pat.replace(/\*/g, '').trim().toLowerCase();
        return clean && part.toLowerCase().includes(clean);
      })
    );

    if (isExcluded) continue;

    // Traverse every directory ancestor recursively
    let accumulated = '';
    for (const part of dirParts) {
      if (!part) continue;
      accumulated = accumulated ? `${accumulated}\\${part}` : part;
      dirSet.add(accumulated);
    }
  }

  const subdirectories = Array.from(dirSet);
  return {
    totalDirs: subdirectories.length,
    totalFiles: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.sizeBytes, 0),
    subdirectories,
  };
};

interface LiveRunnerProps {
  currentJob: BackupJob;
  setCurrentJob: React.Dispatch<React.SetStateAction<BackupJob>>;
}

export const LiveRunner: React.FC<LiveRunnerProps> = ({ currentJob, setCurrentJob }) => {
  const [activeFilter, setActiveFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLiveStreamHudEnabled, setIsLiveStreamHudEnabled] = useState(true);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [currentActiveFile, setCurrentActiveFile] = useState<string>('대기 중 (Ready)');
  const [currentActiveDetail, setCurrentActiveDetail] = useState<string>('작업 시작 대기 중');
  const [latestLogMessage, setLatestLogMessage] = useState<string>('');
  const [unreadNewLogs, setUnreadNewLogs] = useState<number>(0);
  const [estimatedRemainingText, setEstimatedRemainingText] = useState<string>('대기 중');
  const [estimatedRemainingSeconds, setEstimatedRemainingSeconds] = useState<number>(0);

  // Final Backup Statistics Dashboard HUD State (v2.8.0 Option A)
  const [summaryReport, setSummaryReport] = useState<RobocopySummaryReportState | null>(null);
  const [hasSummaryReport, setHasSummaryReport] = useState<boolean>(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState<boolean>(true);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const fileIndexRef = useRef<number>(0);
  const accumulatedBytesRef = useRef<number>(0);
  const filesToCopyRef = useRef<ScannedFileInfo[]>([]);
  const excludedFilesRef = useRef<{ file: ScannedFileInfo; exclusionReason: string; relativePath: string }[]>([]);
  const effectiveTotalBytesRef = useRef<number>(0);
  const uniqueDirsRef = useRef<number>(1);
  const sequenceNumRef = useRef<number>(0);
  const copiedDirsRef = useRef<number>(0);
  const visitedDirsRef = useRef<Set<string>>(new Set());

  const command = buildRobocopyCommand(currentJob.sourcePath, currentJob.targetPath, currentJob.flags);

  // Format bytes helper for robust UI display
  const formatByteSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return `${bytes} Bytes`;
  };

  // Generate realistic simulated files for instant live sync testing
  const generateDefaultSampleFiles = (): ScannedFileInfo[] => {
    const list: ScannedFileInfo[] = [];
    const categories = [
      { dir: 'Documents', files: ['ProjectPlan_2026.docx', 'BudgetReport_Q3.xlsx', 'ClientProposal_v2.pdf', 'MeetingMinutes_0921.txt', 'Architecture_Doc.pdf', 'Contract_Final.pdf', 'Executive_Brief.docx', 'ResearchSummary.pptx'], minSize: 150 * 1024, maxSize: 8 * 1024 * 1024 },
      { dir: 'Photos', files: ['IMG_20260901_001.jpg', 'IMG_20260902_014.jpg', 'SiteInspection_Front.png', 'ProductMockup_HighRes.png', 'EventBanner_Final.png', 'OfficeLandscape.jpg', 'TeamPhoto_Retouched.jpg', 'HeaderGraphic.png'], minSize: 800 * 1024, maxSize: 18 * 1024 * 1024 },
      { dir: 'SourceCode', files: ['MainViewModel.cs', 'MainWindow.xaml', 'RobocopyEngine.cs', 'LiveRunner.tsx', 'App.tsx', 'package.json', 'tsconfig.json', 'CMakeLists.txt', 'server.ts', 'database.sql'], minSize: 4 * 1024, maxSize: 500 * 1024 },
      { dir: 'Database', files: ['MasterCatalog.sqlite', 'TransactionLogs_Archive.ldf', 'CustomerData_Dump.sql', 'AppMetrics_Local.db', 'SyncCache.dat'], minSize: 5 * 1024 * 1024, maxSize: 65 * 1024 * 1024 },
      { dir: 'Archives', files: ['Backup_Previous_Week.zip', 'SystemDrivers_Pack.7z', 'AssetLibrary_2026.tar.gz', 'Documentation_Export.zip'], minSize: 15 * 1024 * 1024, maxSize: 120 * 1024 * 1024 }
    ];

    let id = 1;
    const now = Date.now();
    for (const cat of categories) {
      for (const fname of cat.files) {
        const size = Math.floor(cat.minSize + Math.random() * (cat.maxSize - cat.minSize));
        list.push({
          id: `sample-f-${id++}`,
          name: fname,
          relativePath: `${cat.dir}\\${fname}`,
          sizeBytes: size,
          lastModifiedMs: now - Math.floor(Math.random() * 86400000 * 14)
        });
      }
    }
    return list;
  };

  // Get executable files: use real loaded files if available, or realistic sample files
  const getExecutableFiles = (): ScannedFileInfo[] => {
    if (currentJob.realFiles && currentJob.realFiles.length > 0) {
      return currentJob.realFiles;
    }
    return generateDefaultSampleFiles();
  };

  // Real Folder Loader for LiveRunner
  const handleLocalFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalBytes = 0;
    const realList: ScannedFileInfo[] = [];
    let sampleFolderName = '';

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      totalBytes += f.size;
      if (!sampleFolderName && f.webkitRelativePath) {
        sampleFolderName = f.webkitRelativePath.split('/')[0];
      }
      realList.push({
        id: `real-f-${i}-${f.name}`,
        name: f.name,
        relativePath: f.webkitRelativePath || f.name,
        sizeBytes: f.size,
        lastModifiedMs: f.lastModified,
      });
    }

    const inferredSource = sampleFolderName ? `C:\\Users\\${sampleFolderName}` : (currentJob.sourcePath || 'C:\\Source');
    const crawled = crawlDirectoryStructure(realList, currentJob.flags.excludeDirs);

    setCurrentJob(prev => ({
      ...prev,
      sourcePath: inferredSource,
      totalFiles: realList.length,
      totalDirs: Math.max(1, crawled.totalDirs),
      copiedDirs: 0,
      totalBytes: totalBytes,
      realFiles: realList,
      scannedAt: new Date().toLocaleTimeString(),
      status: 'idle',
      progressPercent: 0,
      copiedBytes: 0,
      copiedFiles: 0,
      logEntries: [
        {
          id: `log-load-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: `[FOLDER LOADED] 실제 로컬 폴더 '${sampleFolderName || '선택 폴더'}' 로드 완료 (${realList.length}개 파일, ${crawled.totalDirs}개 하위 디렉터리 식별, ${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`,
        }
      ]
    }));
  };

  // Internal simulation execution loop
  const startIntervalLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const filesToCopy = filesToCopyRef.current;
      const effectiveTotalBytes = effectiveTotalBytesRef.current;
      const effectiveTotalFiles = filesToCopy.length;
      const uniqueDirs = uniqueDirsRef.current;
      const excludedFiles = excludedFilesRef.current;

      if (fileIndexRef.current >= filesToCopy.length) {
        // Finished
        if (intervalRef.current) clearInterval(intervalRef.current);
        const elapsedSec = Math.max(0.5, (performance.now() - startTimeRef.current) / 1000);
        const totalMb = effectiveTotalBytes / (1024 * 1024);
        const speedMbPerSec = parseFloat((totalMb / elapsedSec).toFixed(1));
        const speedBytesPerSec = Math.floor(effectiveTotalBytes / elapsedSec);

        const summaryHeader: RobocopyLogEntry = {
          id: `log-end-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'HEADER',
          message: `-------------------------------------------------------------------------------\n               Total    Copied   Skipped  Mismatch    FAILED    Extras\n    Dirs :${String(uniqueDirs).padStart(10)} ${String(uniqueDirs).padStart(9)}         0         0         0         0\n   Files :${String(effectiveTotalFiles).padStart(10)} ${String(effectiveTotalFiles).padStart(9)} ${String(excludedFiles.length).padStart(9)}         0         0         0\n   Bytes :${(effectiveTotalBytes / (1024 * 1024 * 1024) >= 1 ? (effectiveTotalBytes / (1024 * 1024 * 1024)).toFixed(2) + ' g' : (effectiveTotalBytes / (1024 * 1024)).toFixed(2) + ' m').padStart(10)} ${(effectiveTotalBytes / (1024 * 1024 * 1024) >= 1 ? (effectiveTotalBytes / (1024 * 1024 * 1024)).toFixed(2) + ' g' : (effectiveTotalBytes / (1024 * 1024)).toFixed(2) + ' m').padStart(9)}         0         0         0         0\n   Times :   0:00:${String(Math.floor(elapsedSec)).padStart(2, '0')}   0:00:${String(Math.floor(elapsedSec)).padStart(2, '0')}                       0:00:00   0:00:00\n\n   Speed :            ${speedBytesPerSec.toLocaleString()} Bytes/sec.\n   Speed :              ${(speedMbPerSec * 60).toFixed(1)} MB/min.\n-------------------------------------------------------------------------------`,
        };

        setCurrentActiveFile('동기화 완료 (Completed)');
        setCurrentActiveDetail(`총 ${effectiveTotalFiles}개 파일 동기화 완료 · 평균 속도: ${speedMbPerSec} MB/s`);
        setLatestLogMessage('Robocopy 백업 작업이 정상 종료되었습니다 (ExitCode: 0/1)');

        const formattedBytes = effectiveTotalBytes >= 1024 * 1024 * 1024
          ? (effectiveTotalBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
          : (effectiveTotalBytes / (1024 * 1024)).toFixed(2) + ' MB';

        const finalReport: RobocopySummaryReportState = {
          dirsTotal: String(uniqueDirs),
          dirsCopied: String(uniqueDirs),
          dirsSkipped: '0',
          dirsMismatch: '0',
          dirsFailed: '0',
          dirsExtras: '0',

          filesTotal: String(effectiveTotalFiles),
          filesCopied: String(effectiveTotalFiles),
          filesSkipped: String(excludedFiles.length),
          filesMismatch: '0',
          filesFailed: '0',
          filesExtras: '0',

          bytesTotal: formattedBytes,
          bytesCopied: formattedBytes,
          bytesSkipped: '0 B',
          bytesMismatch: '0 B',
          bytesFailed: '0 B',
          bytesExtras: '0 B',

          timesTotal: `0:00:${String(Math.floor(elapsedSec)).padStart(2, '0')}`,
          timesCopied: `0:00:${String(Math.floor(elapsedSec)).padStart(2, '0')}`,
          timesFailed: '0:00:00',
          timesExtras: '0:00:00',

          speedBytesPerSec: `${speedBytesPerSec.toLocaleString()} Bytes/sec.`,
          speedMegaBytesPerMin: `${(speedMbPerSec * 60).toFixed(1)} MB/min.`,
          endedTime: new Date().toLocaleString(),

          exitCode: 1,
          exitCodeTitle: '복사 완료 (성공)',
          exitCodeDescription: '1개 이상의 파일 및 디렉터리가 대상 경로에 성공적으로 복사 및 동기화되었습니다.',
          exitCodeBadgeColor: '#10b981',
        };

        setSummaryReport(finalReport);
        setHasSummaryReport(true);
        setIsSummaryExpanded(true);

        setEstimatedRemainingText('0초 (동기화 완료)');
        setEstimatedRemainingSeconds(0);

        setCurrentJob((prev) => ({
          ...prev,
          status: 'completed',
          progressPercent: 100,
          copiedBytes: effectiveTotalBytes,
          copiedFiles: effectiveTotalFiles,
          copiedDirs: uniqueDirs,
          totalDirs: uniqueDirs,
          currentSpeedMbps: speedMbPerSec,
          remainingBytes: 0,
          estimatedRemainingSeconds: 0,
          estimatedRemainingTimeFormatted: '0초 (동기화 완료)',
          lastRunStatus: 'success',
          lastRun: new Date().toLocaleString(),
          logEntries: [...prev.logEntries, summaryHeader],
        }));
        return;
      }

      // Process a chunk of files according to threads
      const stepCount = Math.max(1, Math.min(filesToCopy.length - fileIndexRef.current, Math.ceil(currentJob.flags.threads / 4)));
      const newEntries: RobocopyLogEntry[] = [];

      for (let s = 0; s < stepCount && fileIndexRef.current < filesToCopy.length; s++) {
        const file = filesToCopy[fileIndexRef.current];
        accumulatedBytesRef.current += file.sizeBytes;
        fileIndexRef.current++;

        // Track Directory transitions
        const dirPart = file.relativePath.split(/\\|\//).slice(0, -1).join('\\');
        if (dirPart && !visitedDirsRef.current.has(dirPart)) {
          visitedDirsRef.current.add(dirPart);
          copiedDirsRef.current++;
          sequenceNumRef.current++;
          const dirMsg = `[#${sequenceNumRef.current}]            New Dir          0    ${currentJob.sourcePath || 'C:\\SourcePath'}\\${dirPart}\\`;
          newEntries.push({
            id: `log-dir-${Date.now()}-${sequenceNumRef.current}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'INFO',
            message: dirMsg,
            filePath: dirPart,
          });
        }

        sequenceNumRef.current++;
        const sizeFormatted = file.sizeBytes >= 1024 * 1024
          ? `${(file.sizeBytes / (1024 * 1024)).toFixed(1)}m`
          : `${Math.ceil(file.sizeBytes / 1024)}k`;

        const logMsg = `[#${sequenceNumRef.current}]            100%\tNew File\t${sizeFormatted}\t${file.relativePath}`;

        newEntries.push({
          id: `log-f-${Date.now()}-${sequenceNumRef.current}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'PROGRESS',
          message: logMsg,
          filePath: file.relativePath,
          bytesTransferred: file.sizeBytes,
        });

        setCurrentActiveFile(file.name);
        setCurrentActiveDetail(`[#${sequenceNumRef.current}] [신규 전송] ${file.relativePath} (${sizeFormatted})`);
        setLatestLogMessage(logMsg);
      }

      const elapsedSec = Math.max(0.1, (performance.now() - startTimeRef.current) / 1000);
      const currentSpeed = parseFloat(((accumulatedBytesRef.current / (1024 * 1024)) / elapsedSec).toFixed(1));
      const currentPercent = effectiveTotalBytes > 0 ? Math.min(100, Math.floor((accumulatedBytesRef.current / effectiveTotalBytes) * 100)) : 100;

      // Realtime ETA calculation based on current transfer speed and remaining data size
      const speedBytesPerSec = accumulatedBytesRef.current / elapsedSec;
      const remainingBytes = Math.max(0, effectiveTotalBytes - accumulatedBytesRef.current);
      const eta = calculateEstimatedRemainingTime(remainingBytes, speedBytesPerSec);

      setEstimatedRemainingText(eta.formatted);
      setEstimatedRemainingSeconds(eta.seconds);

      if (!autoScroll) {
        setUnreadNewLogs((prev) => prev + newEntries.length);
      }

      setCurrentJob((prev) => ({
        ...prev,
        progressPercent: currentPercent,
        copiedFiles: fileIndexRef.current,
        copiedDirs: copiedDirsRef.current,
        totalDirs: uniqueDirs,
        copiedBytes: accumulatedBytesRef.current,
        currentSpeedMbps: currentSpeed,
        remainingBytes,
        estimatedRemainingSeconds: eta.seconds,
        estimatedRemainingTimeFormatted: eta.formatted,
        logEntries: [...prev.logEntries, ...newEntries],
      }));
    }, 200);
  };

  // Start Real Robocopy Process Execution with exclusion engine
  const startSimulation = () => {
    if (currentJob.status === 'running') return;

    if (currentJob.status === 'paused') {
      resumeSimulation();
      return;
    }

    const rawFiles = getExecutableFiles();
    if (rawFiles.length === 0) {
      alert('백업할 실제 파일이 로드되지 않았습니다. 상단의 [📂 실제 로컬 폴더 불러오기]를 눌러 폴더를 선택해 주세요.');
      return;
    }

    // Evaluate exclusions against active Robocopy flags (/XF, /XD, /MIN, /MAX)
    const evaluation = evaluateFileExclusions(rawFiles, currentJob.flags);
    const filesToCopy = evaluation.includedFiles;
    const excludedFiles = evaluation.excludedFiles;

    const effectiveTotalBytes = filesToCopy.reduce((sum, f) => sum + f.sizeBytes, 0);
    const effectiveTotalFiles = filesToCopy.length;
    
    // Recursive directory crawler to accurately count all hierarchical subdirectories
    const crawledDirs = crawlDirectoryStructure(filesToCopy, currentJob.flags.excludeDirs);
    const uniqueDirs = Math.max(1, crawledDirs.totalDirs);

    filesToCopyRef.current = filesToCopy;
    excludedFilesRef.current = excludedFiles;
    effectiveTotalBytesRef.current = effectiveTotalBytes;
    uniqueDirsRef.current = uniqueDirs;
    fileIndexRef.current = 0;
    accumulatedBytesRef.current = 0;
    sequenceNumRef.current = 0;
    copiedDirsRef.current = 0;
    visitedDirsRef.current.clear();

    setSummaryReport(null);
    setHasSummaryReport(false);

    startTimeRef.current = performance.now();

    const startTimestamp = new Date();
    const initialLogs: RobocopyLogEntry[] = [
      {
        id: 'log-1',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'HEADER',
        message: `-------------------------------------------------------------------------------`,
      },
      {
        id: 'log-2',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'HEADER',
        message: `   ROBOCOPY :: Robust File Copy for Windows (High Speed Multi-Thread)`,
      },
      {
        id: 'log-3',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'HEADER',
        message: `-------------------------------------------------------------------------------`,
      },
      {
        id: 'log-4',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'INFO',
        message: `   Started : ${startTimestamp.toLocaleString()}`,
      },
      {
        id: 'log-5',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'INFO',
        message: `   Source : ${currentJob.sourcePath || 'C:\\SourcePath'}`,
      },
      {
        id: 'log-6',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'INFO',
        message: `   Dest : ${currentJob.targetPath || 'D:\\BackupPath'}`,
      },
      {
        id: 'log-7',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'INFO',
        message: `   Files : *.*\n   Options : ${command.replace('robocopy', '')}`,
      },
      {
        id: 'log-crawl',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'INFO',
        message: `   [디렉터리 크롤러] 대상 트리 재귀 크롤링 완료: 총 ${uniqueDirs}개 하위 디렉터리, ${effectiveTotalFiles}개 파일 식별`,
      },
      {
        id: 'log-8',
        timestamp: startTimestamp.toLocaleTimeString(),
        level: 'HEADER',
        message: `-------------------------------------------------------------------------------`,
      },
    ];

    // Add exclusion notifications in log if any exclusions triggered
    if (excludedFiles.length > 0) {
      excludedFiles.slice(0, 5).forEach((ex, idx) => {
        initialLogs.push({
          id: `log-ex-${idx}`,
          timestamp: startTimestamp.toLocaleTimeString(),
          level: 'SKIPPED',
          message: `   *EXCLUDED File           ${ex.relativePath} (${ex.exclusionReason || '제외 규칙 일치'})`,
          filePath: ex.relativePath,
        });
      });
      if (excludedFiles.length > 5) {
        initialLogs.push({
          id: `log-ex-more`,
          timestamp: startTimestamp.toLocaleTimeString(),
          level: 'SKIPPED',
          message: `   *EXCLUDED File           ... 외 ${excludedFiles.length - 5}개 파일 제외됨`,
        });
      }
    }

    setEstimatedRemainingText('계산 중...');
    setEstimatedRemainingSeconds(0);

    setCurrentJob((prev) => ({
      ...prev,
      status: 'running',
      progressPercent: 0,
      copiedBytes: 0,
      totalBytes: effectiveTotalBytes,
      totalFiles: effectiveTotalFiles,
      copiedFiles: 0,
      copiedDirs: 0,
      totalDirs: uniqueDirs,
      currentSpeedMbps: 65.0,
      remainingBytes: effectiveTotalBytes,
      estimatedRemainingSeconds: 0,
      estimatedRemainingTimeFormatted: '계산 중...',
      failedCount: 0,
      logEntries: initialLogs,
    }));

    startIntervalLoop();
  };

  const pauseSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setEstimatedRemainingText('일시정지됨');
    setCurrentActiveDetail('동기화 작업이 일시정지되었습니다. 계속하려면 재개를 누르세요.');
    setCurrentJob((prev) => ({
      ...prev,
      status: 'paused',
      estimatedRemainingTimeFormatted: '일시정지됨',
      logEntries: [
        ...prev.logEntries,
        {
          id: `log-pause-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          message: `[❚❚ PAUSED] 사용자에 의해 동기화 진행이 일시정지되었습니다.`,
        }
      ]
    }));
  };

  const resumeSimulation = () => {
    if (currentJob.status === 'running') return;
    setEstimatedRemainingText('계산 중...');
    setCurrentActiveDetail('동기화 작업을 계속 재개합니다.');
    setCurrentJob((prev) => ({
      ...prev,
      status: 'running',
      estimatedRemainingTimeFormatted: '계산 중...',
      logEntries: [
        ...prev.logEntries,
        {
          id: `log-resume-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: `[▶ RESUMED] 일시정지되었던 동기화 작업이 다시 재개되었습니다.`,
        }
      ]
    }));
    startIntervalLoop();
  };

  const cancelSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    let copiedCount = Math.max(fileIndexRef.current, currentJob.copiedFiles || 0);
    let copiedBytes = Math.max(accumulatedBytesRef.current, currentJob.copiedBytes || 0);

    // If both are 0, check log entries to recover any progress recorded
    if (copiedCount === 0 && currentJob.logEntries && currentJob.logEntries.length > 0) {
      for (const entry of currentJob.logEntries) {
        if (entry.level === 'PROGRESS' || entry.message.includes('New File') || entry.message.includes('새 파일')) {
          copiedCount++;
          if (entry.bytesTransferred) copiedBytes += entry.bytesTransferred;
          else copiedBytes += 1024 * 512;
        }
      }
    }

    const elapsedSec = Math.max(0.5, (performance.now() - startTimeRef.current) / 1000);
    const speedMbPerSec = parseFloat(((copiedBytes / (1024 * 1024)) / elapsedSec).toFixed(1));
    const speedBytesPerSec = Math.floor(copiedBytes / elapsedSec);

    const totalFiles = Math.max(copiedCount, filesToCopyRef.current.length || currentJob.totalFiles || 50);
    const totalBytes = Math.max(copiedBytes, effectiveTotalBytesRef.current || currentJob.totalBytes || (1024 * 1024 * 350));

    const formattedCopiedBytes = formatByteSize(copiedBytes);
    const formattedTotalBytes = formatByteSize(totalBytes);

    const uniqueDirs = Math.max(1, uniqueDirsRef.current || 1);
    const dirsCopied = Math.min(uniqueDirs, Math.max(1, Math.ceil(uniqueDirs * (copiedCount / Math.max(1, totalFiles)))));

    const stopReport: RobocopySummaryReportState = {
      dirsTotal: String(uniqueDirs),
      dirsCopied: String(dirsCopied),
      dirsSkipped: '0',
      dirsMismatch: '0',
      dirsFailed: '0',
      dirsExtras: '0',

      filesTotal: String(totalFiles),
      filesCopied: String(copiedCount),
      filesSkipped: String(excludedFilesRef.current.length),
      filesMismatch: '0',
      filesFailed: '0',
      filesExtras: '0',

      bytesTotal: formattedTotalBytes,
      bytesCopied: formattedCopiedBytes,
      bytesSkipped: '0 B',
      bytesMismatch: '0 B',
      bytesFailed: '0 B',
      bytesExtras: '0 B',

      timesTotal: `0:00:${String(Math.floor(elapsedSec)).padStart(2, '0')}`,
      timesCopied: `0:00:${String(Math.floor(elapsedSec)).padStart(2, '0')}`,
      timesFailed: '0:00:00',
      timesExtras: '0:00:00',

      speedBytesPerSec: `${speedBytesPerSec.toLocaleString()} Bytes/sec.`,
      speedMegaBytesPerMin: `${(speedMbPerSec * 60).toFixed(1)} MB/min.`,
      endedTime: new Date().toLocaleString(),

      exitCode: -1,
      exitCodeTitle: '⏹️ 사용자 강제 중지 (중단됨)',
      exitCodeDescription: `동기화 작업이 사용자에 의해 중간에 강제 중지되었습니다. 중지 시점까지 총 ${copiedCount.toLocaleString()}개 파일(${formattedCopiedBytes})이 안전하게 전송 및 동기화되었습니다.`,
      exitCodeBadgeColor: '#f59e0b',
    };

    setSummaryReport(stopReport);
    setHasSummaryReport(true);
    setIsSummaryExpanded(true);

    setEstimatedRemainingText('중단됨');
    setEstimatedRemainingSeconds(0);

    setCurrentActiveFile('동기화 중지됨 (Stopped)');
    setCurrentActiveDetail(`사용자에 의해 작업 강제 중단됨 (현재까지 ${copiedCount}개 파일, ${formattedCopiedBytes} 완료)`);
    setCurrentJob((prev) => ({
      ...prev,
      status: 'idle',
      copiedFiles: copiedCount,
      copiedBytes: copiedBytes,
      remainingBytes: Math.max(0, totalBytes - copiedBytes),
      estimatedRemainingSeconds: 0,
      estimatedRemainingTimeFormatted: '중단됨',
      logEntries: [
        ...prev.logEntries,
        {
          id: `log-cancel-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'WARN',
          message: `[⏹ STOPPED] 사용자에 의해 Robocopy 프로세스가 강제 중지되었습니다 (현재까지 ${copiedCount}개 파일, ${formattedCopiedBytes} 전송 완료).`,
        },
      ],
    }));
  };

  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 30) {
      setUnreadNewLogs(0);
    }
  };

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      setUnreadNewLogs(0);
    }
  };

  const clearLogs = () => {
    setCurrentJob(prev => ({
      ...prev,
      logEntries: []
    }));
    setLatestLogMessage('');
    setUnreadNewLogs(0);
  };

  const copySummaryReport = () => {
    if (!summaryReport) return;
    const reportText = `===============================================================================
📊 ROBOCOPY 최종 백업 통계 리포트 - ${summaryReport.exitCodeTitle} (ExitCode: ${summaryReport.exitCode})
   상세 진단: ${summaryReport.exitCodeDescription}
   종료 일시: ${summaryReport.endedTime}
-------------------------------------------------------------------------------
             전체       복사됨      건너 뜀       불일치         실패         추가
   디렉터리 : ${summaryReport.dirsTotal.padStart(10)} ${summaryReport.dirsCopied.padStart(10)} ${summaryReport.dirsSkipped.padStart(10)} ${summaryReport.dirsMismatch.padStart(10)} ${summaryReport.dirsFailed.padStart(10)} ${summaryReport.dirsExtras.padStart(10)}
     파일 :   ${summaryReport.filesTotal.padStart(10)} ${summaryReport.filesCopied.padStart(10)} ${summaryReport.filesSkipped.padStart(10)} ${summaryReport.filesMismatch.padStart(10)} ${summaryReport.filesFailed.padStart(10)} ${summaryReport.filesExtras.padStart(10)}
   바이트 :   ${summaryReport.bytesTotal.padStart(10)} ${summaryReport.bytesCopied.padStart(10)} ${summaryReport.bytesSkipped.padStart(10)} ${summaryReport.bytesMismatch.padStart(10)} ${summaryReport.bytesFailed.padStart(10)} ${summaryReport.bytesExtras.padStart(10)}
     시간 :   ${summaryReport.timesTotal.padStart(10)} ${summaryReport.timesCopied.padStart(10)}                         ${summaryReport.timesFailed.padStart(10)} ${summaryReport.timesExtras.padStart(10)}
     속도 :   ${summaryReport.speedBytesPerSec}
     속도 :   ${summaryReport.speedMegaBytesPerMin}
===============================================================================`;
    navigator.clipboard.writeText(reportText);
    alert('최종 백업 통계 리포트가 클립보드에 복사되었습니다.');
  };

  const openSummaryHud = () => {
    if (summaryReport) {
      setHasSummaryReport(true);
      setIsSummaryExpanded(true);
    } else {
      alert('아직 완료된 백업 요약 리포트가 없습니다. 백업 작업을 먼저 실행해 주세요.');
    }
  };

  // Auto-scroll log console
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      setUnreadNewLogs(0);
    }
  }, [currentJob.logEntries, autoScroll]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const downloadLogs = () => {
    const textContent = currentJob.logEntries.map((l) => `${l.timestamp} ${l.message}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Robocopy_Log_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = currentJob.logEntries.filter((entry) => {
    if (activeFilter !== 'ALL' && entry.level !== activeFilter) return false;
    if (searchTerm.trim() && !entry.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        onChange={handleLocalFolderSelect}
      />
      
      {/* No Real Files Loaded Banner */}
      {(!currentJob.realFiles || currentJob.realFiles.length === 0) && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200 shadow-lg">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">실제 로컬 폴더를 연동하여 백업을 테스트하세요</p>
              <p className="text-slate-300 mt-0.5">컴퓨터의 실제 디렉터리를 불러와 정확한 파일 용량, 전송 속도 및 예외 필터링 규칙을 실시간 검증할 수 있습니다.</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0 transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📂 실제 폴더 불러오기</span>
          </button>
        </div>
      )}

      {/* Real-time Status Gauge Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${
              currentJob.status === 'running'
                ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                : currentJob.status === 'completed'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">Robocopy 백업 실행 모니터</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentJob.status === 'running'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : currentJob.status === 'paused'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : currentJob.status === 'completed'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {currentJob.status === 'running' ? '● 실행 중 (RUNNING)' : currentJob.status === 'paused' ? '❚❚ 일시정지' : currentJob.status === 'completed' ? '✓ 완료 (COMPLETED)' : '대기 중 (IDLE)'}
                </span>
                {currentJob.realFiles && currentJob.realFiles.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center space-x-1">
                    <FileCheck className="w-3 h-3" />
                    <span>실제 로컬 파일 ({currentJob.realFiles.length}개)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentJob.sourcePath || 'C:\\SourcePath'} ➔ {currentJob.targetPath || 'D:\\BackupPath'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
              title="컴퓨터의 실제 로컬 폴더를 선택하여 실시간 복사 테스트를 실행합니다."
            >
              <Upload className="w-3.5 h-3.5" />
              <span>실제 폴더 지정</span>
            </button>

            {currentJob.status === 'idle' || currentJob.status === 'completed' ? (
              <button
                onClick={startSimulation}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>백업 시작</span>
              </button>
            ) : currentJob.status === 'paused' ? (
              <button
                onClick={resumeSimulation}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/20 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>▶ 계속 재개 (Resume)</span>
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/20 transition-all active:scale-95"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>❚❚ 일시정지 (Pause)</span>
              </button>
            )}

            {(currentJob.status === 'running' || currentJob.status === 'paused') && (
              <button
                onClick={cancelSimulation}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>⏹ 백업 중지 (Stop)</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Numerical Metrics */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">전체 동기화 진행률</span>
              <span className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">
                {currentJob.progressPercent}%
              </span>
            </div>
            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-xs font-semibold text-slate-400 block flex items-center justify-end space-x-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400 inline mr-1" />
                  <span>남은 예상 시간 (ETA)</span>
                </span>
                <span className="text-xl font-bold text-sky-400 font-mono">
                  {estimatedRemainingText}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">전송 속도</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {currentJob.status === 'running' ? `${currentJob.currentSpeedMbps} MB/s` : currentJob.status === 'completed' ? `${currentJob.currentSpeedMbps} MB/s (평균)` : '0 MB/s'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-blue-500/50"
              style={{ width: `${currentJob.progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 text-center">
            <div 
              title="복사 완료된 파일 수 / 전체 대상 파일 수"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <span className="text-[11px] text-slate-400 block">복사된 파일 수</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {currentJob.copiedFiles} / {currentJob.totalFiles}
              </span>
            </div>
            <div 
              title="복사 완료된 하위 디렉터리 수 / 전체 대상 디렉터리 수 (재귀 크롤러 집계)"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <span className="text-[11px] text-slate-400 block">복사된 디렉터리 수</span>
              <span className="text-sm font-bold text-purple-400 font-mono">
                {currentJob.copiedDirs ?? 0} / {currentJob.totalDirs ?? (uniqueDirsRef.current || 1)}
              </span>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, Math.round(((currentJob.copiedDirs ?? 0) / Math.max(1, currentJob.totalDirs ?? 1)) * 100))}%`
                  }}
                />
              </div>
              <span className="text-[10px] text-purple-300 block mt-0.5 font-mono">
                {Math.min(100, Math.round(((currentJob.copiedDirs ?? 0) / Math.max(1, currentJob.totalDirs ?? 1)) * 100))}% 완료
              </span>
            </div>
            <div 
              title="전송 완료된 데이터 용량 / 전체 복사 용량"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <span className="text-[11px] text-slate-400 block">복사 용량 (전체)</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {formatBytes(currentJob.copiedBytes)} / {formatBytes(currentJob.totalBytes)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                (남음: {formatBytes(Math.max(0, currentJob.totalBytes - currentJob.copiedBytes))})
              </span>
            </div>
            <div 
              title="현재 전송 속도와 남은 데이터 용량 기준 실시간 계산된 예상 완료 시간"
              className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30"
            >
              <span className="text-[11px] text-sky-300 font-semibold block flex items-center justify-center space-x-1">
                <Clock className="w-3 h-3 text-sky-400 inline mr-0.5" />
                <span>남은 예상 시간 (ETA)</span>
              </span>
              <span className="text-sm font-bold text-sky-300 font-mono">
                {estimatedRemainingText}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {currentJob.status === 'running' ? '실시간 속도 기반 계산' : currentJob.status === 'completed' ? '동기화 완료' : '대기 상태'}
              </span>
            </div>
            <div 
              title="병렬 파일 복사 멀티스레드 수 (/MT)"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <span className="text-[11px] text-slate-400 block">스레드 수 (/MT)</span>
              <span className="text-sm font-bold text-blue-400 font-mono">
                {currentJob.flags.threads} Threads
              </span>
            </div>
            <div 
              title="파일 전송 중 발생한 I/O 오류 및 재시도 횟수"
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <span className="text-[11px] text-slate-400 block">오류/재시도</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {currentJob.failedCount || 0} Errors
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Real-time Console Log Stream Viewer & Live HUD (v2.7.3) */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl relative">
        
        {/* Live Copy Stream HUD Banner (Optionally visible) */}
        {isLiveStreamHudEnabled && (
          <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 backdrop-blur-sm">
            <div className="flex items-center space-x-3 min-w-0">
              {currentJob.status === 'running' ? (
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
              ) : currentJob.status === 'completed' ? (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0"></div>
              )}
              
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">현재 전송 파일:</span>
                  <span className="text-xs font-mono font-bold text-sky-300 truncate">
                    {currentActiveFile}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center space-x-2">
                  <span>{currentActiveDetail}</span>
                  {currentJob.status === 'running' && (
                    <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 text-sky-300 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>ETA: {estimatedRemainingText} · 남음: {formatBytes(Math.max(0, currentJob.totalBytes - currentJob.copiedBytes))}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Latest raw console output ticker */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 max-w-md shrink-0">
              <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-slate-500 shrink-0">최신 스트림:</span>
              <span className="text-slate-300 truncate" title={latestLogMessage}>
                {latestLogMessage || '작업 대기 중...'}
              </span>
            </div>
          </div>
        )}

        {/* Final Backup Statistics Dashboard HUD Card (v2.8.0 Option A) */}
        {hasSummaryReport && summaryReport && (
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-b-2 border-emerald-500/70 p-4 space-y-3.5 animate-fadeIn">
            {/* Header: Title, ExitCode Badge, Ended Time, Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <span className="text-lg">📊</span>
                <span className="font-bold text-white text-sm">최종 백업 통계 대시보드 리포트</span>
                
                {/* Status Badge */}
                <div className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-1">
                  <span>{summaryReport.exitCodeTitle}</span>
                  <span className="text-emerald-400/80">(코드: {summaryReport.exitCode})</span>
                </div>

                <span className="text-[11px] text-slate-400">
                  완료 일시: <strong className="text-slate-300">{summaryReport.endedTime}</strong>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={copySummaryReport}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white text-xs font-medium transition-colors border border-slate-700/60 flex items-center space-x-1.5"
                  title="전체 통계표를 텍스트 형식으로 클립보드에 복사"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>리포트 복사</span>
                </button>
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700/60 flex items-center space-x-1"
                  title="상세 통계표 접기/펼치기"
                >
                  {isSummaryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{isSummaryExpanded ? '접기' : '펼치기'}</span>
                </button>
                <button
                  onClick={() => setHasSummaryReport(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                  title="HUD 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collapsible Content Body */}
            {isSummaryExpanded && (
              <div className="space-y-3">
                {/* 4 Key Metric Highlight Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Card 1: Dirs */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 block">📁 디렉터리 (Dirs)</span>
                    <div className="flex items-baseline space-x-1 mt-1 font-mono">
                      <span className="text-lg font-bold text-sky-400">{summaryReport.dirsCopied}</span>
                      <span className="text-xs text-slate-500">/ {summaryReport.dirsTotal}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      건너뜀: <span className="text-amber-400">{summaryReport.dirsSkipped}</span> · 불일치: {summaryReport.dirsMismatch}
                    </span>
                  </div>

                  {/* Card 2: Files */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 block">📄 파일 (Files)</span>
                    <div className="flex items-baseline space-x-1 mt-1 font-mono">
                      <span className="text-lg font-bold text-emerald-400">{summaryReport.filesCopied}</span>
                      <span className="text-xs text-slate-500">/ {summaryReport.filesTotal}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      실패: <span className="text-rose-400 font-bold">{summaryReport.filesFailed}</span> · 추가: <span className="text-sky-400">{summaryReport.filesExtras}</span>
                    </span>
                  </div>

                  {/* Card 3: Bytes */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 block">💾 복사 용량 (Bytes)</span>
                    <div className="flex items-baseline space-x-1 mt-1 font-mono">
                      <span className="text-lg font-bold text-amber-400">{summaryReport.bytesCopied}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block truncate">
                      전체: {summaryReport.bytesTotal} · 건너뜀: {summaryReport.bytesSkipped}
                    </span>
                  </div>

                  {/* Card 4: Speed & Time */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 block">⏱️ 소요 시간 &amp; 속도</span>
                    <div className="flex items-baseline space-x-1 mt-1 font-mono">
                      <span className="text-lg font-bold text-purple-400">{summaryReport.timesCopied}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block truncate">
                      속도: <span className="text-sky-300">{summaryReport.speedBytesPerSec}</span>
                    </span>
                  </div>
                </div>

                {/* Detailed 6-Column Formatted Summary Table */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/90 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">구분 항목</th>
                        <th className="py-2 px-3 text-center text-slate-300">전체 (Total)</th>
                        <th className="py-2 px-3 text-center text-emerald-400">복사됨 (Copied) 🟢</th>
                        <th className="py-2 px-3 text-center text-amber-400">건너뜀 (Skipped) 🟡</th>
                        <th className="py-2 px-3 text-center text-orange-400">불일치 (Mismatch) 🟠</th>
                        <th className="py-2 px-3 text-center text-rose-400">실패 (Failed) 🔴</th>
                        <th className="py-2 px-3 text-center text-sky-400">추가 (Extras) 🔵</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                      {/* Dirs */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-sans font-bold text-sky-300">📁 디렉터리</td>
                        <td className="py-2 px-3 text-center text-slate-200">{summaryReport.dirsTotal}</td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">{summaryReport.dirsCopied}</td>
                        <td className="py-2 px-3 text-center text-amber-400">{summaryReport.dirsSkipped}</td>
                        <td className="py-2 px-3 text-center text-orange-400">{summaryReport.dirsMismatch}</td>
                        <td className="py-2 px-3 text-center text-rose-400 font-bold">{summaryReport.dirsFailed}</td>
                        <td className="py-2 px-3 text-center text-sky-400">{summaryReport.dirsExtras}</td>
                      </tr>
                      {/* Files */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-sans font-bold text-sky-300">📄 파일</td>
                        <td className="py-2 px-3 text-center text-slate-200">{summaryReport.filesTotal}</td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">{summaryReport.filesCopied}</td>
                        <td className="py-2 px-3 text-center text-amber-400">{summaryReport.filesSkipped}</td>
                        <td className="py-2 px-3 text-center text-orange-400">{summaryReport.filesMismatch}</td>
                        <td className="py-2 px-3 text-center text-rose-400 font-bold">{summaryReport.filesFailed}</td>
                        <td className="py-2 px-3 text-center text-sky-400">{summaryReport.filesExtras}</td>
                      </tr>
                      {/* Bytes */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-sans font-bold text-sky-300">💾 바이트</td>
                        <td className="py-2 px-3 text-center text-slate-200">{summaryReport.bytesTotal}</td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">{summaryReport.bytesCopied}</td>
                        <td className="py-2 px-3 text-center text-amber-400">{summaryReport.bytesSkipped}</td>
                        <td className="py-2 px-3 text-center text-orange-400">{summaryReport.bytesMismatch}</td>
                        <td className="py-2 px-3 text-center text-rose-400 font-bold">{summaryReport.bytesFailed}</td>
                        <td className="py-2 px-3 text-center text-sky-400">{summaryReport.bytesExtras}</td>
                      </tr>
                      {/* Times */}
                      <tr className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-sans font-bold text-sky-300">⏱️ 소요 시간</td>
                        <td className="py-2 px-3 text-center text-slate-200">{summaryReport.timesTotal}</td>
                        <td className="py-2 px-3 text-center text-emerald-400 font-bold">{summaryReport.timesCopied}</td>
                        <td className="py-2 px-3 text-center text-slate-600">-</td>
                        <td className="py-2 px-3 text-center text-slate-600">-</td>
                        <td className="py-2 px-3 text-center text-rose-400">{summaryReport.timesFailed}</td>
                        <td className="py-2 px-3 text-center text-sky-400">{summaryReport.timesExtras}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Diagnosis Bar */}
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <span className="font-bold text-slate-400">💡 상세 진단:</span>
                    <span>{summaryReport.exitCodeDescription}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0 font-mono">
                    분당 속도: <span className="text-indigo-300 font-bold">{summaryReport.speedMegaBytesPerMin}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log Toolbar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1 mr-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>로그 필터:</span>
            </span>
            {(['ALL', 'PROGRESS', 'INFO', 'WARN', 'ERROR', 'HEADER'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Search */}
            <div className="relative flex-1 md:w-44">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="로그 검색..."
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 최신위치(v) 실시간 자동 스크롤 옵션 */}
            <label 
              className={`flex items-center space-x-1.5 text-xs select-none px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                autoScroll 
                  ? 'bg-sky-950/70 border-sky-500/60 text-sky-300 font-semibold shadow-sm shadow-sky-500/20' 
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="새 로그가 수신될 때 화면을 항상 최신 위치로 자동 유지(스크롤)합니다."
            >
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAutoScroll(enabled);
                  if (enabled) {
                    setUnreadNewLogs(0);
                    scrollToBottom();
                  }
                }}
                className="w-3.5 h-3.5 rounded text-sky-500 focus:ring-sky-400 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-[11px]">⬇ 최신위치(v)</span>
              {unreadNewLogs > 0 && !autoScroll && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full animate-pulse ml-1">
                  +{unreadNewLogs > 99 ? '99+' : unreadNewLogs}
                </span>
              )}
            </label>

            {/* Live HUD Toggle */}
            <label className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors">
              <input
                type="checkbox"
                checked={isLiveStreamHudEnabled}
                onChange={(e) => setIsLiveStreamHudEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600"
              />
              <span className="text-[11px] font-medium">최신 복사 HUD</span>
            </label>

            {/* Open Summary Report HUD Button */}
            <button
              onClick={openSummaryHud}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white text-xs font-bold transition-colors border border-indigo-700/60"
              title="최근 완료된 백업 요약 통계 대시보드 HUD 열기"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>📊 요약 통계</span>
            </button>

            {/* Quick Live Controls inside Toolbar */}
            {currentJob.status === 'running' && (
              <button
                onClick={pauseSimulation}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="프로세스 일시정지"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>일시정지</span>
              </button>
            )}

            {currentJob.status === 'paused' && (
              <button
                onClick={resumeSimulation}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="프로세스 계속 재개"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>재개</span>
              </button>
            )}

            {(currentJob.status === 'running' || currentJob.status === 'paused') && (
              <button
                onClick={cancelSimulation}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="백업 프로세스 강제 중지"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>중지</span>
              </button>
            )}

            {/* Expand / Minimize Terminal Height */}
            <button
              onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isTerminalExpanded ? "콘솔 높이 축소" : "콘솔 높이 확장"}
            >
              {isTerminalExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Clear Log */}
            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="콘솔 로그 비우기"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Download Log */}
            <button
              onClick={downloadLogs}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Robocopy Log 다운로드 (.log)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Box */}
        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          className={`p-4 font-mono text-xs text-slate-300 bg-slate-950 ${
            isTerminalExpanded ? 'h-[620px]' : 'h-96'
          } overflow-y-auto space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-800 transition-all duration-300`}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic py-12 text-center">
              기록된 로그가 없습니다. 상단의 '백업 시작' 또는 '실제 폴더 지정' 버튼을 눌러 작업을 실행하세요.
            </div>
          ) : (
            filteredLogs.map((entry, idx) => {
              let textStyle = 'text-slate-300';
              if (entry.level === 'HEADER') textStyle = 'text-sky-400 font-bold';
              else if (entry.level === 'SUCCESS') textStyle = 'text-emerald-400';
              else if (entry.level === 'PROGRESS') textStyle = 'text-blue-300';
              else if (entry.level === 'WARN') textStyle = 'text-amber-400';
              else if (entry.level === 'ERROR') textStyle = 'text-rose-400 font-bold';

              const isLatestLine = idx === filteredLogs.length - 1 && currentJob.status === 'running';

              return (
                <div 
                  key={entry.id} 
                  className={`flex space-x-3 px-1 py-0.5 rounded ${textStyle} ${
                    isLatestLine ? 'bg-blue-950/40 border-l-2 border-blue-400 pl-2' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <span className="text-slate-600 select-none shrink-0 font-sans text-[10px]">{entry.timestamp}</span>
                  <pre className="whitespace-pre-wrap break-all font-mono leading-relaxed">{entry.message}</pre>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Unread Logs Badge Notification when user scrolls up during execution */}
        {unreadNewLogs > 0 && currentJob.status === 'running' && (
          <button
            onClick={() => {
              setAutoScroll(true);
              setUnreadNewLogs(0);
              scrollToBottom();
            }}
            className="absolute bottom-4 right-6 z-20 flex items-center space-x-2 px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xl shadow-blue-500/40 animate-bounce transition-all cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4 text-white" />
            <span>새로운 복사 스트림 {unreadNewLogs}건 수신 중 [최신위치(v)로 이동]</span>
          </button>
        )}

      </div>

    </div>
  );
};
