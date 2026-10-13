import React from 'react';
import { 
  CheckCircle2, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  HardDrive, 
  Clock, 
  ArrowRight,
  Code
} from 'lucide-react';

export const RecommendationGuide: React.FC = () => {
  const reasons = [
    {
      title: '1. 초경량 메모리 및 0.1초 즉시 실행 (High Performance)',
      icon: Zap,
      desc: 'C# .NET 8 / WPF 기반 앱은 실행 파일 크기가 수 MB 수준으로 경량이며, 실행 메모리 사용량이 약 30MB~40MB에 불과합니다. Electron(150MB~300MB) 대비 80% 이상 가볍습니다.',
    },
    {
      title: '2. Robocopy.exe 비동기 프로세스 직결 (Native Process Piping)',
      icon: Terminal,
      desc: 'System.Diagnostics.Process 및 RedirectStandardOutput을 활용하여 Robocopy.exe의 표준 출력 스트림을 비동기로 캡처하고, 정규식으로 진행률(%)과 속도(MB/s)를 UI 지연 없이 실시간 처리합니다.',
    },
    {
      title: '3. 윈도우 작업 스케줄러(Task Scheduler) 네이티브 연동',
      icon: Clock,
      desc: 'Windows OS 내부의 schtasks.exe CLI 및 TaskScheduler COM/NET API를 직접 제어하여 앱이 꺼져 있어도 OS 수준에서 예약 백업이 안전하게 백그라운드 작동합니다.',
    },
    {
      title: '4. MVVM 패턴으로 UI와 비즈니스 로직의 완전 분리',
      icon: Layers,
      desc: 'View(XAML)와 ViewModel/RobocopyService(C#)가 데이터 바인딩(INotifyPropertyChanged)으로 결합되어, 로그 스트리밍과 백업 진행 상황 업데이트 시 스레드 안정성이 완벽히 보장됩니다.',
    },
    {
      title: '5. 드래그 앤 드롭 및 시스템 트레이(Tray) 내장',
      icon: HardDrive,
      desc: 'WPF의 AllowDrop="True" 이벤트를 통해 윈도우 탐색기 폴더를 바로 드래그할 수 있으며, 시스템 트레이 최소화 모드를 통해 백그라운드 감시 상태를 유지할 수 있습니다.',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">C# + WPF + MVVM 개발 언어 추천 및 이유</h1>
            <p className="text-slate-300 text-sm">
              윈도우 환경에서 Robocopy 전용 GUI 앱 개발 시 C#과 WPF(MVVM 패턴)가 가장 최적인 이유와 아키텍처 구성입니다.
            </p>
          </div>
        </div>
      </div>

      {/* Reasons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reasons.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 w-fit border border-blue-500/20">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm">{r.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{r.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Architecture Comparison Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <span>프레임워크 성능 및 메모리 비교 (WPF vs Electron vs Python)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">기술 스택</th>
                <th className="p-3">메모리 사용량 (RAM)</th>
                <th className="p-3">실행 파일 크기</th>
                <th className="p-3">실행 속도</th>
                <th className="p-3 rounded-r-xl">윈도우 API 연동성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="bg-blue-950/20 text-blue-200 font-semibold">
                <td className="p-3 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>C# .NET 8 + WPF (권장)</span>
                </td>
                <td className="p-3 font-bold text-emerald-400">~ 35 MB</td>
                <td className="p-3">~ 15 MB (SingleFile)</td>
                <td className="p-3 font-bold text-emerald-400">&lt; 0.1 초</td>
                <td className="p-3 text-emerald-400">완벽 (Native COM/Process)</td>
              </tr>
              <tr>
                <td className="p-3">Electron / Web-Tech</td>
                <td className="p-3 text-rose-400">~ 200 MB+</td>
                <td className="p-3">~ 80 MB+</td>
                <td className="p-3">1.5 초 ~ 2.5 초</td>
                <td className="p-3">제한적 (Node IPC 필요)</td>
              </tr>
              <tr>
                <td className="p-3">Python + PyQt / Tkinter</td>
                <td className="p-3">~ 70 MB</td>
                <td className="p-3">~ 35 MB</td>
                <td className="p-3">0.8 초</td>
                <td className="p-3">중간 (pywin32 필요)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
