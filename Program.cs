using System;
using System.IO;
using System.Linq;
using System.ServiceProcess;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio
{
    public static class Program
    {
        [STAThread]
        public static void Main(string[] args)
        {
            // Register process-level unhandled exception handler
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                var ex = e.ExceptionObject as Exception;
                App.LogServiceEvent($"[Process Unhandled Exception] {ex?.ToString()}");
            };

            // Detect if running as a Windows Service (SCM invocation or explicit argument)
            bool isServiceFlag = args != null && args.Any(arg =>
                arg.Equals("--service", StringComparison.OrdinalIgnoreCase) ||
                arg.Equals("/service", StringComparison.OrdinalIgnoreCase) ||
                arg.Equals("-service", StringComparison.OrdinalIgnoreCase));

            // When Windows Service Control Manager (SCM) starts a service in Session 0,
            // Environment.UserInteractive is false, or the --service parameter is passed.
            if (isServiceFlag || !Environment.UserInteractive)
            {
                try
                {
                    App.LogServiceEvent("RoboBackupStudio initiating Windows Service Control Manager handshake (ServiceBase.Run)...");
                    ServiceBase.Run(new RoboBackupWindowsService());
                    return;
                }
                catch (Exception ex)
                {
                    App.LogServiceEvent($"[Windows Service Startup Error] {ex}");
                    return;
                }
            }

            // Normal Desktop Interactive GUI Mode (WPF)
            try
            {
                var app = new App();
                app.Run();
            }
            catch (Exception ex)
            {
                App.LogServiceEvent($"[WPF Application Startup Error] {ex}");
            }
        }
    }
}
