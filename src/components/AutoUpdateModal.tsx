import React, { useState, useEffect } from 'react';
import { Download, Sparkles, ExternalLink, RefreshCw, CheckCircle2, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubReleaseInfo {
  tag_name: string;
  name: string;
  html_url: string;
  body: string;
  published_at: string;
  assets?: GitHubAsset[];
}

export const AutoUpdateModal: React.FC = () => {
  const currentVersion = 'v2.17.1';
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [latestRelease, setLatestRelease] = useState<GitHubReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installerUrl, setInstallerUrl] = useState<string | null>(null);

  const githubRepoUrl = 'https://github.com/AhBiYout-all/robobackup-studio';
  const githubReleasesUrl = `${githubRepoUrl}/releases`;

  // Compare semantic versions: returns > 0 if v1 > v2, 0 if equal, < 0 if v1 < v2
  const compareVersions = (v1: string, v2: string): number => {
    const parse = (v: string) => v.replace(/^v/i, '').split('.').map((p) => parseInt(p, 10) || 0);
    const p1 = parse(v1);
    const p2 = parse(v2);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  };

  // Check for updates on mount (with automatic alert popup when a newer release is detected)
  useEffect(() => {
    checkForUpdates(true);
  }, []);

  const checkForUpdates = async (isSilent = false) => {
    setChecking(true);
    try {
      const res = await fetch(`https://api.github.com/repos/AhBiYout-all/robobackup-studio/releases/latest`, {
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        throw new Error(`GitHub API HTTP ${res.status}`);
      }

      const data: GitHubReleaseInfo = await res.json();
      setLatestRelease(data);

      // Detect installer executable asset
      if (data.assets && data.assets.length > 0) {
        const setupAsset = data.assets.find(
          (a) => a.name.toLowerCase().endsWith('.exe') && (a.name.toLowerCase().includes('setup') || a.name.toLowerCase().includes('robobackup'))
        );
        if (setupAsset) {
          setInstallerUrl(setupAsset.browser_download_url);
        } else {
          const firstExe = data.assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
          if (firstExe) setInstallerUrl(firstExe.browser_download_url);
        }
      }

      const latestTag = data.tag_name || '';
      const cleanLatest = latestTag.startsWith('v') ? latestTag : `v${latestTag}`;
      const cleanCurrent = currentVersion.startsWith('v') ? currentVersion : `v${currentVersion}`;

      const isNewer = compareVersions(cleanLatest, cleanCurrent) > 0;

      if (isNewer) {
        setHasUpdate(true);
        // Automatically launch update notification popup when update is detected!
        setIsOpen(true);
      } else {
        setHasUpdate(false);
        if (!isSilent) {
          alert(`현재 최신 버전(${currentVersion})을 사용 중입니다. (새로운 업데이트가 없습니다)`);
        }
      }
    } catch (err: any) {
      console.warn('GitHub update check note:', err?.message);
      if (!isSilent) {
        setIsOpen(true);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {/* Update Badge Button in Navbar or Header */}
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

      {/* Auto Update Notification Modal (Automatic Popup when update exists) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-slate-100">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3.5">
              <div className={`p-3 rounded-xl ${hasUpdate ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">GitHub 실시간 자동 업데이트 알림</h3>
                  {hasUpdate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      신규 버전 감지
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">AhBiYout-all / robobackup-studio 공식 릴리즈 센터</p>
              </div>
            </div>

            {/* Update Notification Banner */}
            {hasUpdate && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">새로운 최신 버전이 감지되었습니다!</span>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    안정성 향상과 최신 기능이 포함된 신규 버전이 출시되었습니다. 아래 버튼을 눌러 즉시 설치 관리자를 다운로드하세요.
                  </p>
                </div>
              </div>
            )}

            {/* Version & Repository Info Grid */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-slate-400 font-sans">현재 실행 중인 버전:</span>
                <span className="text-slate-300 font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{currentVersion}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-slate-400 font-sans">GitHub 최신 릴리스 버전:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded border ${hasUpdate ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                  {latestRelease ? (latestRelease.tag_name || latestRelease.name) : `${currentVersion} (최신 상태)`}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-sans">공식 GitHub 저장소:</span>
                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-sans font-medium"
                >
                  <span>github.com/AhBiYout-all/robobackup-studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Release Notes if available */}
            {latestRelease?.body && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">📝 릴리즈 변경 노트:</span>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                  {latestRelease.body}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              {installerUrl && hasUpdate && (
                <a
                  href={installerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>원클릭 최신 설치 관리자 다운로드 (Setup.exe)</span>
                </a>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => checkForUpdates(false)}
                  disabled={checking}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  <span>{checking ? '확인 중...' : '업데이트 다시 확인'}</span>
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    닫기
                  </button>
                  <a
                    href={latestRelease?.html_url || githubReleasesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>GitHub 릴리즈 페이지</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-3">
              개발자: AhBiYout | 공식 블로그: <a href="https://ahbiyoutvibe.blogspot.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ahbiyoutvibe.blogspot.com</a> | GitHub: <a href="https://github.com/AhBiYout-all/robobackup-studio" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">robobackup-studio</a>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
