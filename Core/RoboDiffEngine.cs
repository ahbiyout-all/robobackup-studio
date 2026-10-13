using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL 1/5] RoboDiffEngine
    /// 초고속 백업 차이 분석 &amp; 진행률 프리플라이트 엔진
    /// 원본과 대상 폴더를 초고속 병렬 스캔하여 신규/변경/삭제 파일 수와 전송 필요 바이트를 Robocopy 실행 전 1~2초 만에 산출합니다.
    /// </summary>
    public class RoboDiffEngine
    {
        public enum DiffChangeType
        {
            New,        // 원본에만 존재 (신규 복사 대상)
            Modified,   // 크기 또는 수정 일시가 다름 (업데이트 대상)
            Identical,  // 동일 파일 (복사 건너뜀)
            Extra       // 대상에만 존재 (/MIR 옵션 시 삭제 대상)
        }

        public class DiffItem
        {
            public string RelativePath { get; set; } = string.Empty;
            public DiffChangeType ChangeType { get; set; }
            public long SourceSize { get; set; }
            public long TargetSize { get; set; }
            public DateTime? SourceTime { get; set; }
            public DateTime? TargetTime { get; set; }
            public string StatusBadge => ChangeType switch
            {
                DiffChangeType.New => "✨ 신규 파일",
                DiffChangeType.Modified => "🔄 변경됨",
                DiffChangeType.Identical => "⚪ 동일 (스킵)",
                DiffChangeType.Extra => "🗑️ 대상 전용 (삭제 예정)",
                _ => "알 수 없음"
            };
        }

        public class DiffReport
        {
            public string SourcePath { get; set; } = string.Empty;
            public string TargetPath { get; set; } = string.Empty;
            public DateTime ScannedAt { get; set; } = DateTime.Now;
            public TimeSpan Elapsed { get; set; }

            public int TotalSourceFiles { get; set; }
            public int TotalTargetFiles { get; set; }
            public int NewFilesCount { get; set; }
            public int ModifiedFilesCount { get; set; }
            public int IdenticalFilesCount { get; set; }
            public int ExtraFilesCount { get; set; }

            public long TotalBytesToTransfer { get; set; }
            public long TotalSourceBytes { get; set; }
            public long TotalTargetBytes { get; set; }

            public List<DiffItem> Items { get; set; } = new List<DiffItem>();

            public string FormattedTransferSize => FormatBytes(TotalBytesToTransfer);
            public string FormattedSourceSize => FormatBytes(TotalSourceBytes);
            public string FormattedTargetSize => FormatBytes(TotalTargetBytes);

            public static string FormatBytes(long bytes)
            {
                if (bytes >= 1024L * 1024L * 1024L)
                    return $"{(double)bytes / (1024L * 1024L * 1024L):0.00} GB";
                if (bytes >= 1024L * 1024L)
                    return $"{(double)bytes / (1024L * 1024L):0.00} MB";
                if (bytes >= 1024L)
                    return $"{(double)bytes / 1024L:0.00} KB";
                return $"{bytes} B";
            }
        }

        /// <summary>
        /// 원본과 대상 폴더를 초고속 병렬 스캔하여 차이 리포트를 생성합니다.
        /// </summary>
        public async Task<DiffReport> AnalyzeDiffAsync(string sourceDir, string targetDir, CancellationToken cancellationToken = default, IProgress<string>? progress = null)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var report = new DiffReport
            {
                SourcePath = sourceDir,
                TargetPath = targetDir
            };

            await Task.Run(() =>
            {
                progress?.Report("원본 폴더 색인 스캔 중...");
                var sourceFiles = ScanDirectoryFast(sourceDir, cancellationToken);
                report.TotalSourceFiles = sourceFiles.Count;
                report.TotalSourceBytes = sourceFiles.Values.Sum(f => f.Length);

                progress?.Report("대상 백업 폴더 색인 스캔 중...");
                var targetFiles = Directory.Exists(targetDir) ? ScanDirectoryFast(targetDir, cancellationToken) : new Dictionary<string, FileMeta>(StringComparer.OrdinalIgnoreCase);
                report.TotalTargetFiles = targetFiles.Count;
                report.TotalTargetBytes = targetFiles.Values.Sum(f => f.Length);

                progress?.Report("고속 파일 차이 비교 분석 중...");
                var items = new ConcurrentBag<DiffItem>();

                // 원본 파일 순회 (신규, 수정, 동일 판별)
                Parallel.ForEach(sourceFiles, new ParallelOptions { CancellationToken = cancellationToken }, kv =>
                {
                    string relPath = kv.Key;
                    var src = kv.Value;

                    if (!targetFiles.TryGetValue(relPath, out var tgt))
                    {
                        items.Add(new DiffItem
                        {
                            RelativePath = relPath,
                            ChangeType = DiffChangeType.New,
                            SourceSize = src.Length,
                            SourceTime = src.LastWriteTime
                        });
                    }
                    else
                    {
                        bool isDiff = (src.Length != tgt.Length) || (Math.Abs((src.LastWriteTime - tgt.LastWriteTime).TotalSeconds) > 2);
                        if (isDiff)
                        {
                            items.Add(new DiffItem
                            {
                                RelativePath = relPath,
                                ChangeType = DiffChangeType.Modified,
                                SourceSize = src.Length,
                                TargetSize = tgt.Length,
                                SourceTime = src.LastWriteTime,
                                TargetTime = tgt.LastWriteTime
                            });
                        }
                        else
                        {
                            items.Add(new DiffItem
                            {
                                RelativePath = relPath,
                                ChangeType = DiffChangeType.Identical,
                                SourceSize = src.Length,
                                TargetSize = tgt.Length,
                                SourceTime = src.LastWriteTime,
                                TargetTime = tgt.LastWriteTime
                            });
                        }
                    }
                });

                // 대상 파일 순회 (원본에 없는 Extra 파일 판별)
                Parallel.ForEach(targetFiles, new ParallelOptions { CancellationToken = cancellationToken }, kv =>
                {
                    string relPath = kv.Key;
                    if (!sourceFiles.ContainsKey(relPath))
                    {
                        var tgt = kv.Value;
                        items.Add(new DiffItem
                        {
                            RelativePath = relPath,
                            ChangeType = DiffChangeType.Extra,
                            TargetSize = tgt.Length,
                            TargetTime = tgt.LastWriteTime
                        });
                    }
                });

                report.Items = items.OrderBy(i => i.ChangeType).ThenBy(i => i.RelativePath).ToList();
                report.NewFilesCount = report.Items.Count(i => i.ChangeType == DiffChangeType.New);
                report.ModifiedFilesCount = report.Items.Count(i => i.ChangeType == DiffChangeType.Modified);
                report.IdenticalFilesCount = report.Items.Count(i => i.ChangeType == DiffChangeType.Identical);
                report.ExtraFilesCount = report.Items.Count(i => i.ChangeType == DiffChangeType.Extra);

                report.TotalBytesToTransfer = report.Items
                    .Where(i => i.ChangeType == DiffChangeType.New || i.ChangeType == DiffChangeType.Modified)
                    .Sum(i => i.SourceSize);

            }, cancellationToken);

            sw.Stop();
            report.Elapsed = sw.Elapsed;
            progress?.Report($"분석 완료! (소요 시간: {sw.ElapsedMilliseconds}ms, 전송 대상: {report.FormattedTransferSize})");

            return report;
        }

        private struct FileMeta
        {
            public long Length;
            public DateTime LastWriteTime;
        }

        private Dictionary<string, FileMeta> ScanDirectoryFast(string rootPath, CancellationToken cancellationToken)
        {
            var result = new Dictionary<string, FileMeta>(StringComparer.OrdinalIgnoreCase);
            if (!Directory.Exists(rootPath)) return result;

            var rootUri = new Uri(rootPath.EndsWith("\\") ? rootPath : rootPath + "\\");
            var dirQueue = new Queue<string>();
            dirQueue.Enqueue(rootPath);

            while (dirQueue.Count > 0)
            {
                cancellationToken.ThrowIfCancellationRequested();
                string currentDir = dirQueue.Dequeue();

                try
                {
                    var dirInfo = new DirectoryInfo(currentDir);
                    foreach (var file in dirInfo.GetFiles())
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        string fullPath = file.FullName;
                        string relative = rootUri.MakeRelativeUri(new Uri(fullPath)).ToString().Replace('/', '\\');
                        result[Uri.UnescapeDataString(relative)] = new FileMeta
                        {
                            Length = file.Length,
                            LastWriteTime = file.LastWriteTime
                        };
                    }

                    foreach (var sub in dirInfo.GetDirectories())
                    {
                        // 특수/시스템 폴더 스킵
                        if ((sub.Attributes & FileAttributes.ReparsePoint) != 0) continue;
                        if (sub.Name.Equals("$RECYCLE.BIN", StringComparison.OrdinalIgnoreCase)) continue;
                        if (sub.Name.Equals("System Volume Information", StringComparison.OrdinalIgnoreCase)) continue;
                        dirQueue.Enqueue(sub.FullName);
                    }
                }
                catch (UnauthorizedAccessException) { }
                catch (IOException) { }
            }

            return result;
        }
    }
}
