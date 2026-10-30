import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JobDesigner } from './components/JobDesigner';
import { LiveRunner } from './components/LiveRunner';
import { TaskScheduler } from './components/TaskScheduler';
import { AutoCleanup } from './components/AutoCleanup';
import { CoreDllStudio } from './components/CoreDllStudio';
import { HelpAndLicense } from './components/HelpAndLicense';
import { EasyBackupWizardModal } from './components/EasyBackupWizardModal';
import { BackupJob } from './types';
import { DEFAULT_FLAGS } from './utils/robocopy';
import { THEMES, ThemeId } from './themes';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('designer');
  const [isEasyWizardOpen, setIsEasyWizardOpen] = useState<boolean>(false);

  // Multi-Theme State (13 Themes: 9 Dark + 4 Light)
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('robobackup_theme') as ThemeId;
      if (saved && THEMES[saved]) return saved;
    } catch {
      // localStorage not accessible
    }
    return 'grey';
  });

  const theme = THEMES[currentThemeId] || THEMES.grey;

  const handleThemeChange = (newThemeId: ThemeId) => {
    setCurrentThemeId(newThemeId);
    try {
      localStorage.setItem('robobackup_theme', newThemeId);
    } catch {
      // ignore
    }
  };

  // Sync data-theme and dark/light classes on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentThemeId);
    if (theme.isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [currentThemeId, theme.isLight]);

  // Main Active Backup Job State
  const [currentJob, setCurrentJob] = useState<BackupJob>({
    id: 'job-1',
    name: '중요 문서 고속 미러 백업',
    description: '16스레드 다중 처리와 FAT 시간 오차 허용으로 초고속 자동 백업',
    sourcePath: 'C:\\Users\\Public\\Documents',
    targetPath: 'D:\\Backup_Storage\\Public_Documents',
    flags: { ...DEFAULT_FLAGS },
    schedule: {
      enabled: true,
      frequency: 'daily',
      intervalMinutes: 60,
      dailyTime: '03:00',
      weeklyDays: ['Mon', 'Wed', 'Fri'],
      runWithHighestPrivileges: true,
    },
    status: 'idle',
    totalFiles: 0,
    copiedFiles: 0,
    totalDirs: 0,
    copiedDirs: 0,
    totalBytes: 0,
    copiedBytes: 0,
    currentSpeedMbps: 0,
    progressPercent: 0,
    logEntries: [],
  });

  const handleStartJobFromDesigner = () => {
    setActiveTab('runner');
  };

  const handleSaveJob = () => {
    alert('백업 프로필 설정이 저장되었습니다!');
  };

  return (
    <div 
      data-theme={currentThemeId} 
      className={`min-h-screen ${theme.bgTo} ${theme.text} transition-colors duration-300`}
    >

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentThemeId={currentThemeId}
        onThemeChange={handleThemeChange}
        onOpenEasyWizard={() => setIsEasyWizardOpen(true)}
      />

      {/* Main Content Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        {activeTab === 'designer' && (
          <JobDesigner
            currentJob={currentJob}
            setCurrentJob={setCurrentJob}
            onStartJob={handleStartJobFromDesigner}
            onSaveJob={handleSaveJob}
            onOpenEasyWizard={() => setIsEasyWizardOpen(true)}
          />
        )}

        {activeTab === 'runner' && (
          <LiveRunner
            currentJob={currentJob}
            setCurrentJob={setCurrentJob}
          />
        )}

        {activeTab === 'scheduler' && (
          <TaskScheduler
            currentJob={currentJob}
            setCurrentJob={setCurrentJob}
          />
        )}

        {activeTab === 'cleanup' && <AutoCleanup currentJob={currentJob} />}

        {activeTab === 'core_dlls' && (
          <CoreDllStudio 
            currentJob={currentJob} 
            setCurrentJob={setCurrentJob} 
          />
        )}

        {activeTab === 'help_license' && <HelpAndLicense />}
      </main>

      {/* Easy Backup Wizard Modal Overlay */}
      <EasyBackupWizardModal
        isOpen={isEasyWizardOpen}
        onClose={() => setIsEasyWizardOpen(false)}
        currentJob={currentJob}
        setCurrentJob={setCurrentJob}
        onStartJob={handleStartJobFromDesigner}
        onOpenScheduler={() => setActiveTab('scheduler')}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-xs text-slate-400 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-300">RoboBackup Studio &copy; {new Date().getFullYear()}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400">개발자: <strong className="text-slate-300 font-medium">AhBiYout</strong></span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <a 
              href="http://www.cisnet.co.kr/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 hover:underline"
            >
              <span>회사홈페이지 (CISNET)</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <a 
              href="https://ahbiyoutvibe.blogspot.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 hover:underline"
            >
              <span>공식블로그</span>
            </a>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 font-semibold">v2.17.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

