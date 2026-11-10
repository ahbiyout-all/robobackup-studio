import { TelemetryDataPoint, BackupRunHistoryItem } from '../types';

/**
 * Generate a realistic curve of telemetry points for a backup run
 */
export function generateSampleTelemetry(
  totalFiles: number = 1420,
  totalBytes: number = 4.88 * 1024 * 1024 * 1024,
  durationSec: number = 60,
  targetPeakMbps: number = 580,
  threads: number = 16
): TelemetryDataPoint[] {
  const points: TelemetryDataPoint[] = [];
  const interval = Math.max(2, Math.floor(durationSec / 15));
  let currentCopiedFiles = 0;
  let currentCopiedBytes = 0;

  for (let t = 0; t <= durationSec; t += interval) {
    const progressRatio = t / durationSec;
    // S-curve for file progression
    const fileRatio = Math.sin((progressRatio * Math.PI) / 2);
    currentCopiedFiles = Math.min(totalFiles, Math.round(totalFiles * fileRatio));
    currentCopiedBytes = Math.min(totalBytes, Math.round(totalBytes * fileRatio));

    // Realistic multi-threaded speed fluctuation
    let speedFactor = 1;
    if (progressRatio < 0.2) {
      speedFactor = 0.5 + progressRatio * 2.5; // Ramp up
    } else if (progressRatio > 0.85) {
      speedFactor = 1 - (progressRatio - 0.85) * 1.5; // Finalize flush
    } else {
      // Natural jitter around peak
      speedFactor = 0.85 + Math.sin(t * 0.4) * 0.15;
    }

    const speedMbps = Math.round(targetPeakMbps * Math.max(0.3, speedFactor));
    const speedMBs = parseFloat((speedMbps / 8).toFixed(1));

    points.push({
      timestamp: `${t}초`,
      elapsedSeconds: t,
      speedMbps,
      speedMBs,
      copiedFiles: currentCopiedFiles,
      totalFiles,
      copiedBytes: currentCopiedBytes,
      activeThreads: threads,
    });
  }

  // Ensure 100% final point exists
  if (points.length === 0 || points[points.length - 1].elapsedSeconds !== durationSec) {
    points.push({
      timestamp: `${durationSec}초`,
      elapsedSeconds: durationSec,
      speedMbps: Math.round(targetPeakMbps * 0.6),
      speedMBs: parseFloat(((targetPeakMbps * 0.6) / 8).toFixed(1)),
      copiedFiles: totalFiles,
      totalFiles,
      copiedBytes: totalBytes,
      activeThreads: threads,
    });
  }

  return points;
}

/**
 * Default historical runs stored in job state for immediate analytics exploration
 */
export function getDefaultRunHistory(): BackupRunHistoryItem[] {
  const telemetry1 = generateSampleTelemetry(1420, 5.1 * 1024 * 1024 * 1024, 65, 590, 16);
  const telemetry2 = generateSampleTelemetry(340, 1.25 * 1024 * 1024 * 1024, 25, 620, 32);
  const telemetry3 = generateSampleTelemetry(1150, 3.8 * 1024 * 1024 * 1024, 55, 480, 8);

  return [
    {
      id: 'run-hist-1',
      runDate: '2026-10-30 03:00',
      jobName: '중요 문서 고속 미러 백업 (야간 스케줄)',
      durationSeconds: 65,
      totalFiles: 1420,
      copiedFiles: 1420,
      totalBytes: 5.1 * 1024 * 1024 * 1024,
      copiedBytes: 5.1 * 1024 * 1024 * 1024,
      avgSpeedMbps: 495,
      peakSpeedMbps: 590,
      status: 'success',
      telemetry: telemetry1,
    },
    {
      id: 'run-hist-2',
      runDate: '2026-10-31 03:00',
      jobName: '증분 차등 고속 백업 (/E /XO /XC)',
      durationSeconds: 25,
      totalFiles: 340,
      copiedFiles: 340,
      totalBytes: 1.25 * 1024 * 1024 * 1024,
      copiedBytes: 1.25 * 1024 * 1024 * 1024,
      avgSpeedMbps: 524,
      peakSpeedMbps: 620,
      status: 'success',
      telemetry: telemetry2,
    },
    {
      id: 'run-hist-3',
      runDate: '2026-11-01 02:30',
      jobName: 'LAN / NAS 네트워크 동기화 (/MIR /ZB /FFT)',
      durationSeconds: 55,
      totalFiles: 1150,
      copiedFiles: 1150,
      totalBytes: 3.8 * 1024 * 1024 * 1024,
      copiedBytes: 3.8 * 1024 * 1024 * 1024,
      avgSpeedMbps: 420,
      peakSpeedMbps: 480,
      status: 'success',
      telemetry: telemetry3,
    },
  ];
}
