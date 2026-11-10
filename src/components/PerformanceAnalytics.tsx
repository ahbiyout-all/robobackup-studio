import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Zap,
  Files,
  HardDrive,
  Clock,
  TrendingUp,
  Download,
  RotateCcw,
  BarChart3,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight,
  Gauge,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { BackupJob, TelemetryDataPoint, BackupRunHistoryItem } from '../types';
import { generateSampleTelemetry } from '../utils/telemetryHelper';

interface PerformanceAnalyticsProps {
  currentJob: BackupJob;
  setCurrentJob: React.Dispatch<React.SetStateAction<BackupJob>>;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  currentJob,
  setCurrentJob,
}) => {
  // Run Selection: 'current' (live / latest run) or a history run ID
  const [selectedRunId, setSelectedRunId] = useState<string>('current');
  const [viewMode, setViewMode] = useState<'combined' | 'speed' | 'files' | 'history'>('combined');
  const [speedUnit, setSpeedUnit] = useState<'mbps' | 'mbs'>('mbps');
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);
  const [showPeakLine, setShowPeakLine] = useState<boolean>(true);

  // Active run data
  const currentTelemetry = useMemo(() => {
    if (selectedRunId === 'current') {
      if (currentJob.telemetryHistory && currentJob.telemetryHistory.length > 0) {
        return currentJob.telemetryHistory;
      }
      // If live run has no points yet, synthesize an accurate baseline curve based on current job metrics
      return generateSampleTelemetry(
        currentJob.totalFiles || 1420,
        currentJob.totalBytes || 4.88 * 1024 * 1024 * 1024,
        60,
        currentJob.currentSpeedMbps ? Math.round(currentJob.currentSpeedMbps * 8) : 520,
        currentJob.flags.threads || 16
      );
    }

    const found = currentJob.runHistory?.find((h) => h.id === selectedRunId);
    return found ? found.telemetry : [];
  }, [selectedRunId, currentJob.telemetryHistory, currentJob.runHistory, currentJob.totalFiles, currentJob.totalBytes, currentJob.currentSpeedMbps, currentJob.flags.threads]);

  // Selected run metadata
  const selectedRunMeta = useMemo(() => {
    if (selectedRunId === 'current') {
      return {
        title: currentJob.name || '현재 백업 작업 (Current Job)',
        date: currentJob.lastRun || '최근 실행 기록',
        status: currentJob.status,
        threads: currentJob.flags.threads || 16,
      };
    }
    const found = currentJob.runHistory?.find((h) => h.id === selectedRunId);
    return {
      title: found?.jobName || '과거 백업 실행',
      date: found?.runDate || '-',
      status: found?.status || 'success',
      threads: found?.telemetry[0]?.activeThreads || 16,
    };
  }, [selectedRunId, currentJob]);

  // Computed summary metrics for active telemetry
  const metrics = useMemo(() => {
    if (!currentTelemetry || currentTelemetry.length === 0) {
      return {
        peakSpeedMbps: 0,
        peakSpeedMBs: 0,
        avgSpeedMbps: 0,
        avgSpeedMBs: 0,
        totalFiles: 0,
        totalBytes: 0,
        durationSeconds: 0,
        efficiencyRatio: 0,
      };
    }

    const peakMbps = Math.max(...currentTelemetry.map((p) => p.speedMbps));
    const sumMbps = currentTelemetry.reduce((sum, p) => sum + p.speedMbps, 0);
    const avgMbps = Math.round(sumMbps / currentTelemetry.length);
    const lastPoint = currentTelemetry[currentTelemetry.length - 1];

    return {
      peakSpeedMbps: peakMbps,
      peakSpeedMBs: parseFloat((peakMbps / 8).toFixed(1)),
      avgSpeedMbps: avgMbps,
      avgSpeedMBs: parseFloat((avgMbps / 8).toFixed(1)),
      totalFiles: lastPoint?.copiedFiles || currentJob.copiedFiles || 1420,
      totalBytes: lastPoint?.copiedBytes || currentJob.copiedBytes || 4.88 * 1024 * 1024 * 1024,
      durationSeconds: lastPoint?.elapsedSeconds || 60,
      efficiencyRatio: avgMbps > 0 && peakMbps > 0 ? Math.round((avgMbps / peakMbps) * 100) : 92,
    };
  }, [currentTelemetry, currentJob.copiedFiles, currentJob.copiedBytes]);

  // Formatter helpers
  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return `${bytes} B`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}초`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}분 ${s}초`;
  };

  // Export Telemetry to CSV
  const exportTelemetryCsv = () => {
    if (!currentTelemetry || currentTelemetry.length === 0) return;
    const header = '경과시간(초),시각,전송속도(Mbps),전송속도(MB/s),처리된파일수,전체파일수,전송바이트\n';
    const rows = currentTelemetry
      .map(
        (p) =>
          `${p.elapsedSeconds},"${p.timestamp}",${p.speedMbps},${p.speedMBs},${p.copiedFiles},${p.totalFiles},${p.copiedBytes}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoboBackup_Telemetry_${selectedRunId}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Telemetry to JSON
  const exportTelemetryJson = () => {
    const data = {
      runId: selectedRunId,
      runMeta: selectedRunMeta,
      metrics,
      telemetry: currentTelemetry,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoboBackup_Telemetry_${selectedRunId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Regenerate fresh benchmark sample telemetry
  const handleRegenerateBenchmark = () => {
    const fresh = generateSampleTelemetry(
      currentJob.totalFiles || 1420,
      currentJob.totalBytes || 4.88 * 1024 * 1024 * 1024,
      60,
      560 + Math.floor(Math.random() * 120),
      currentJob.flags.threads || 16
    );

    setCurrentJob((prev) => ({
      ...prev,
      telemetryHistory: fresh,
    }));
    setSelectedRunId('current');
  };

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: TelemetryDataPoint = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-slate-300">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>경과 시간: {data.elapsedSeconds}초</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">({data.timestamp})</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>전송 속도:</span>
          </span>
          <span className="font-mono font-bold text-cyan-300">
            {speedUnit === 'mbps' ? `${data.speedMbps} Mbps` : `${data.speedMBs} MB/s`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>누적 처리 파일:</span>
          </span>
          <span className="font-mono font-bold text-emerald-300">
            {data.copiedFiles.toLocaleString()} / {data.totalFiles.toLocaleString()}개
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-400">전송 용량:</span>
          <span className="font-mono text-amber-300">{formatBytes(data.copiedBytes)}</span>
        </div>
      </div>
    );
  };

  // Historical runs comparison chart dataset
  const historicalComparisonData = useMemo(() => {
    const list = currentJob.runHistory || [];
    const currentRunItem = {
      name: '현재 실행',
      runDate: '오늘 (Live)',
      avgSpeedMbps: metrics.avgSpeedMbps,
      peakSpeedMbps: metrics.peakSpeedMbps,
      copiedFiles: metrics.totalFiles,
      durationSeconds: metrics.durationSeconds,
    };

    return [
      ...list.map((h, i) => ({
        name: `이전 실행 #${i + 1}`,
        runDate: h.runDate.split(' ')[0],
        avgSpeedMbps: h.avgSpeedMbps,
        peakSpeedMbps: h.peakSpeedMbps,
        copiedFiles: h.copiedFiles,
        durationSeconds: h.durationSeconds,
      })),
      currentRunItem,
    ];
  }, [currentJob.runHistory, metrics]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white">성능 분석 (Performance Analytics)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Recharts 실시간 차트
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                멀티스레드 ({currentJob.flags.threads}T)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              백업 작업의 시간에 따른 전송 속도(Mbps)와 누적 파일 처리량을 시각화하여 I/O 병목 및 스루풋 성능을 정밀 분석합니다.
            </p>
          </div>
        </div>

        {/* Action Buttons & Run Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Historical Run Selector Dropdown */}
          <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="current" className="bg-slate-900 text-white">
                🚀 현재/최신 백업 텔레메트리
              </option>
              {currentJob.runHistory?.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                  📅 {h.runDate} ({h.jobName.substring(0, 16)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Export Dropdown */}
          <button
            onClick={exportTelemetryCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
            title="현재 차트 텔레메트리 데이터를 CSV 파일로 내보냅니다."
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV 저장</span>
          </button>

          <button
            onClick={exportTelemetryJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 cursor-pointer"
            title="현재 차트 텔레메트리 데이터를 JSON 파일로 내보냅니다."
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>JSON 저장</span>
          </button>

          <button
            onClick={handleRegenerateBenchmark}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white text-xs font-bold border border-blue-500/40 transition-all active:scale-95 cursor-pointer"
            title="고성능 벤치마크 텔레메트리 커브를 새로 생성합니다."
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>벤치마크 갱신</span>
          </button>
        </div>
      </div>

      {/* 6 Key Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Peak Speed */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>최고 전송 속도</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-300 font-mono">
            {speedUnit === 'mbps' ? `${metrics.peakSpeedMbps} Mbps` : `${metrics.peakSpeedMBs} MB/s`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {speedUnit === 'mbps' ? `약 ${metrics.peakSpeedMBs} MB/s` : `약 ${metrics.peakSpeedMbps} Mbps`}
          </div>
        </div>

        {/* Card 2: Avg Speed */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>평균 전송 속도</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-cyan-300 font-mono">
            {speedUnit === 'mbps' ? `${metrics.avgSpeedMbps} Mbps` : `${metrics.avgSpeedMBs} MB/s`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {speedUnit === 'mbps' ? `약 ${metrics.avgSpeedMBs} MB/s` : `약 ${metrics.avgSpeedMbps} Mbps`}
          </div>
        </div>

        {/* Card 3: Files Processed */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>처리된 파일 수</span>
            <Files className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-300 font-mono">
            {metrics.totalFiles.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">파일 동기화 완료</div>
        </div>

        {/* Card 4: Transferred Bytes */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>전송된 데이터 크기</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-sky-300 font-mono">
            {formatBytes(metrics.totalBytes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">누적 I/O 바이트</div>
        </div>

        {/* Card 5: Duration */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>소요 시간</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-300 font-mono">
            {formatDuration(metrics.durationSeconds)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">총 실행 타임스탬프</div>
        </div>

        {/* Card 6: Efficiency Ratio */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>스루풋 효율성</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-300 font-mono">
            {metrics.efficiencyRatio}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">평균/최고 속도 비율</div>
        </div>
      </div>

      {/* Main Chart Card with View Tabs & Chart Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        {/* View Mode & Unit Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          {/* 4 View Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 space-x-1 shrink-0">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'combined'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>통합 대시보드 (속도 + 파일)</span>
            </button>
            <button
              onClick={() => setViewMode('speed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'speed'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>전송 속도 (Mbps)</span>
            </button>
            <button
              onClick={() => setViewMode('files')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'files'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>파일 처리 추이</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>과거 실행 비교</span>
            </button>
          </div>

          {/* Unit Toggle and Reference Line Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Speed Unit Toggle */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 pl-2 pr-1 font-semibold">단위:</span>
              <button
                onClick={() => setSpeedUnit('mbps')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  speedUnit === 'mbps' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mbps (비트)
              </button>
              <button
                onClick={() => setSpeedUnit('mbs')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  speedUnit === 'mbs' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                MB/s (바이트)
              </button>
            </div>

            {/* Reference Line Toggles */}
            <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAverageLine}
                onChange={(e) => setShowAverageLine(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800 cursor-pointer"
              />
              <span>평균선</span>
            </label>

            <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPeakLine}
                onChange={(e) => setShowPeakLine(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-800 cursor-pointer"
              />
              <span>최고속도선</span>
            </label>
          </div>
        </div>

        {/* Chart View Rendering based on active tab */}
        <div className="w-full h-[380px]">
          {/* VIEW 1: Combined Speed (Mbps) and Files Processed ComposedChart */}
          {viewMode === 'combined' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentTelemetry} margin={{ top: 15, right: 25, bottom: 20, left: 10 }}>
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="filesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: '경과 시간 (Elapsed Time)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                />
                {/* Left Y-Axis: Speed */}
                <YAxis
                  yAxisId="speed"
                  stroke="#06b6d4"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                  label={{
                    value: speedUnit === 'mbps' ? '전송 속도 (Mbps)' : '전송 속도 (MB/s)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#06b6d4',
                    fontSize: 11,
                    offset: 5,
                  }}
                />
                {/* Right Y-Axis: Files Count */}
                <YAxis
                  yAxisId="files"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 'auto']}
                  label={{
                    value: '누적 처리 파일 수 (Files)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#10b981',
                    fontSize: 11,
                    offset: 5,
                  }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

                {/* Speed Area on Left Y-Axis */}
                <Area
                  yAxisId="speed"
                  type="monotone"
                  dataKey={speedUnit === 'mbps' ? 'speedMbps' : 'speedMBs'}
                  name={speedUnit === 'mbps' ? '전송 속도 (Mbps)' : '전송 속도 (MB/s)'}
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#speedGradient)"
                />

                {/* Files Processed Line on Right Y-Axis */}
                <Line
                  yAxisId="files"
                  type="monotone"
                  dataKey="copiedFiles"
                  name="누적 처리 파일 수 (개)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />

                {/* Reference Lines */}
                {showAverageLine && (
                  <ReferenceLine
                    yAxisId="speed"
                    y={speedUnit === 'mbps' ? metrics.avgSpeedMbps : metrics.avgSpeedMBs}
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    label={{
                      value: `평균 ${speedUnit === 'mbps' ? `${metrics.avgSpeedMbps} Mbps` : `${metrics.avgSpeedMBs} MB/s`}`,
                      fill: '#38bdf8',
                      fontSize: 11,
                      position: 'top',
                    }}
                  />
                )}
                {showPeakLine && (
                  <ReferenceLine
                    yAxisId="speed"
                    y={speedUnit === 'mbps' ? metrics.peakSpeedMbps : metrics.peakSpeedMBs}
                    stroke="#fbbf24"
                    strokeDasharray="2 2"
                    label={{
                      value: `최고 ${speedUnit === 'mbps' ? `${metrics.peakSpeedMbps} Mbps` : `${metrics.peakSpeedMBs} MB/s`}`,
                      fill: '#fbbf24',
                      fontSize: 11,
                      position: 'insideTopLeft',
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 2: Speed Focused AreaChart */}
          {viewMode === 'speed' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentTelemetry} margin={{ top: 15, right: 25, bottom: 20, left: 10 }}>
                <defs>
                  <linearGradient id="speedDedicatedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#38bdf8"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: speedUnit === 'mbps' ? '속도 (Mbps)' : '속도 (MB/s)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#38bdf8',
                    fontSize: 11,
                  }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey={speedUnit === 'mbps' ? 'speedMbps' : 'speedMBs'}
                  name={speedUnit === 'mbps' ? 'Robocopy 속도 (Mbps)' : 'Robocopy 속도 (MB/s)'}
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#speedDedicatedGradient)"
                />
                {showAverageLine && (
                  <ReferenceLine
                    y={speedUnit === 'mbps' ? metrics.avgSpeedMbps : metrics.avgSpeedMBs}
                    stroke="#a7f3d0"
                    strokeDasharray="4 4"
                    label={{
                      value: `평균: ${speedUnit === 'mbps' ? `${metrics.avgSpeedMbps} Mbps` : `${metrics.avgSpeedMBs} MB/s`}`,
                      fill: '#a7f3d0',
                      fontSize: 11,
                    }}
                  />
                )}
                {showPeakLine && (
                  <ReferenceLine
                    y={speedUnit === 'mbps' ? metrics.peakSpeedMbps : metrics.peakSpeedMBs}
                    stroke="#fbbf24"
                    strokeDasharray="3 3"
                    label={{
                      value: `최고 속도: ${speedUnit === 'mbps' ? `${metrics.peakSpeedMbps} Mbps` : `${metrics.peakSpeedMBs} MB/s`}`,
                      fill: '#fbbf24',
                      fontSize: 11,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 3: Files Processed Focused AreaChart */}
          {viewMode === 'files' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentTelemetry} margin={{ top: 15, right: 25, bottom: 20, left: 10 }}>
                <defs>
                  <linearGradient id="filesDedicatedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: '누적 처리 파일 수 (개)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#10b981',
                    fontSize: 11,
                  }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="copiedFiles"
                  name="누적 처리된 파일 수 (개)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#filesDedicatedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* VIEW 4: Historical Runs Comparison BarChart */}
          {viewMode === 'history' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalComparisonData} margin={{ top: 15, right: 25, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="speed"
                  stroke="#06b6d4"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: '평균 속도 (Mbps)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#06b6d4',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  yAxisId="files"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  label={{
                    value: '처리 파일 수 (개)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#10b981',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">{d.name} ({d.runDate})</div>
                        <div className="text-cyan-300">평균 속도: {d.avgSpeedMbps} Mbps</div>
                        <div className="text-amber-300">최고 속도: {d.peakSpeedMbps} Mbps</div>
                        <div className="text-emerald-300">처리 파일 수: {d.copiedFiles.toLocaleString()}개</div>
                        <div className="text-purple-300">소요 시간: {d.durationSeconds}초</div>
                      </div>
                    );
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="speed" dataKey="avgSpeedMbps" name="평균 속도 (Mbps)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="files" dataKey="copiedFiles" name="처리 파일 수 (개)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Telemetry Data Points Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-base">📊 세부 텔레메트리 타임스탬프 기록</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              총 {currentTelemetry.length}개 측정 구간
            </span>
          </div>

          <span className="text-xs text-slate-400">
            측정 대상: <strong className="text-slate-200">{selectedRunMeta.title}</strong> ({selectedRunMeta.date})
          </span>
        </div>

        <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-800 scrollbar-thin scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 font-sans">
              <tr>
                <th className="py-2.5 px-3">경과 시간</th>
                <th className="py-2.5 px-3">타임스탬프</th>
                <th className="py-2.5 px-3">전송 속도 (Mbps)</th>
                <th className="py-2.5 px-3">전송 속도 (MB/s)</th>
                <th className="py-2.5 px-3">누적 처리 파일</th>
                <th className="py-2.5 px-3">전송 데이터 크기</th>
                <th className="py-2.5 px-3">활성 스레드</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-300">
              {currentTelemetry.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-bold text-blue-400">{p.elapsedSeconds}초</td>
                  <td className="py-2 px-3 text-slate-400 font-sans">{p.timestamp}</td>
                  <td className="py-2 px-3 text-cyan-300 font-bold">{p.speedMbps} Mbps</td>
                  <td className="py-2 px-3 text-slate-200">{p.speedMBs} MB/s</td>
                  <td className="py-2 px-3 text-emerald-300 font-bold">
                    {p.copiedFiles.toLocaleString()} / {p.totalFiles.toLocaleString()}개
                  </td>
                  <td className="py-2 px-3 text-amber-300">{formatBytes(p.copiedBytes)}</td>
                  <td className="py-2 px-3 text-purple-300">{p.activeThreads || currentJob.flags.threads || 16}T</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
