using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL 5/5] RoboTimeMachine
    /// NTFS 스마트 하드링크 &amp; 타임머신 버전 보관소
    /// Win32 CreateHardLinkW API를 활용하여, 이전 백업본과 동일한 파일은 물리 용량을 소모하지 않는
    /// NTFS 하드링크(HardLink)로 연결하고 변경된 파일만 실물 복사하여 디스크 용량을 80~95% 절약하는 macOS 타임머신 방식 아카이빙 엔진입니다.
    /// </summary>
    public class RoboTimeMachine
    {
        [DllImport("Kernel32.dll", EntryPoint = "CreateHardLinkW", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool CreateHardLink(string lpFileName, string lpExistingFileName, IntPtr lpSecurityAttributes);

        public class SnapshotResult
        {
            public string SnapshotPath { get; set; } = string.Empty;
            public DateTime Timestamp { get; set; } = DateTime.Now;
            public int TotalFilesCount { get; set; }
            public int HardLinkedFilesCount { get; set; }
            public int NewlyCopiedFilesCount { get; set; }
            public long VirtualSizeBytes { get; set; }
            public long ActualPhysicalBytes { get; set; }
            public double SpaceSavedPercent => VirtualSizeBytes > 0 ? (1.0 - (double)ActualPhysicalBytes / VirtualSizeBytes) * 100.0 : 0.0;
            public TimeSpan Elapsed { get; set; }

            public string FormattedVirtualSize => RoboDiffEngine.DiffReport.FormatBytes(VirtualSizeBytes);
            public string FormattedPhysicalSize => RoboDiffEngine.DiffReport.FormatBytes(ActualPhysicalBytes);
        }

        /// <summary>
        /// 원본 폴더를 대상 루트 경로 하위에 타임스탬프 스냅샷으로 생성하며, 직전 스냅샷과 동일한 파일은 NTFS 하드링크로 연결합니다.
        /// </summary>
        public async Task<SnapshotResult> CreateTimeMachineSnapshotAsync(
            string sourceDir, 
            string targetRootRepo, 
            CancellationToken cancellationToken = default, 
            IProgress<string>? progress = null)
        {
            if (!Directory.Exists(sourceDir))
                throw new DirectoryNotFoundException($"원본 폴더를 찾을 수 없습니다: {sourceDir}");

            Directory.CreateDirectory(targetRootRepo);

            var sw = System.Diagnostics.Stopwatch.StartNew();
            string timestampFolder = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
            string newSnapshotDir = Path.Combine(targetRootRepo, timestampFolder);
            Directory.CreateDirectory(newSnapshotDir);

            var result = new SnapshotResult
            {
                SnapshotPath = newSnapshotDir,
                Timestamp = DateTime.Now
            };

            await Task.Run(() =>
            {
                // 이전 최신 스냅샷 폴더 검색
                var prevSnapshots = Directory.GetDirectories(targetRootRepo)
                    .Where(d => !d.Equals(newSnapshotDir, StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(d => Path.GetFileName(d))
                    .ToList();

                string? previousSnapshotDir = prevSnapshots.FirstOrDefault();

                progress?.Report(previousSnapshotDir != null
                    ? $"이전 스냅샷 발견: {Path.GetFileName(previousSnapshotDir)} (하드링크 차등 연결 준비)"
                    : "첫 번째 스냅샷 기준점 생성 중...");

                var rootUri = new Uri(sourceDir.EndsWith("\\") ? sourceDir : sourceDir + "\\");
                var allFiles = Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories);
                result.TotalFilesCount = allFiles.Length;

                foreach (var srcFile in allFiles)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var fileInfo = new FileInfo(srcFile);
                    long fileLen = fileInfo.Length;
                    DateTime fileWrite = fileInfo.LastWriteTime;

                    result.VirtualSizeBytes += fileLen;

                    string rel = rootUri.MakeRelativeUri(new Uri(srcFile)).ToString().Replace('/', '\\');
                    rel = Uri.UnescapeDataString(rel);
                    string destFile = Path.Combine(newSnapshotDir, rel);

                    string? destDir = Path.GetDirectoryName(destFile);
                    if (!string.IsNullOrEmpty(destDir)) Directory.CreateDirectory(destDir);

                    bool linked = false;
                    if (previousSnapshotDir != null)
                    {
                        string prevFile = Path.Combine(previousSnapshotDir, rel);
                        if (File.Exists(prevFile))
                        {
                            var prevInfo = new FileInfo(prevFile);
                            // 파일 크기 및 수정 일시가 같으면 NTFS 하드링크 생성
                            if (prevInfo.Length == fileLen && Math.Abs((prevInfo.LastWriteTime - fileWrite).TotalSeconds) <= 2)
                            {
                                if (CreateHardLink(destFile, prevFile, IntPtr.Zero))
                                {
                                    linked = true;
                                    result.HardLinkedFilesCount++;
                                }
                            }
                        }
                    }

                    if (!linked)
                    {
                        // 새 파일이거나 변경된 파일: 실물 복사
                        File.Copy(srcFile, destFile, true);
                        result.NewlyCopiedFilesCount++;
                        result.ActualPhysicalBytes += fileLen;
                    }
                }
            }, cancellationToken);

            sw.Stop();
            result.Elapsed = sw.Elapsed;
            progress?.Report($"타임머신 스냅샷 생성 완료! (하드링크: {result.HardLinkedFilesCount}개, 신규: {result.NewlyCopiedFilesCount}개, 디스크 절약: {result.SpaceSavedPercent:0.0}%)");

            return result;
        }

        /// <summary>
        /// 보관소 내의 모든 과거 타임머신 스냅샷 목록을 조회합니다.
        /// </summary>
        public List<string> GetExistingSnapshots(string targetRootRepo)
        {
            if (!Directory.Exists(targetRootRepo)) return new List<string>();
            return Directory.GetDirectories(targetRootRepo)
                .Select(Path.GetFileName)
                .Where(name => !string.IsNullOrEmpty(name))
                .OrderByDescending(name => name)
                .ToList()!;
        }
    }
}
