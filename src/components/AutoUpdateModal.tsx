import React, { useState, useEffect } from 'react';
import { Download, Sparkles, ExternalLink, RefreshCw, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface GitHubReleaseInfo {
  tag_name: string;
  name: string;
  html_url: string;
  body: string;
  published_at: string;
}

export const AutoUpdateModal: React.FC = () => {
  const currentVersion = 'v2.16.0';
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [latestRelease, setLatestRelease] = useState<GitHubReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const githubRepoUrl = 'https://github.com/AhBiYout-all/robobackup-studio';
  const githubReleasesUrl = `${githubRepoUrl}/releases`;

  // Check for updates on mount (with silent check)
  useEffect(() => {
    checkForUpdates(true);
  }, []);

  const checkForUpdates = async (isSilent = false) => {
    setChecking(true);
    setErrorMessage(null);
    try {
      // In production / preview environment, fetch latest release from GitHub API
      const res = await fetch(`https://api.github.com/repos/AhBiYout-all/robobackup-studio/releases/latest`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        throw new Error(`GitHub API 응답 오류 (${res.status})`);
      }

      const data: GitHubReleaseInfo = await res.json();
      setLatestRelease(data);

      // Compare versions (simple string or semver comparison)
      const latestTag = data.tag_name; // e.g. "v2.13.1" or "2.13.1"
      const cleanLatest = latestTag.startsWith('v') ? latestTag : `v${latestTag}`;
      const cleanCurrent = currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`;

      if (cleanLatest !== cleanCurrent) {
        setHasUpdate(true);
        if (!isSilent) {
          setIsOpen(true);
        }
      } else {
        setHasUpdate(false);
        if (!isSilent) {
          alert(`현재 최신 버전(${currentVersion})을 사용 중입니다. (업데이트가 없습니다)`);
        }
      }
    } catch (err: any) {
      // Fallback for offline / simulation mode if GitHub API rate limit or network error occurs
      console.warn('GitHub update check note:', err?.message);
      // Simulate up-to-date or offer manual check
      if (!isSilent) {
        setIsOpen(true);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {/* Update Badge Button in Navbar or Footer */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
        title="GitHub Releases 기반 실시간 자동 업데이트 확인"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span>업데이트 확인</span>
        {hasUpdate && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        )}
      </button>

      {/* Auto Update Notification Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-slate-100">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">GitHub 기반 실시간 자동 업데이트</h3>
                <p className="text-xs text-slate-400">AhBiYout-all / robobackup-studio 공식 릴리즈 관리 시스템</p>
              </div>
            </div>

            {/* Version Status Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">현재 설치된 버전:</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{currentVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">최신 릴리즈 버전:</span>
                <span className="text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  {latestRelease ? latestRelease.tag_name : 'v2.16.0 (최신 상태)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">개발자 / 저장소:</span>
                <span className="text-indigo-300">AhBiYout / AhBiYout-all</span>
              </div>
            </div>

            {/* Release Notes / Description if available */}
            {latestRelease?.body && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">📝 릴리즈 변경 노트:</span>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                  {latestRelease.body}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => checkForUpdates(false)}
                disabled={checking}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? '확인 중...' : '업데이트 다시 확인'}</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  닫기
                </button>
                <a
                  href={latestRelease?.html_url || githubReleasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub 릴리즈 다운로드 페이지</span>
                </a>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-3">
              공식 블로그: <a href="https://ahbivibelog.blogspot.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ahbivibelog.blogspot.com</a> | 소속: CISNET (<a href="https://www.cisnet.co.kr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">cisnet.co.kr</a>)
            </div>

          </div>
        </div>
      )}
    </>
  );
};
