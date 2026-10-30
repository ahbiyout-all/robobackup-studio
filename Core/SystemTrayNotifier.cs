using System;
using System.Drawing;
using System.IO;
using System.Windows;
using System.Windows.Forms;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL / System Tray] SystemTrayNotifier
    /// 시스템 트레이 백그라운드 구동 및 실시간/예약 백업 알림(Balloon Tooltip / Toast) 관리 엔진 (v2.17.0)
    /// </summary>
    public class SystemTrayNotifier : IDisposable
    {
        private NotifyIcon? _notifyIcon;
        private readonly Action? _onOpenWindow;
        private readonly Action? _onStartBackupNow;
        private readonly Action? _onExitApplication;

        public bool IsTrayEnabled { get; set; } = true;
        public bool ShowStartNotifications { get; set; } = true;
        public bool ShowCompletionNotifications { get; set; } = true;

        public SystemTrayNotifier(Action onOpenWindow, Action onStartBackupNow, Action onExitApplication)
        {
            _onOpenWindow = onOpenWindow;
            _onStartBackupNow = onStartBackupNow;
            _onExitApplication = onExitApplication;

            InitializeNotifyIcon();
        }

        private void InitializeNotifyIcon()
        {
            try
            {
                _notifyIcon = new NotifyIcon();
                _notifyIcon.Text = "RoboBackup Studio (v2.17.0) - 고성능 백업 스튜디오";

                // Load Icon from local executable directory
                try
                {
                    string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "robocopy.ico");
                    if (File.Exists(iconPath))
                    {
                        _notifyIcon.Icon = new Icon(iconPath);
                    }
                    else
                    {
                        _notifyIcon.Icon = SystemIcons.Application;
                    }
                }
                catch
                {
                    _notifyIcon.Icon = SystemIcons.Application;
                }

                var contextMenu = new ContextMenuStrip();
                
                var titleItem = new ToolStripMenuItem("RoboBackup Studio (v2.17.0)")
                {
                    Enabled = false
                };
                contextMenu.Items.Add(titleItem);
                contextMenu.Items.Add(new ToolStripSeparator());

                var openItem = new ToolStripMenuItem("💻 RoboBackup Studio 열기", null, (s, e) => _onOpenWindow?.Invoke());
                openItem.Font = new Font(openItem.Font, System.Drawing.FontStyle.Bold);
                contextMenu.Items.Add(openItem);

                contextMenu.Items.Add(new ToolStripMenuItem("⚡ 즉시 백업 실행", null, (s, e) => _onStartBackupNow?.Invoke()));
                contextMenu.Items.Add(new ToolStripSeparator());
                contextMenu.Items.Add(new ToolStripMenuItem("❌ 완전히 종료", null, (s, e) => _onExitApplication?.Invoke()));

                _notifyIcon.ContextMenuStrip = contextMenu;
                _notifyIcon.DoubleClick += (s, e) => _onOpenWindow?.Invoke();
                _notifyIcon.Visible = true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SystemTrayNotifier Init Error] {ex.Message}");
            }
        }

        public void ShowNotification(string title, string message, ToolTipIcon icon = ToolTipIcon.Info, int timeoutMs = 3500)
        {
            try
            {
                if (_notifyIcon != null && IsTrayEnabled)
                {
                    _notifyIcon.ShowBalloonTip(timeoutMs, title, message, icon);
                }
            }
            catch { }
        }

        public void NotifyBackupStarted(string source, string destination, bool isScheduled = false)
        {
            if (!ShowStartNotifications) return;
            string prefix = isScheduled ? "⏰ [예약 백업 시작]" : "⚡ [백업 작업 시작]";
            string shortSource = GetShortPath(source);
            string shortDest = GetShortPath(destination);
            ShowNotification(
                $"{prefix} RoboBackup Studio",
                $"백업 작업이 시작되었습니다.\n원본: {shortSource}\n대상: {shortDest}",
                ToolTipIcon.Info,
                3500
            );
        }

        public void NotifyBackupCompleted(string source, string destination, int exitCode, int copiedFiles, TimeSpan elapsed, bool isScheduled = false)
        {
            if (!ShowCompletionNotifications) return;
            bool isSuccess = exitCode <= 7;
            string prefix = isScheduled 
                ? (isSuccess ? "⏰ [예약 백업 완료]" : "❌ [예약 백업 오류]")
                : (isSuccess ? "✅ [백업 완료]" : "❌ [백업 실패]");

            ToolTipIcon icon = isSuccess ? ToolTipIcon.Info : ToolTipIcon.Error;
            string shortSource = GetShortPath(source);
            string shortDest = GetShortPath(destination);
            string timeStr = $"{elapsed.Minutes}분 {elapsed.Seconds}초";

            string message = isSuccess
                ? $"백업이 성공적으로 완료되었습니다 ({timeStr}).\n복사 완료: {copiedFiles:N0}개 파일\n경로: {shortSource} ➔ {shortDest}"
                : $"백업 처리 중 오류가 발생하였습니다 (ExitCode: {exitCode}).\n로그에서 세부 내용을 확인하세요.";

            ShowNotification($"{prefix} RoboBackup Studio", message, icon, 4500);
        }

        public void NotifyMinimizedToTray()
        {
            ShowNotification(
                "🛡️ RoboBackup Studio 백그라운드 구동 중",
                "프로그램이 시스템 트레이로 이동하였습니다. 작업 스케줄 및 실시간 동기화가 백그라운드에서 계속 실행됩니다.",
                ToolTipIcon.Info,
                2500
            );
        }

        private string GetShortPath(string path, int maxLength = 35)
        {
            if (string.IsNullOrWhiteSpace(path)) return string.Empty;
            if (path.Length <= maxLength) return path;
            return path.Substring(0, 15) + "..." + path.Substring(path.Length - 15);
        }

        public void Dispose()
        {
            if (_notifyIcon != null)
            {
                _notifyIcon.Visible = false;
                _notifyIcon.Dispose();
                _notifyIcon = null;
            }
        }
    }
}
