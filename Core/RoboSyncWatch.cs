using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL 3/5] RoboSyncWatch
    /// 스마트 큐 기반 실시간 자동 동기화 감시 엔진
    /// FileSystemWatcher의 버스트 이벤트를 스마트 디바운스(Debounce) 큐로 완충하여,
    /// 파일 쓰기가 완전히 완료된 후(Quiet Period) 안전하게 Robocopy 백그라운드 동기화를 자동 호출합니다.
    /// </summary>
    public class RoboSyncWatch : IDisposable
    {
        public class WatchEventItem
        {
            public DateTime Timestamp { get; set; } = DateTime.Now;
            public string ChangeType { get; set; } = string.Empty; // Created, Changed, Deleted, Renamed
            public string FullPath { get; set; } = string.Empty;
            public string RelativePath { get; set; } = string.Empty;
        }

        private FileSystemWatcher? _watcher;
        private Timer? _debounceTimer;
        private readonly ConcurrentDictionary<string, WatchEventItem> _pendingChanges = new(StringComparer.OrdinalIgnoreCase);
        private readonly object _lock = new();

        public bool IsRunning => _watcher != null && _watcher.EnableRaisingEvents;
        public string WatchedPath { get; private set; } = string.Empty;
        public int DebounceSeconds { get; set; } = 5;

        public event EventHandler<WatchEventItem>? FileActivityDetected;
        public event EventHandler<IReadOnlyList<WatchEventItem>>? SyncTriggered;

        /// <summary>
        /// 지정한 폴더에 대한 실시간 변경 감시를 시작합니다.
        /// </summary>
        public void Start(string directoryPath, int debounceSeconds = 5)
        {
            if (!Directory.Exists(directoryPath))
                throw new DirectoryNotFoundException($"감시 대상 폴더를 찾을 수 없습니다: {directoryPath}");

            Stop();

            WatchedPath = directoryPath;
            DebounceSeconds = Math.Max(1, debounceSeconds);

            _watcher = new FileSystemWatcher(directoryPath)
            {
                IncludeSubdirectories = true,
                NotifyFilter = NotifyFilters.FileName | NotifyFilters.DirectoryName |
                               NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.CreationTime,
                InternalBufferSize = 65536 // 64KB 버퍼로 대량 변경 누락 방지
            };

            _watcher.Created += OnFileSystemEvent;
            _watcher.Changed += OnFileSystemEvent;
            _watcher.Deleted += OnFileSystemEvent;
            _watcher.Renamed += (s, e) =>
            {
                RecordChange("Renamed", e.FullPath, directoryPath);
            };

            _watcher.EnableRaisingEvents = true;
        }

        private void OnFileSystemEvent(object sender, FileSystemEventArgs e)
        {
            RecordChange(e.ChangeType.ToString(), e.FullPath, WatchedPath);
        }

        private void RecordChange(string changeType, string fullPath, string rootPath)
        {
            // 임시 파일 무시
            string fileName = Path.GetFileName(fullPath);
            if (fileName.StartsWith("~$") || fileName.EndsWith(".tmp", StringComparison.OrdinalIgnoreCase) || fileName.EndsWith(".crdownload", StringComparison.OrdinalIgnoreCase))
                return;

            string relative = fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase)
                ? fullPath.Substring(rootPath.Length).TrimStart('\\')
                : fullPath;

            var item = new WatchEventItem
            {
                Timestamp = DateTime.Now,
                ChangeType = changeType,
                FullPath = fullPath,
                RelativePath = relative
            };

            _pendingChanges[fullPath] = item;
            FileActivityDetected?.Invoke(this, item);

            // 디바운스 타이머 리셋
            lock (_lock)
            {
                _debounceTimer?.Dispose();
                _debounceTimer = new Timer(OnDebounceTimeout, null, TimeSpan.FromSeconds(DebounceSeconds), Timeout.InfiniteTimeSpan);
            }
        }

        private void OnDebounceTimeout(object? state)
        {
            List<WatchEventItem> batch;
            lock (_lock)
            {
                if (_pendingChanges.IsEmpty) return;
                batch = new List<WatchEventItem>(_pendingChanges.Values);
                _pendingChanges.Clear();
            }

            // 동기화 트리거 발생
            SyncTriggered?.Invoke(this, batch);
        }

        /// <summary>
        /// 실시간 감시를 중지합니다.
        /// </summary>
        public void Stop()
        {
            lock (_lock)
            {
                _debounceTimer?.Dispose();
                _debounceTimer = null;
                _pendingChanges.Clear();
            }

            if (_watcher != null)
            {
                _watcher.EnableRaisingEvents = false;
                _watcher.Dispose();
                _watcher = null;
            }
        }

        public void Dispose()
        {
            Stop();
        }
    }
}
