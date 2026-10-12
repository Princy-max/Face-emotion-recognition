import React from 'react';
import { Camera, BarChart3, ScanFace } from 'lucide-react';

export type NavTab = 'studio' | 'evaluation';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isCameraActive,
  onToggleCamera,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Clean Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ScanFace className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Facial Emotion Recognition
            </span>
          </div>

          {/* Zone 2: Clean Two-Tab Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <button
              onClick={() => onSelectTab('studio')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'studio'
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              <span>Live Recognition & Detection</span>
            </button>

            <button
              onClick={() => onSelectTab('evaluation')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'evaluation'
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Model Evaluation (Accuracy & F1)</span>
            </button>
          </nav>

          {/* Zone 3: Primary Webcam Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleCamera}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isCameraActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-sm'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
