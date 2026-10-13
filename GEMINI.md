# RoboBackup Studio - Gemini System Instructions (GEMINI.md)

## 📌 핵심 프로젝트 원칙

1. **자동 버전 관리 및 패치노트 기록 의무**:
   - 코드 수정 시 기능 추가, 구조 변경, 옵션 확장 등 특이점이 발생하면 반드시 `docs/PATCH_NOTES.md`에 새 버전과 변경 내역을 자동으로 기록하고, `.csproj`, `build.bat`, `MainWindow.xaml`, `MainViewModel.cs`의 버전 정보를 일괄 동기화합니다.

2. **🚨 데스크탑 앱(C# WPF MVVM) 우선 및 100% 완전 구현 의무**:
   - 프리뷰 웹 UI뿐 아니라 **실제 Windows 데스크탑 앱 파일(`MainWindow.xaml`, `ViewModels/MainViewModel.cs`, `Core/`, `Services/`, `App.xaml` 등)에 모든 신규 기능과 비즈니스 로직, XAML 바인딩을 빠짐없이 동시에 구현**합니다.
   - 데스크탑 앱에 반영되지 않고 웹 화면에만 머무는 모의(Mock) 코드는 절대 허용되지 않으며, `build.bat` 빌드가 언제나 100% 에러 없이 정상 작동하도록 무결성을 유지합니다.
