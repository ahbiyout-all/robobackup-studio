using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core Suite] RoboDirectoryCrawler
    /// Robocopy 백업 대상 원본 디렉터리 트리를 안전하게 재귀 탐색(Recursive Crawl)하여
    /// 정확한 하위 디렉터리 수(TotalDirs), 파일 수(TotalFiles), 바이트 총량을 산출합니다.
    /// 권한 부족(UnauthorizedAccessException), 무한 재귀 링크(Junction/ReparsePoint),
    /// 및 /XD(디렉터리 제외) 옵션을 완벽히 처리합니다.
    /// </summary>
    public class RoboDirectoryCrawler
    {
        public class CrawlOptions
        {
            public bool IncludeSubdirectories { get; set; } = true;
            public bool ExcludeEmptyDirectories { get; set; } = false; // /S
            public bool ExcludeJunctions { get; set; } = true;         // /XJ
            public List<string> ExcludeDirPatterns { get; set; } = new List<string>(); // /XD
            public List<string> ExcludeFilePatterns { get; set; } = new List<string>(); // /XF

            // Alias properties for robust Robocopy flag binding and compiler compatibility
            public bool IsCopySubdirectoriesNoEmpty
            {
                get => ExcludeEmptyDirectories;
                set => ExcludeEmptyDirectories = value;
            }

            public bool IsCopySubdirectoriesWithEmpty
            {
                get => IncludeSubdirectories && !ExcludeEmptyDirectories;
                set => IncludeSubdirectories = value;
            }
        }

        public class CrawlProgressInfo
        {
            public int DiscoveredDirs { get; set; }
            public int DiscoveredFiles { get; set; }
            public long DiscoveredBytes { get; set; }
            public string CurrentDirectory { get; set; } = string.Empty;
        }

        public class CrawlResult
        {
            public string RootPath { get; set; } = string.Empty;
            public int TotalDirectories { get; set; }
            public int TotalFiles { get; set; }
            public long TotalBytes { get; set; }
            public List<string> SubdirectoryPaths { get; set; } = new List<string>();
            public List<string> SkippedInaccessibleDirs { get; set; } = new List<string>();
            public TimeSpan Elapsed { get; set; }
            public bool IsCancelled { get; set; }
        }

        /// <summary>
        /// 원본 디렉터리 트리를 비동기로 재귀 탐색하여 정확한 디렉터리 수와 파일 수를 집계합니다.
        /// </summary>
        public async Task<CrawlResult> CrawlAsync(
            string rootPath,
            CrawlOptions? options = null,
            CancellationToken cancellationToken = default,
            IProgress<CrawlProgressInfo>? progress = null)
        {
            options ??= new CrawlOptions();
            var sw = System.Diagnostics.Stopwatch.StartNew();

            var result = new CrawlResult
            {
                RootPath = rootPath
            };

            if (string.IsNullOrWhiteSpace(rootPath) || !Directory.Exists(rootPath))
            {
                sw.Stop();
                result.Elapsed = sw.Elapsed;
                return result;
            }

            await Task.Run(() =>
            {
                var dirQueue = new Queue<string>();
                dirQueue.Enqueue(rootPath);

                var discoveredDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var dirFileCount = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                int fileCounter = 0;
                long byteCounter = 0;
                int lastReportDirs = 0;

                while (dirQueue.Count > 0)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        result.IsCancelled = true;
                        break;
                    }

                    string currentDir = dirQueue.Dequeue();

                    try
                    {
                        var dirInfo = new DirectoryInfo(currentDir);

                        // 루트가 아닌 경우 디렉터리 목록에 추가
                        if (!string.Equals(currentDir, rootPath, StringComparison.OrdinalIgnoreCase))
                        {
                            discoveredDirs.Add(currentDir);
                        }

                        // 파일 스캔
                        int currentDirFiles = 0;
                        try
                        {
                            foreach (var file in dirInfo.GetFiles())
                            {
                                if (cancellationToken.IsCancellationRequested) break;

                                // /XF 패턴 체크
                                if (options.ExcludeFilePatterns.Count > 0 &&
                                    IsExcluded(file.Name, options.ExcludeFilePatterns))
                                {
                                    continue;
                                }

                                fileCounter++;
                                currentDirFiles++;
                                byteCounter += file.Length;
                            }
                        }
                        catch (UnauthorizedAccessException)
                        {
                            result.SkippedInaccessibleDirs.Add(currentDir);
                        }
                        catch (IOException)
                        {
                            result.SkippedInaccessibleDirs.Add(currentDir);
                        }

                        dirFileCount[currentDir] = currentDirFiles;

                        // 하위 디렉터리 탐색 (/E, /S)
                        if (options.IncludeSubdirectories)
                        {
                            try
                            {
                                foreach (var sub in dirInfo.GetDirectories())
                                {
                                    if (cancellationToken.IsCancellationRequested) break;

                                    // 1. 특수 시스템 폴더 필터링
                                    if (sub.Name.Equals("$RECYCLE.BIN", StringComparison.OrdinalIgnoreCase) ||
                                        sub.Name.Equals("System Volume Information", StringComparison.OrdinalIgnoreCase))
                                    {
                                        continue;
                                    }

                                    // 2. /XJ: 심볼릭 링크 및 Junction 포인트 배제
                                    if (options.ExcludeJunctions && (sub.Attributes & FileAttributes.ReparsePoint) != 0)
                                    {
                                        continue;
                                    }

                                    // 3. /XD: 디렉터리 제외 패턴 체크
                                    if (options.ExcludeDirPatterns.Count > 0 &&
                                        IsExcluded(sub.Name, options.ExcludeDirPatterns))
                                    {
                                        continue;
                                    }

                                    dirQueue.Enqueue(sub.FullName);
                                }
                            }
                            catch (UnauthorizedAccessException)
                            {
                                result.SkippedInaccessibleDirs.Add(currentDir);
                            }
                            catch (IOException)
                            {
                                result.SkippedInaccessibleDirs.Add(currentDir);
                            }
                        }

                        // 주기적 진행률 보고 (50개 디렉터리마다)
                        if (discoveredDirs.Count - lastReportDirs >= 50 || dirQueue.Count == 0)
                        {
                            lastReportDirs = discoveredDirs.Count;
                            progress?.Report(new CrawlProgressInfo
                            {
                                DiscoveredDirs = discoveredDirs.Count,
                                DiscoveredFiles = fileCounter,
                                DiscoveredBytes = byteCounter,
                                CurrentDirectory = currentDir
                            });
                        }
                    }
                    catch (Exception)
                    {
                        result.SkippedInaccessibleDirs.Add(currentDir);
                    }
                }

                // /S 옵션(빈 디렉터리 제외) 적용 시 자식 및 자신이 0개 파일인 디렉터리 필터링
                if (options.ExcludeEmptyDirectories)
                {
                    // 파일이 0개인 디렉터리 배제
                    var nonEmptyDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    foreach (var kvp in dirFileCount)
                    {
                        if (kvp.Value > 0)
                        {
                            string cur = kvp.Key;
                            while (!string.IsNullOrWhiteSpace(cur) &&
                                   !string.Equals(cur, rootPath, StringComparison.OrdinalIgnoreCase))
                            {
                                nonEmptyDirs.Add(cur);
                                cur = Path.GetDirectoryName(cur) ?? string.Empty;
                            }
                        }
                    }
                    result.SubdirectoryPaths = nonEmptyDirs.ToList();
                    result.TotalDirectories = nonEmptyDirs.Count;
                }
                else
                {
                    result.SubdirectoryPaths = discoveredDirs.ToList();
                    result.TotalDirectories = discoveredDirs.Count;
                }

                result.TotalFiles = fileCounter;
                result.TotalBytes = byteCounter;
            }, cancellationToken);

            sw.Stop();
            result.Elapsed = sw.Elapsed;

            // 최종 진행률 보고
            progress?.Report(new CrawlProgressInfo
            {
                DiscoveredDirs = result.TotalDirectories,
                DiscoveredFiles = result.TotalFiles,
                DiscoveredBytes = result.TotalBytes,
                CurrentDirectory = "크롤링 완료"
            });

            return result;
        }

        private static bool IsExcluded(string name, List<string> patterns)
        {
            if (string.IsNullOrWhiteSpace(name)) return false;
            foreach (var pat in patterns)
            {
                if (string.IsNullOrWhiteSpace(pat)) continue;
                string cleanPat = pat.Trim().Trim('"').Trim('*');
                if (name.IndexOf(cleanPat, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    return true;
                }
            }
            return false;
        }
    }
}
