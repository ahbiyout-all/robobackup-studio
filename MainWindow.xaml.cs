using System;
using System.ComponentModel;
using System.Windows;
using RoboBackupStudio.Core;
using RoboBackupStudio.ViewModels;

namespace RoboBackupStudio
{
    public partial class MainWindow : Window
    {
        private bool _isExitingFromTray = false;

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
            StateChanged += MainWindow_StateChanged;
            Closing += MainWindow_Closing;
        }

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            if (DataContext is MainViewModel vm)
            {
                vm.RequestScrollToBottom += () =>
                {
                    Dispatcher.InvokeAsync(() =>
                    {
                        if (RobocopyLogListBox != null && RobocopyLogListBox.Items.Count > 0)
                        {
                            RobocopyLogListBox.ScrollIntoView(RobocopyLogListBox.Items[RobocopyLogListBox.Items.Count - 1]);
                        }
                    });
                };

                // Initialize System Tray Notifier
                vm.InitializeTrayNotifier(
                    onOpenWindow: RestoreFromTray,
                    onExitApp: ExitApplicationFromTray
                );
            }
        }

        private void MainWindow_StateChanged(object? sender, EventArgs e)
        {
            if (WindowState == WindowState.Minimized && DataContext is MainViewModel vm && vm.IsMinimizeToTrayEnabled)
            {
                HideToTray(vm);
            }
        }

        private void MainWindow_Closing(object? sender, CancelEventArgs e)
        {
            if (!_isExitingFromTray && DataContext is MainViewModel vm && vm.IsMinimizeToTrayEnabled)
            {
                e.Cancel = true;
                HideToTray(vm);
            }
            else
            {
                if (DataContext is MainViewModel mainVm)
                {
                    mainVm.TrayNotifier?.Dispose();
                }
            }
        }

        private void HideToTray(MainViewModel vm)
        {
            Hide();
            vm.TrayNotifier?.NotifyMinimizedToTray();
        }

        public void RestoreFromTray()
        {
            Show();
            WindowState = WindowState.Normal;
            Activate();
            Focus();
        }

        public void ExitApplicationFromTray()
        {
            _isExitingFromTray = true;
            if (DataContext is MainViewModel vm)
            {
                vm.TrayNotifier?.Dispose();
            }
            Application.Current.Shutdown();
        }

        private void DestinationTextBox_LostFocus(object sender, RoutedEventArgs e)
        {
            if (DataContext is MainViewModel vm)
            {
                vm.NormalizeDestinationPath();
            }
        }
    }
}
