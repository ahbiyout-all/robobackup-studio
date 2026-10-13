using System;
using System.IO;
using System.Windows;
using System.Windows.Threading;

namespace RoboBackupStudio
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // Register UI Thread exception handling
            DispatcherUnhandledException += (s, args) =>
            {
                LogServiceEvent($"[Dispatcher Unhandled Exception] {args.Exception}");
                MessageBox.Show($"[UI 스레드 오류] 예외가 발생했습니다:\n{args.Exception.Message}", "RoboBackup Studio UI 오류", MessageBoxButton.OK, MessageBoxImage.Error);
                args.Handled = true;
            };

            // Normal GUI Mode: construct and display MainWindow
            try
            {
                ShutdownMode = ShutdownMode.OnMainWindowClose;
                var mainWindow = new MainWindow();
                MainWindow = mainWindow;
                mainWindow.Show();
                mainWindow.Activate();
                mainWindow.Focus();
            }
            catch (Exception ex)
            {
                string innerMsg = ex.InnerException != null ? $"\n\n[세부 내부 원인]\n{ex.InnerException.Message}" : "";
                LogServiceEvent($"[MainWindow Show Error] {ex}");
                MessageBox.Show($"[화면 표시 오류] 메인 윈도우를 로드할 수 없습니다:\n{ex.Message}{innerMsg}\n\n{ex.StackTrace}", "RoboBackup Studio 시작 실패", MessageBoxButton.OK, MessageBoxImage.Error);
                Shutdown(1);
            }
        }

        public static void LogServiceEvent(string message)
        {
            try
            {
                string logDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RoboBackupStudio");
                Directory.CreateDirectory(logDir);
                string logPath = Path.Combine(logDir, "service.log");
                File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}");
            }
            catch { }
        }
    }
}
