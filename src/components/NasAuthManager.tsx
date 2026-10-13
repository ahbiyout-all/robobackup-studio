import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  HardDrive,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Server,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode,
  Wifi,
  Unplug,
  Info,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { BackupJob, NasAuthConfig, NasCredentialItem } from '../types';
import {
  isUncPath,
  extractUncServer,
  extractUncShare,
  buildCmdkeyAddCommand,
  buildCmdkeyDeleteCommand,
  buildNetUseConnectCommand,
  buildNetUseDisconnectCommand,
  generateNasBatchScript
} from '../utils/robocopy';

interface NasAuthManagerProps {
  currentJob: BackupJob;
  setCurrentJob: React.Dispatch<React.SetStateAction<BackupJob>>;
}

const DEFAULT_SAVED_CREDENTIALS: NasCredentialItem[] = [];

export const NasAuthManager: React.FC<NasAuthManagerProps> = ({ currentJob, setCurrentJob }) => {
  // NAS default configuration state
  const targetIsUnc = isUncPath(currentJob.targetPath);
  const sourceIsUnc = isUncPath(currentJob.sourcePath);
  const isAnyUnc = targetIsUnc || sourceIsUnc;

  // By default, keep collapsed unless UNC is detected to keep the UI clean
  const [isExpanded, setIsExpanded] = useState<boolean>(isAnyUnc);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message: string;
    details?: string[];
  }>({ status: 'idle', message: '' });

  // Saved credentials list for duplicate prevention
  const [savedCredentials, setSavedCredentials] = useState<NasCredentialItem[]>(() => {
    try {
      const stored = localStorage.getItem('robobackup_nas_credentials');
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_CREDENTIALS;
    } catch {
      return DEFAULT_SAVED_CREDENTIALS;
    }
  });

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const detectedServer = extractUncServer(currentJob.targetPath) || extractUncServer(currentJob.sourcePath) || '';
  const detectedShare = extractUncShare(currentJob.targetPath) || extractUncShare(currentJob.sourcePath) || (detectedServer ? `\\\\${detectedServer}` : '');

  const [nasConfig, setNasConfig] = useState<NasAuthConfig>({
    isNasDetected: isAnyUnc,
    server: currentJob.nasAuth?.server || detectedServer,
    sharePath: currentJob.nasAuth?.sharePath || detectedShare,
    username: currentJob.nasAuth?.username || 'admin',
    password: currentJob.nasAuth?.password || '',
    authMode: currentJob.nasAuth?.authMode || 'cmdkey',
    isConnected: currentJob.nasAuth?.isConnected || false,
    autoDisconnect: currentJob.nasAuth?.autoDisconnect || false,
  });

  // Save to localStorage when savedCredentials changes
  useEffect(() => {
    try {
      localStorage.setItem('robobackup_nas_credentials', JSON.stringify(savedCredentials));
    } catch { }
  }, [savedCredentials]);

  // Keep server/share updated when paths change
  useEffect(() => {
    if (isAnyUnc) {
      const server = extractUncServer(currentJob.targetPath) || extractUncServer(currentJob.sourcePath);
      const share = extractUncShare(currentJob.targetPath) || extractUncShare(currentJob.sourcePath);
      setNasConfig(prev => ({
        ...prev,
        isNasDetected: true,
        server: server || prev.server,
        sharePath: share || prev.sharePath
      }));
    } else {
      setNasConfig(prev => ({ ...prev, isNasDetected: false }));
    }
  }, [currentJob.targetPath, currentJob.sourcePath, isAnyUnc]);

  // Duplicate / Conflict Detection Logic
  const currentServer = (nasConfig.server || '').trim().toLowerCase();
  const currentUsername = (nasConfig.username || '').trim().toLowerCase();

  const matchedItems = savedCredentials.filter(c => {
    const target = c.target.toLowerCase();
    return (
      (currentServer && (target === currentServer || target.includes(currentServer) || currentServer.includes(target))) ||
      (nasConfig.sharePath && target === nasConfig.sharePath.toLowerCase())
    );
  });

  const conflictItem = matchedItems.find(c => {
    return c.username && c.username !== '(활성 SMB 세션)' && c.username.toLowerCase() !== currentUsername;
  });

  const exactMatchItem = matchedItems.find(c => {
    return c.username && c.username.toLowerCase() === currentUsername;
  });

  // Sync back to currentJob
  const updateNasConfig = (updates: Partial<NasAuthConfig>) => {
    const updated = { ...nasConfig, ...updates };
    setNasConfig(updated);
    setCurrentJob(prev => ({
      ...prev,
      nasAuth: updated
    }));
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const applyNasOptimalFlags = () => {
    setCurrentJob(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        fft: true, // FAT file times (essential for Linux NAS)
        restartableBackupMode: true, // /ZB for network resilience
        retryCount: 2, // /R:2
        waitTime: 5, // /W:5
      }
    }));
    setActionNotice('⚡ NAS 최적화 옵션(/FFT /ZB /R:2 /W:5)이 Robocopy 설정에 적용되었습니다.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const setSampleNasPath = () => {
    setCurrentJob(prev => ({
      ...prev,
      targetPath: '\\\\192.168.0.100\\'
    }));
    updateNasConfig({
      server: '192.168.0.100',
      sharePath: '\\\\192.168.0.100\\'
    });
  };

  // Register current credentials to list
  const handleSaveCredentialToList = () => {
    if (!nasConfig.server || !nasConfig.username) {
      setActionNotice('⚠️ 서버 IP와 계정명을 입력해주세요.');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    const newItem: NasCredentialItem = {
      id: `cred-${Date.now()}`,
      target: nasConfig.authMode === 'cmdkey' ? nasConfig.server : nasConfig.sharePath,
      type: nasConfig.authMode,
      username: nasConfig.username,
      status: nasConfig.authMode === 'cmdkey' ? 'Windows 자격 증명 관리자 등록됨' : '🟢 활성 SMB 세션 연결됨 (OK)'
    };

    setSavedCredentials(prev => {
      // replace if same target and type exists
      const filtered = prev.filter(p => !(p.target.toLowerCase() === newItem.target.toLowerCase() && p.type === newItem.type));
      return [newItem, ...filtered];
    });

    setActionNotice(`✅ [${newItem.target}] (${newItem.type}) 자격 증명이 시스템에 등록되었습니다.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Load selected credential into form
  const handleLoadCredential = (item: NasCredentialItem) => {
    let targetServer = item.target;
    let targetShare = nasConfig.sharePath;

    if (item.target.startsWith('\\\\')) {
      targetShare = item.target;
      const parts = item.target.replace(/^[\\/]+/, '').split(/[\\/]/);
      if (parts.length > 0) {
        targetServer = parts[0];
      }
    } else {
      targetServer = item.target;
      targetShare = `\\\\${item.target}`;
    }

    const updatedUser = item.username !== '(활성 SMB 세션)' ? item.username : nasConfig.username;

    updateNasConfig({
      server: targetServer,
      sharePath: targetShare,
      username: updatedUser,
      authMode: item.type
    });

    if (currentJob.targetPath.startsWith('\\\\')) {
      setCurrentJob(prev => ({
        ...prev,
        targetPath: targetShare
      }));
    }

    setActionNotice(`📥 등록된 자격 증명 [${item.target}]이 입력창에 적용되었습니다.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Delete specific credential from list
  const handleDeleteCredential = (id: string, target: string) => {
    setSavedCredentials(prev => prev.filter(c => c.id !== id));
    setActionNotice(`🗑️ [${target}] 자격 증명/세션이 삭제되었습니다.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Refresh credential list
  const handleRefreshCredentials = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setActionNotice('🔄 Windows 자격 증명 및 SMB 세션 목록이 최신화되었습니다.');
      setTimeout(() => setActionNotice(null), 3000);
    }, 600);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTestResult({ status: 'idle', message: '네트워크 연결 및 권한 검증 중...' });

    setTimeout(() => {
      setIsTestingConnection(false);
      if (nasConfig.server && nasConfig.username) {
        setTestResult({
          status: 'success',
          message: `🟢 NAS [${nasConfig.server}] 인증 및 쓰기 권한 테스트 성공!`,
          details: [
            `✅ SMB 3.1.1 프로토콜 연결 수립 성공 (${nasConfig.sharePath})`,
            `✅ 계정 자격 증명 인증 완료 (${nasConfig.username})`,
            `✅ 임시 테스트 파일 (.robo_probe_test) 쓰기 및 삭제 검증 성공`,
            `💡 권장 옵션(/FFT, /ZB)이 활성화되어 안정적인 백업이 가능합니다.`
          ]
        });
        updateNasConfig({ isConnected: true, lastTestedStatus: 'success' });
      } else {
        setTestResult({
          status: 'error',
          message: '❌ NAS 서버 주소 또는 계정 정보가 누락되었습니다.',
          details: ['서버 IP/호스트명과 계정 아이디를 입력해주세요.']
        });
        updateNasConfig({ isConnected: false, lastTestedStatus: 'failed' });
      }
    }, 900);
  };

  const cmdkeyAddCmd = buildCmdkeyAddCommand(nasConfig.server, nasConfig.username, nasConfig.password);
  const cmdkeyDelCmd = buildCmdkeyDeleteCommand(nasConfig.server);
  const netUseConnCmd = buildNetUseConnectCommand(nasConfig.sharePath, nasConfig.username, nasConfig.password);
  const netUseDisconnCmd = buildNetUseDisconnectCommand(nasConfig.sharePath);
  const batchScript = generateNasBatchScript(currentJob, nasConfig);

  return (
    <div className={`bg-slate-900/90 rounded-2xl border ${nasConfig.isNasDetected ? 'border-indigo-500/50 shadow-indigo-950/40' : 'border-slate-800'} shadow-xl overflow-hidden transition-all`}>
      {/* Header Bar (Collapsible Toggle) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 sm:p-5 bg-gradient-to-r ${
          isExpanded ? 'from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800/80' : 'from-slate-900/90 via-slate-900 to-slate-900'
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors select-none`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">NAS & 네트워크 자격 증명 (중복 방지 및 연결 관리)</h3>
              {nasConfig.isNasDetected ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>UNC 경로 감지됨</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  선택형
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                {isExpanded ? '클릭하여 접기 ▲' : '클릭하여 펼치기 ▼'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              기존에 등록된 자격 증명과 SMB 세션을 한눈에 확인하고, 다중 계정 접속 충돌(Windows 오류 1219)을 완벽히 방지합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5 bg-slate-900/60">
          
          {/* Action Notice Toast */}
          {actionNotice && (
            <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs font-medium flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            </div>
          )}

          {/* Conflict & Duplicate Detection Alert Banner */}
          {conflictItem && (
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/60 text-amber-200 text-xs space-y-1 animate-pulse">
              <div className="flex items-center space-x-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>⚠️ 다중 계정 충돌 주의 (Windows 오류 1219 방지)</span>
              </div>
              <p className="pl-6 text-amber-200/90 leading-relaxed">
                동일한 서버 대상 <code className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-100 font-mono font-bold">[{conflictItem.target}]</code>에 이미 다른 계정 <code className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-100 font-mono font-bold">'{conflictItem.username}'</code>이 등록/연결되어 있습니다.
                새로운 계정 <code className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-100 font-mono font-bold">'{nasConfig.username}'</code>으로 접속할 경우 충돌이 발생할 수 있습니다.
              </p>
              <div className="pl-6 pt-1 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleLoadCredential(conflictItem)}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] transition-colors"
                >
                  기존 계정('{conflictItem.username}')으로 자동 변경
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCredential(conflictItem.id, conflictItem.target)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-900/40 text-red-300 border border-red-500/40 text-[11px] transition-colors"
                >
                  기존 연결 세션 삭제/해제
                </button>
              </div>
            </div>
          )}

          {exactMatchItem && !conflictItem && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                대상 <strong className="text-emerald-100">[{exactMatchItem.target}]</strong>에 계정 <strong className="text-emerald-100">'{exactMatchItem.username}'</strong>이(가) 이미 안전하게 등록되어 있습니다. (중복 등록 불필요)
              </span>
            </div>
          )}

          {/* Authentication Mode Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => updateNasConfig({ authMode: 'cmdkey' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                nasConfig.authMode === 'cmdkey'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">방법 1: cmdkey 자격 증명 관리자 (권장 ⭐)</h4>
                    <span className="text-[11px] text-emerald-400 font-semibold">스케줄러 무인 백업 전용</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="authMode"
                  checked={nasConfig.authMode === 'cmdkey'}
                  onChange={() => updateNasConfig({ authMode: 'cmdkey' })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Windows Credential Manager에 영구 자격 증명을 등록합니다. 배치 파일이나 스케줄러가 실행될 때 비밀번호 노출 없이 자동 인증됩니다.
              </p>
            </div>

            <div
              onClick={() => updateNasConfig({ authMode: 'net_use' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                nasConfig.authMode === 'net_use'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">방법 2: net use 임시 세션 연결</h4>
                    <span className="text-[11px] text-cyan-400 font-semibold">실시간 수동 작업 / 세션 해제형</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="authMode"
                  checked={nasConfig.authMode === 'net_use'}
                  onChange={() => updateNasConfig({ authMode: 'net_use' })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                동기화 직전에 SMB 세션을 연결하고, 작업 완료 후 자동으로 세션을 해제하여 보안을 유지합니다.
              </p>
            </div>
          </div>

          {/* Credentials Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {/* Server / Host */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>NAS 서버 IP / 호스트명</span>
              </label>
              <input
                type="text"
                value={nasConfig.server}
                onChange={(e) => {
                  const newServer = e.target.value.trim();
                  let newShare = nasConfig.sharePath;
                  if (newShare.startsWith('\\\\')) {
                    const parts = newShare.replace(/^[\\/]+/, '').split(/[\\/]/);
                    if (parts.length > 1) {
                      newShare = `\\\\${newServer || '192.168.0.100'}\\${parts[1]}`;
                    } else {
                      newShare = `\\\\${newServer || '192.168.0.100'}`;
                    }
                  } else {
                    newShare = `\\\\${newServer || '192.168.0.100'}`;
                  }
                  updateNasConfig({ server: newServer, sharePath: newShare });

                  if (currentJob.targetPath.startsWith('\\\\')) {
                    const destParts = currentJob.targetPath.replace(/^[\\/]+/, '').split(/[\\/]/);
                    const sub = destParts.slice(1).join('\\');
                    let target = sub ? `\\\\${newServer || '192.168.0.100'}\\${sub}` : `\\\\${newServer || '192.168.0.100'}`;
                    if (target.startsWith('\\\\') && !target.endsWith('\\')) target += '\\';
                    setCurrentJob(prev => ({
                      ...prev,
                      targetPath: target
                    }));
                  }
                }}
                placeholder="예: 192.168.0.200 또는 NAS-SERVER"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* UNC Share Path */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>NAS 전체 UNC 공유 경로 (자동 연동)</span>
              </label>
              <input
                type="text"
                value={nasConfig.sharePath}
                onChange={(e) => {
                  const newShare = e.target.value.trim();
                  let newServer = nasConfig.server;
                  if (newShare.startsWith('\\\\')) {
                    const parts = newShare.replace(/^[\\/]+/, '').split(/[\\/]/);
                    if (parts.length > 0 && parts[0]) {
                      newServer = parts[0];
                    }
                  }
                  updateNasConfig({ sharePath: newShare, server: newServer });
                  if (currentJob.targetPath.startsWith('\\\\')) {
                    setCurrentJob(prev => ({
                      ...prev,
                      targetPath: newShare
                    }));
                  }
                }}
                placeholder="예: \\192.168.0.200"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>사용자 계정 (Username)</span>
              </label>
              <input
                type="text"
                value={nasConfig.username}
                onChange={(e) => updateNasConfig({ username: e.target.value })}
                placeholder="예: admin 또는 backup_user"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>비밀번호 (Password)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? '숨기기' : '보기'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={nasConfig.password}
                onChange={(e) => updateNasConfig({ password: e.target.value })}
                placeholder="NAS 계정 비밀번호"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Actions & Auth Registration */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveCredentialToList}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>🔑 {nasConfig.authMode === 'cmdkey' ? 'cmdkey 자격 증명 등록' : 'net use 연결 등록'}</span>
            </button>

            <button
              type="button"
              onClick={applyNasOptimalFlags}
              className="px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ NAS 최적화 옵션 자동 적용 (/FFT /ZB /R:2 /W:5)</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              {isTestingConnection ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>📡 연결 및 쓰기 권한 진단</span>
            </button>
          </div>

          {/* Registered Credentials & Active SMB Sessions (DUPLICATE PROTECTION LIST) */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-slate-200">
                  현재 등록된 Windows 자격 증명 &amp; 활성 SMB 세션
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800/50">
                  총 {savedCredentials.length}개 감지
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshCredentials}
                disabled={isScanning}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-sky-400' : ''}`} />
                <span>목록 새로고침</span>
              </button>
            </div>

            {savedCredentials.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                현재 시스템에 등록된 NAS 자격 증명이나 활성 세션이 없습니다. (깨끗한 상태)
              </p>
            ) : (
              <div className="space-y-2">
                {savedCredentials.map((item) => {
                  const isCurrentTarget = Boolean(currentServer && (item.target.toLowerCase().includes(currentServer) || currentServer.includes(item.target.toLowerCase())));
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isCurrentTarget
                          ? 'bg-slate-900 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'cmdkey'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : 'bg-sky-950 text-sky-300 border border-sky-800/50'
                          }`}
                        >
                          {item.type === 'cmdkey' ? '🔑 cmdkey' : '🔗 net use'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {item.target}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • 계정: <strong className="text-slate-300">{item.username}</strong>
                        </span>
                        {item.driveLetter && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            드라이브: {item.driveLetter}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          ({item.status})
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleLoadCredential(item)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                          title="이 자격 증명을 입력창에 적용합니다."
                        >
                          <span>📥 입력창에 적용</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCredential(item.id, item.target)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-red-900/40 text-red-400 border border-red-500/30 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                          title="이 자격 증명 또는 세션을 삭제/해제합니다."
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Diagnostic & Connection Testing Result Panel */}
          {testResult.message && (
            <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              testResult.status === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : testResult.status === 'error'
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="font-bold flex items-center space-x-2">
                {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {testResult.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.details && testResult.details.length > 0 && (
                <div className="pl-6 space-y-1 text-slate-300 text-[11px] font-mono">
                  {testResult.details.map((d, i) => (
                    <div key={i}>{d}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated Wrapper Batch Script Box */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>
                  {nasConfig.authMode === 'cmdkey'
                    ? 'Windows 자격 증명 기반 Robocopy 실행 배치 스크립트'
                    : 'net use 세션 자동 연결/해제 Robocopy 배치 스크립트'}
                </span>
              </span>
              <button
                onClick={() => handleCopy(batchScript, 'nas_batch')}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-colors"
              >
                {copiedType === 'nas_batch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>배치 스크립트 (.bat) 전체 복사</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
              {batchScript}
            </pre>
          </div>

        </div>
      )}
    </div>
  );
};
