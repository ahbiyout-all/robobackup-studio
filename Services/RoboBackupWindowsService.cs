using System;
using System.Diagnostics;
using System.IO;
using System.ServiceProcess;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio
{
    public class RoboBackupWindowsService : ServiceBase
    {
        private CancellationTokenSource? _cts;
        private Task? _workerTask;

        public RoboBackupWindowsService()
        {
            ServiceName = "RoboBackupService";
            CanStop = true;
            CanShutdown = true;
            CanPauseAndContinue = false;
            AutoLog = true;
        }

        protected override void OnStart(string[] args)
        {
            App.LogServiceEvent("=== [RoboBackupService] Windows Service Started Successfully (SCM Handshake OK) ===");
            _cts = new CancellationTokenSource();
            _workerTask = Task.Run(() => WorkerLoopAsync(_cts.Token));
        }

        protected override void OnStop()
        {
            App.LogServiceEvent("=== [RoboBackupService] Windows Service Stopping... ===");
            try
            {
                _cts?.Cancel();
                _workerTask?.Wait(TimeSpan.FromSeconds(5));
            }
            catch (Exception ex)
            {
                App.LogServiceEvent($"[RoboBackupService Stop Exception] {ex.Message}");
            }
            finally
            {
                App.LogServiceEvent("=== [RoboBackupService] Windows Service Stopped ===");
            }
        }

        protected override void OnShutdown()
        {
            App.LogServiceEvent("=== [RoboBackupService] System Shutdown Detected. Terminating Service Cleanly ===");
            OnStop();
        }

        private async Task WorkerLoopAsync(CancellationToken token)
        {
            App.LogServiceEvent("[RoboBackupService] Background Worker Engine Active (Monitoring Schedules, Tasks & NAS Connectivity).");

            while (!token.IsCancellationRequested)
            {
                try
                {
                    // Log periodic heartbeat
                    App.LogServiceEvent($"[RoboBackupService Heartbeat] Service running normally at {DateTime.Now:yyyy-MM-dd HH:mm:ss}");

                    // Check and execute queued backup tasks or scheduled triggers
                    CheckAndExecuteQueuedTasks();
                }
                catch (Exception ex)
                {
                    App.LogServiceEvent($"[RoboBackupService Worker Loop Error] {ex.Message}");
                }

                try
                {
                    // Sleep for 60 seconds (cancelable)
                    await Task.Delay(TimeSpan.FromMinutes(1), token);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private void CheckAndExecuteQueuedTasks()
        {
            try
            {
                string baseDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "RoboBackupStudio");
                string queueDir = Path.Combine(baseDir, "Queue");
                if (Directory.Exists(queueDir))
                {
                    var scriptFiles = Directory.GetFiles(queueDir, "*.bat");
                    foreach (var file in scriptFiles)
                    {
                        try
                        {
                            App.LogServiceEvent($"[RoboBackupService] Executing queued backup batch with VSS Auto Pre-flight support: {Path.GetFileName(file)}");
                            var psi = new ProcessStartInfo("cmd.exe", $"/c \"{file}\"")
                            {
                                CreateNoWindow = true,
                                UseShellExecute = false
                            };
                            using var proc = Process.Start(psi);
                            proc?.WaitForExit(600000); // 10 min timeout
                            
                            App.LogServiceEvent($"[RoboBackupService] Completed backup task: {Path.GetFileName(file)} (ExitCode: {proc?.ExitCode ?? 0})");

                            // Delete task after execution
                            try { File.Delete(file); } catch { }
                        }
                        catch (Exception ex)
                        {
                            App.LogServiceEvent($"[RoboBackupService Task Error] Failed to execute {file}: {ex.Message}");
                        }
                    }
                }
            }
            catch { }
        }
    }
}
