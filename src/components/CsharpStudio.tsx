import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderTree, 
  Sparkles, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { CSHARP_MVVM_TEMPLATES } from '../utils/robocopy';

export const CsharpStudio: React.FC = () => {
  const [selectedSnippetId, setSelectedSnippetId] = useState(CSHARP_MVVM_TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  const currentSnippet = CSHARP_MVVM_TEMPLATES.find((s) => s.id === selectedSnippetId) || CSHARP_MVVM_TEMPLATES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate text package containing all files
    let fullProjectText = `// ==========================================================\n// RoboBackup Studio - C# WPF MVVM Production Source Code\n// Target Framework: .NET 8.0-windows / .NET 9.0-windows\n// Pattern: MVVM (Model-View-ViewModel)\n// ==========================================================\n\n`;

    CSHARP_MVVM_TEMPLATES.forEach((snippet) => {
      fullProjectText += `// ----------------------------------------------------------\n// FILE: ${snippet.filename}\n// DESCRIPTION: ${snippet.description}\n// ----------------------------------------------------------\n\n${snippet.code}\n\n\n`;
    });

    const blob = new Blob([fullProjectText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoboBackup_WPF_MVVM_Project_Source.cs`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight">C# WPF MVVM 소스 코드 생성기</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Dual Target (.NET 8 &amp; .NET 4.8)</span>
              </div>
              <p className="text-slate-300 text-sm mt-1">
                Windows 7/8/8.1/10/11 전 버전을 동시 지원하는 멀티 타겟팅 C# WPF &amp; Windows Service 실시간 프로덕션 소스 코드입니다.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>전체 C# 프로젝트 파일 다운로드</span>
          </button>
        </div>
      </div>

      {/* Project Structure Diagram & Code Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Solution Explorer */}
        <div className="lg:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <FolderTree className="w-4 h-4 text-blue-400" />
            <span>솔루션 탐색기 (Project Structure)</span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-300 px-2 py-1 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>RoboBackupApp (.NET 8 WPF)</span>
            </div>

            <div className="pl-3 space-y-1 text-xs">
              {CSHARP_MVVM_TEMPLATES.map((snippet) => {
                const isSelected = snippet.id === selectedSnippetId;
                return (
                  <button
                    key={snippet.id}
                    onClick={() => setSelectedSnippetId(snippet.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                    <span className="truncate">{snippet.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">💡 주요 권장 라이브러리:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>CommunityToolkit.Mvvm (RelayCommand, ObservableObject)</li>
              <li>Microsoft.Win32.TaskScheduler</li>
            </ul>
          </div>
        </div>

        {/* Right Code View Panel */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
          
          {/* Header Bar */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-sm font-bold text-slate-100">{currentSnippet.filename}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentSnippet.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? '복사됨!' : '코드 복사'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-5 font-mono text-xs text-blue-200 bg-slate-950 overflow-x-auto h-[520px] select-all leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
            <pre>{currentSnippet.code}</pre>
          </div>

        </div>

      </div>

    </div>
  );
};
