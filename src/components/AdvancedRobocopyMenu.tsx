import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Filter, 
  RefreshCw, 
  HardDrive, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Check, 
  Copy, 
  Clock, 
  Info, 
  Sparkles,
  Search,
  Layers,
  FileCode,
  Gauge
} from 'lucide-react';
import { RobocopyFlags } from '../types';

interface AdvancedRobocopyMenuProps {
  flags: RobocopyFlags;
  onUpdateFlag: <K extends keyof RobocopyFlags>(key: K, value: RobocopyFlags[K]) => void;
  onApplyPresetFlags?: (partialFlags: Partial<RobocopyFlags>) => void;
}

type AdvancedCategory = 'all' | 'security' | 'performance' | 'filter' | 'realtime' | 'nas' | 'logging';

export const AdvancedRobocopyMenu: React.FC<AdvancedRobocopyMenuProps> = ({
  flags,
  onUpdateFlag,
  onApplyPresetFlags,
}) => {
  const [activeCategory, setActiveCategory] = useState<AdvancedCategory>('all');
  const [selectedQuickPreset, setSelectedQuickPreset] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(true);
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFlag(text);
    setTimeout(() => setCopiedFlag(null), 1500);
  };

  // Quick Presets
  const applyQuickPreset = (presetType: 'server_migration' | 'nvme_speed' | 'nas_safe' | 'bandwidth_throttle' | 'night_window') => {
    setSelectedQuickPreset(presetType);
    if (!onApplyPresetFlags) return;

    switch (presetType) {
      case 'server_migration':
        onApplyPresetFlags({
          mirror: true,
          copyAll: true,
          copySec: false,
          restartableBackupMode: true,
          threads: 16,
          excludeJunctions: true,
          fft: true,
          includeTimestamps: true,
          fullPathNames: true,
          noProgress: true,
        });
        break;
      case 'nvme_speed':
        onApplyPresetFlags({
          threads: 32,
          noProgress: true,
          noDirectoryList: false,
          restartableBackupMode: false,
          restartMode: false,
          backupMode: false,
          ipg: 0,
        });
        break;
      case 'nas_safe':
        onApplyPresetFlags({
          fft: true,
          restartableBackupMode: true,
          threads: 16,
          retryCount: 2,
          waitTime: 3,
          excludeJunctions: true,
        });
        break;
      case 'bandwidth_throttle':
        onApplyPresetFlags({
          threads: 4,
          ipg: 50, // 50ms delay between packets
          restartableBackupMode: true,
        });
        break;
      case 'night_window':
        onApplyPresetFlags({
          runHours: '2200-0600',
          perFileTimeCheck: true,
          threads: 16,
          noProgress: true,
        });
        break;
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Header Bar */}
      <div 
        onClick={() => setIsMenuExpanded(!isMenuExpanded)}
        className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Robocopy 고급 명령어 &amp; 엔터프라이즈 옵션</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                고급 설정 허브
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                {isMenuExpanded ? '클릭하여 접기 ▲' : '클릭하여 펼치기 ▼'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              서버 마이그레이션, NTFS ACL 권한 복제, 멀티스레드 대역폭 조절, 정밀 필터링 및 실시간 감시 옵션을 분류별로 설정합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMenuExpanded ? "메뉴 접기" : "메뉴 펼치기"}
          >
            {isMenuExpanded ? <ChevronUp className="w-5 h-5 text-purple-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isMenuExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Category Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <div className="flex flex-wrap gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                전체보기
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('security')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeCategory === 'security' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1. 보안/권한</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('performance')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeCategory === 'performance' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>2. 성능/대역폭</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('filter')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeCategory === 'filter' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>3. 정밀필터</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('realtime')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeCategory === 'realtime' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>4. 실시간감시</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('nas')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  activeCategory === 'nas' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>5. NAS/로깅</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="플래그 또는 기능 검색 (예: COPYALL, IPG)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categorized Options Grids */}
          <div className="space-y-6">
            {/* CATEGORY 1: 보안 & 권한 및 백업 모드 */}
            {(activeCategory === 'all' || activeCategory === 'security') && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h4>1. 보안, 권한 및 특수 모드 (Security &amp; Advanced Modes)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* /ZB */}
                  <div 
                    title="백업 모드 + 재시작 가능 (/ZB): 접근 거부(Access Denied) 시 Windows 백업 연산자 권한(SeBackupPrivilege)을 발동하여 잠긴 파일까지 강제 복사하며, 네트워크 끊김 시 이어서 복사합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.restartableBackupMode ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">/ZB</code>
                        <span className="text-xs font-bold text-white">백업 모드 + 재시작 가능</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={flags.restartableBackupMode}
                        onChange={(e) => {
                          onUpdateFlag('restartableBackupMode', e.target.checked);
                          if (e.target.checked) {
                            onUpdateFlag('backupMode', false);
                            onUpdateFlag('restartMode', false);
                          }
                        }}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /COPYALL */}
                  <div 
                    title="전체 메타데이터 복제 (/COPYALL): 데이터, 속성, 시간, NTFS 보안 권한(ACL), 소유자, 감사 정보를 100% 원본 그대로 복제합니다 (/COPY:DATSOU 와 동일, 서버 이전 필수)."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.copyAll ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">/COPYALL</code>
                        <span className="text-xs font-bold text-white">전체 메타데이터 복제 (/COPY:DATSOU)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.copyAll}
                        onChange={(e) => {
                          onUpdateFlag('copyAll', e.target.checked);
                          if (e.target.checked) onUpdateFlag('copySec', false);
                        }}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /SEC */}
                  <div 
                    title="보안 권한(NTFS ACL) 복사 (/SEC): 기본 속성에 추가로 NTFS 보안 권한(ACL)을 대상 파일 및 폴더에 복제합니다 (/COPY:DATS 와 동일)."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.copySec ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">/SEC</code>
                        <span className="text-xs font-bold text-white">보안 권한(NTFS ACL) 복사</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.copySec}
                        disabled={!!flags.copyAll}
                        onChange={(e) => onUpdateFlag('copySec', e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {/* /SECFIX */}
                  <div 
                    title="보안 권한만 강제 갱신 (/SECFIX): 파일 본문 데이터는 재전송하지 않고 기존 대상 파일의 NTFS 보안 권한(ACL)만 새로고침하여 동기화합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.secFix ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">/SECFIX</code>
                        <span className="text-xs font-bold text-white">보안 권한만 강제 갱신</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.secFix}
                        onChange={(e) => onUpdateFlag('secFix', e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /TIMFIX */}
                  <div 
                    title="타임스탬프만 강제 동기화 (/TIMFIX): 파일 본문을 다시 복사하지 않고 원본과 대상의 생성/수정 날짜·시간 메타데이터만 동일하게 맞춥니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.timFix ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">/TIMFIX</code>
                        <span className="text-xs font-bold text-white">타임스탬프만 강제 동기화</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.timFix}
                        onChange={(e) => onUpdateFlag('timFix', e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /NOOFFLOAD */}
                  <div 
                    title="ODX 복사 오프로드 비활성화 (/NOOFFLOAD): 스토리지 하드웨어 오프로드 호환성 문제가 있을 때 순수 네트워크 전송으로 강제하여 끊김을 방지합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.noOffload ? 'bg-purple-950/40 border-purple-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/60">/NOOFFLOAD</code>
                        <span className="text-xs font-bold text-white">ODX 복사 오프로드 비활성화</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.noOffload}
                        onChange={(e) => onUpdateFlag('noOffload', e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 2: 성능 & 대역폭 제어 */}
            {(activeCategory === 'all' || activeCategory === 'performance') && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-blue-300">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  <h4>2. 성능 및 I/O 대역폭 제어 (Performance &amp; Throttling)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* /MT:n Threads */}
                  <div 
                    title="멀티스레드 병렬 복사 (/MT:n): 동시에 여러 파일을 병렬 복사합니다 (1~64 스레드, NVMe/SSD: 16~32 스레드 권장)."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">/MT:{flags.threads}</code>
                        <span className="text-xs font-bold text-white">멀티스레드 병렬 복사</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-400">{flags.threads} Threads</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="64"
                      value={flags.threads}
                      onChange={(e) => onUpdateFlag('threads', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* /IPG:n Inter-Packet Gap */}
                  <div 
                    title="패킷 간 지연 (/IPG:n): 업무 시간 중 네트워크 독점을 방지하기 위해 64KB 패킷마다 밀리초 단위로 대기합니다 (0 = 최대 속도)."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">/IPG:{flags.ipg || 0}</code>
                        <span className="text-xs font-bold text-white">패킷 간 지연 (대역폭 조절)</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">{flags.ipg || 0} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="10"
                      value={flags.ipg || 0}
                      onChange={(e) => onUpdateFlag('ipg', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* /XJ Exclude Junctions */}
                  <div 
                    title="Junction 포인트 제외 (/XJ): Windows의 디렉터리 링크(Junction)를 제외하여 바로가기로 인한 무한 재귀 참조 탐색 오류를 차단합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.excludeJunctions ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">/XJ</code>
                        <span className="text-xs font-bold text-white">Junction 포인트 제외 (무한루프 차단)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={flags.excludeJunctions !== false}
                        onChange={(e) => onUpdateFlag('excludeJunctions', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /SL Symbolic Link */}
                  <div 
                    title="심볼릭 링크 자체 복제 (/SL): 링크가 가리키는 실제 원본 데이터 대신 심볼릭 링크(바로가기 정보) 자체를 복제합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.copySymlink ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">/SL</code>
                        <span className="text-xs font-bold text-white">심볼릭 링크 자체 복제</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.copySymlink}
                        onChange={(e) => onUpdateFlag('copySymlink', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /SJ Directory Junction */}
                  <div 
                    title="디렉터리 Junction 링크 복제 (/SJ): 디렉터리 교차점(Junction)을 실제 파일로 펼치지 않고 Junction 링크 자체로 복사합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.copyJunction ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">/SJ</code>
                        <span className="text-xs font-bold text-white">디렉터리 Junction 링크 복제</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.copyJunction}
                        onChange={(e) => onUpdateFlag('copyJunction', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 3: 정밀 필터링 및 조건부 복사 */}
            {(activeCategory === 'all' || activeCategory === 'filter') && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-emerald-300">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  <h4>3. 정밀 파일 필터링 및 조건부 복사 (Advanced Filtering)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* /XO Exclude Older */}
                  <div 
                    title="오래된 파일 덮어쓰기 방지 (/XO): 대상 위치에 이미 더 최신 파일이 존재하면 원본의 오래된 파일로 덮어쓰지 않고 건너뜁니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.excludeOlder ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/XO</code>
                        <span className="text-xs font-bold text-white">오래된 파일 덮어쓰기 방지</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.excludeOlder}
                        onChange={(e) => onUpdateFlag('excludeOlder', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /XN Exclude Newer */}
                  <div 
                    title="최신 파일 복사 제외 (/XN): 대상 위치의 파일보다 원본 파일이 더 최신인 경우 복사를 건너뜁니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.excludeNewer ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/XN</code>
                        <span className="text-xs font-bold text-white">최신 파일 복사 제외</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.excludeNewer}
                        onChange={(e) => onUpdateFlag('excludeNewer', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /XC Exclude Changed */}
                  <div 
                    title="변경된 파일 제외 (/XC): 동일한 타임스탬프를 가졌으나 파일 크기가 달라진 변경된 파일을 건너뜁니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.excludeChanged ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/XC</code>
                        <span className="text-xs font-bold text-white">변경된 파일 제외</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.excludeChanged}
                        onChange={(e) => onUpdateFlag('excludeChanged', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /MIN:n (Min File Size) */}
                  <div 
                    title="최소 파일 크기 제한 (/MIN:n): 지정한 크기보다 작은 0바이트 빈 파일이나 소용량 로그를 복사에서 건너뜁니다."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/MIN</code>
                        <span className="text-xs font-bold text-white">최소 파일 크기 (MB)</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{flags.minFileSizeMb && flags.minFileSizeMb > 0 ? `${flags.minFileSizeMb} MB 이상` : '제한 없음'}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (제한 없음)"
                      value={flags.minFileSizeMb !== undefined && !isNaN(flags.minFileSizeMb) ? flags.minFileSizeMb : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateFlag('minFileSizeMb', !isNaN(val) && val > 0 ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* /MAX:n (Max File Size) */}
                  <div 
                    title="최대 파일 크기 제한 (/MAX:n): 지정한 크기를 초과하는 대용량 ISO나 동영상 파일을 복사에서 제외합니다."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/MAX</code>
                        <span className="text-xs font-bold text-white">최대 파일 크기 (MB)</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{flags.maxFileSizeMb && flags.maxFileSizeMb > 0 ? `${flags.maxFileSizeMb} MB 이하` : '제한 없음'}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (제한 없음)"
                      value={flags.maxFileSizeMb !== undefined && !isNaN(flags.maxFileSizeMb) ? flags.maxFileSizeMb : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateFlag('maxFileSizeMb', !isNaN(val) && val > 0 ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* /MINAGE:n (Min Age Days) */}
                  <div 
                    title="최소 파일 연령 (/MINAGE:n): 지정한 일수보다 오래된 파일만 복사/아카이빙합니다 (예: 30일 이상 지난 로그)."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/MINAGE</code>
                        <span className="text-xs font-bold text-white">최소 파일 연령 (경과일)</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{flags.minAgeDays && flags.minAgeDays > 0 ? `${flags.minAgeDays}일 이상` : '제한 없음'}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (제한 없음)"
                      value={flags.minAgeDays !== undefined && !isNaN(flags.minAgeDays) ? flags.minAgeDays : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateFlag('minAgeDays', !isNaN(val) && val > 0 ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* /MAXAGE:n (Max Age Days) */}
                  <div 
                    title="최대 파일 연령 (/MAXAGE:n): 지정한 일수 이내에 생성/수정된 최신 파일만 골라서 복사합니다."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">/MAXAGE</code>
                        <span className="text-xs font-bold text-white">최대 파일 연령 (최근일)</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{flags.maxAgeDays && flags.maxAgeDays > 0 ? `${flags.maxAgeDays}일 이내` : '제한 없음'}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (제한 없음)"
                      value={flags.maxAgeDays !== undefined && !isNaN(flags.maxAgeDays) ? flags.maxAgeDays : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateFlag('maxAgeDays', !isNaN(val) && val > 0 ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 4: 실시간 감시 및 실행 시간대 */}
            {(activeCategory === 'all' || activeCategory === 'realtime') && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-amber-300">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <h4>4. 실시간 감시 및 연속 동기화 (Real-time Sync &amp; Time Window)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* /MON:n */}
                  <div 
                    title="실시간 변경 감시 (/MON:n): 원본 폴더에서 지정한 개수 이상의 파일 변경이 감지되면 즉시 다시 동기화를 시작합니다."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60">/MON:n</code>
                        <span className="text-xs font-bold text-white">실시간 변경 감시</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400">{flags.monitorChangesCount && flags.monitorChangesCount > 0 ? `${flags.monitorChangesCount}개 변경 시` : '비활성'}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (비활성화)"
                      value={flags.monitorChangesCount !== undefined && !isNaN(flags.monitorChangesCount) ? flags.monitorChangesCount : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateFlag('monitorChangesCount', !isNaN(val) && val > 0 ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* /MOT:m */}
                  <div 
                    title="변경 대기 시간 (/MOT:m): 파일이 수정된 후 지정한 시간(분) 동안 추가 수정이 없는지 대기 후 안전하게 백업합니다."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60">/MOT:m</code>
                        <span className="text-xs font-bold text-white">변경 대기 시간</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400">{flags.monitorWaitMinutes && flags.monitorWaitMinutes > 0 ? `${flags.monitorWaitMinutes}분 대기` : '비활성'}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 (비활성화)"
                      value={flags.monitorWaitMinutes !== undefined && !isNaN(flags.monitorWaitMinutes) ? flags.monitorWaitMinutes : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateFlag('monitorWaitMinutes', !isNaN(val) && val > 0 ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* /RH:hhmm-hhmm */}
                  <div 
                    title="복사 허용 시간대 (/RH): 지정한 시간대에만 복사가 실행됩니다 (예: 2200-0600 = 야간 22시~익일 06시)."
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60">/RH</code>
                        <span className="text-xs font-bold text-white">복사 허용 시간대</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400">{flags.runHours || '제한 없음'}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="예: 2200-0600 (밤 10시~아침 6시)"
                      value={flags.runHours || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        onUpdateFlag('runHours', val !== '' ? val : undefined);
                      }}
                      className="w-full px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <div className="flex items-center justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => onUpdateFlag('runHours', '2200-0600')}
                        className="text-[10px] text-amber-300 underline hover:text-amber-200"
                      >
                        야간(22:00~06:00) 적용
                      </button>
                    </div>
                  </div>

                  {/* /PF Per-File Check */}
                  <div 
                    title="파일 단위 시간대 체크 (/PF): 패스 단위가 아닌 각 파일 복사 직전마다 /RH 시간대를 재검사하여 작업 마감 시간을 정확하게 준수합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.perFileTimeCheck ? 'bg-amber-950/40 border-amber-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60">/PF</code>
                        <span className="text-xs font-bold text-white">파일 단위 시간대 체크</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.perFileTimeCheck}
                        onChange={(e) => onUpdateFlag('perFileTimeCheck', e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 5: NAS 및 파일시스템 호환성 */}
            {(activeCategory === 'all' || activeCategory === 'nas') && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-indigo-300">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <h4>5. NAS 및 이기종 파일시스템 호환성 (NAS &amp; Cross-Platform)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* /FFT */}
                  <div 
                    title="FAT 시간 2초 공차 허용 (/FFT): Linux 기반 NAS(Synology, QNAP) 전송 시 타임스탬프 오차로 인해 매번 모든 파일이 재복사되는 현상을 완벽 방지합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.fft ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">/FFT</code>
                        <span className="text-xs font-bold text-white">FAT 시간 2초 공차 허용</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={flags.fft}
                        onChange={(e) => onUpdateFlag('fft', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /FAT */}
                  <div 
                    title="8.3 단축 파일명 강제 (/FAT): 구형 FAT 파일시스템과의 호환성을 위해 긴 파일 이름을 DOS 8.3 형식으로 변환하여 생성합니다."
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${flags.fatFileNames ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/60">/FAT</code>
                        <span className="text-xs font-bold text-white">8.3 단축 파일명 강제</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.fatFileNames}
                        onChange={(e) => onUpdateFlag('fatFileNames', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 6: 로깅 및 진단 포맷 */}
            {(activeCategory === 'all' || activeCategory === 'logging') && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-cyan-300">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h4>6. 로깅, 출력 및 진단 포맷 (Logging &amp; Output)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* /NP */}
                  <div 
                    title="진행률(%) 출력 억제 (/NP): 화면 인쇄 오버헤드를 줄여 대량 파일 복사 속도를 최대화합니다."
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${flags.noProgress ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60">/NP</code>
                        <div className="text-xs font-bold text-white mt-1">진행률(%) 출력 억제</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={flags.noProgress}
                        onChange={(e) => onUpdateFlag('noProgress', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /BYTES */}
                  <div 
                    title="바이트 단위 정확 출력 (/BYTES): 로그에 파일 크기를 KB/MB 대신 정확한 Byte 정수로 기록합니다."
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${flags.bytesLogging ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60">/BYTES</code>
                        <div className="text-xs font-bold text-white mt-1">바이트 단위 정확 출력</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!flags.bytesLogging}
                        onChange={(e) => onUpdateFlag('bytesLogging', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /TS */}
                  <div 
                    title="타임스탬프 포함 (/TS): 로그에 원본 파일의 수정 일시 정보를 함께 출력합니다."
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${flags.includeTimestamps ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60">/TS</code>
                        <div className="text-xs font-bold text-white mt-1">타임스탬프 포함</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={flags.includeTimestamps}
                        onChange={(e) => onUpdateFlag('includeTimestamps', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>

                  {/* /FP */}
                  <div 
                    title="전체 경로(Full Path) (/FP): 로그에 파일명 대신 전체 디렉터리 경로를 출력합니다."
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${flags.fullPathNames ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60">/FP</code>
                        <div className="text-xs font-bold text-white mt-1">전체 경로(Full Path)</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={flags.fullPathNames}
                        onChange={(e) => onUpdateFlag('fullPathNames', e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
