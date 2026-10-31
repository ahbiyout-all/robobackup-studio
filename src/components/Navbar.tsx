import React from 'react';
import { 
  FolderSync, 
  Terminal, 
  Calendar, 
  Trash2, 
  Scale, 
  Palette,
  Layers,
  Sparkles
} from 'lucide-react';
import { ThemeId, THEMES, THEME_LIST } from '../themes';
import appLogo from '../assets/robocopy.png';
import { AutoUpdateModal } from './AutoUpdateModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentThemeId: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  onOpenEasyWizard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentThemeId,
  onThemeChange,
  onOpenEasyWizard,
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES.grey;

  const navItems = [
    { id: 'designer', label: '백업 작업 설정', icon: FolderSync },
    { id: 'runner', label: '실시간 실행 & 로그', icon: Terminal },
    { id: 'scheduler', label: '예약 백업 관리', icon: Calendar },
    { id: 'cleanup', label: '오래된 파일 자동정리', icon: Trash2 },
    { id: 'core_dlls', label: '코어 DLL 스튜디오', icon: Layers },
    { id: 'help_license', label: '도움말 & 라이선스', icon: Scale },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 dark:bg-slate-950/90 border-b border-slate-800 text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('designer')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 bg-slate-900 border border-slate-700/80 flex items-center justify-center p-0.5 shrink-0">
              <img 
                src={appLogo} 
                alt="RoboBackup Studio" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">RoboBackup</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">Studio</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 font-mono">v2.17.3</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">초고속 파일 백업 &amp; 동기화 관리 시스템</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Easy Wizard + 4-Theme Button Group */}
          <div className="flex items-center space-x-2">
            {onOpenEasyWizard && (
              <button
                type="button"
                onClick={onOpenEasyWizard}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold border border-indigo-400/40 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="초보자 안심 백업 마법사 열기"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>초보자 마법사</span>
              </button>
            )}

            {/* Auto Update Modal Trigger */}
            <AutoUpdateModal />

            <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
            <div className="hidden lg:flex items-center pl-1.5 pr-2 text-[11px] font-semibold text-slate-400">
              <Palette className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>테마</span>
            </div>
            <div className="flex items-center space-x-1">
              {THEME_LIST.map((t) => {
                const isSelected = t.id === currentThemeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? t.id === 'white'
                          ? 'bg-blue-600 text-white shadow-md'
                          : t.id === 'beige'
                            ? 'bg-amber-600 text-white shadow-md'
                            : t.id === 'dark'
                              ? 'bg-zinc-800 text-white border border-zinc-600 shadow-md'
                              : 'bg-slate-700 text-white border border-slate-600 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={`${t.name} 테마 적용`}
                  >
                    <span className="text-[11px]">{t.icon}</span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto py-2 border-t border-slate-800 space-x-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

