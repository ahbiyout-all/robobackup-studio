using System.Windows;
using RoboBackupStudio.ViewModels;

namespace RoboBackupStudio
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
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
            }
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
