import React from 'react';
import { ArrowLeftRight, Bot, BookOpen } from 'lucide-react';

interface QuickFlipButtonProps {
  activePane: 'study' | 'tutor';
  onTogglePane: () => void;
  stationNumber?: number;
}

export const QuickFlipButton: React.FC<QuickFlipButtonProps> = ({
  activePane,
  onTogglePane,
  stationNumber: _stationNumber = 1,
}) => {
  const isStudy = activePane === 'study';

  return (
    <div className="md:hidden fixed bottom-18 right-4 z-40 animate-in fade-in zoom-in-90">
      <button
        onClick={onTogglePane}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl transition-all active:scale-95 border ${
          isStudy
            ? 'bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-950 border-teal-300 shadow-teal-950/60 ring-2 ring-teal-400/30'
            : 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white border-teal-300/40 shadow-indigo-950/60 ring-2 ring-indigo-400/30'
        }`}
      >
        <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
        {isStudy ? (
          <>
            <Bot className="w-4 h-4 stroke-[2.5]" />
            <span>Flip to AI Tutor</span>
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            <span>Flip to Study Center</span>
          </>
        )}
      </button>
    </div>
  );
};
