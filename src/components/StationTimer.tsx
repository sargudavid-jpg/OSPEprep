import React, { useEffect, useState } from 'react';
import { Bell, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StationTimerProps {
  initialSeconds?: number;
  onTimeExpired?: () => void;
  compact?: boolean;
}

export const StationTimer: React.FC<StationTimerProps> = ({
  initialSeconds = 300, // 5 minutes standard OSPE
  onTimeExpired,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hasWarnedOneMin, setHasWarnedOneMin] = useState<boolean>(false);

  // Play synthesized clinical exam bell chime using Web Audio API
  const playBellChime = (frequency = 880, type: OscillatorType = 'sine', duration = 0.8) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === 61 && !hasWarnedOneMin) {
            setHasWarnedOneMin(true);
            playBellChime(587.33, 'triangle', 0.6); // 1-minute warning chime
          }
          if (prev <= 1) {
            setIsRunning(false);
            playBellChime(440, 'sine', 1.5); // Final station bell chime
            if (onTimeExpired) onTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, hasWarnedOneMin, soundEnabled]);

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = (newSeconds = initialSeconds) => {
    setIsRunning(false);
    setSecondsLeft(newSeconds);
    setHasWarnedOneMin(false);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isWarning = secondsLeft > 0 && secondsLeft <= 60;
  const isExpired = secondsLeft === 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors ${
        isWarning
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
          : isExpired
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : isRunning
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}>
        <Bell className="w-3.5 h-3.5" />
        <span>{formattedTime}</span>
        <button
          onClick={toggleRun}
          className="p-0.5 hover:text-white transition-colors"
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
      isWarning
        ? 'bg-rose-950/40 text-rose-200 border-rose-600/50 shadow-sm shadow-rose-950 animate-pulse'
        : isExpired
        ? 'bg-amber-950/40 text-amber-200 border-amber-600/50'
        : isRunning
        ? 'bg-emerald-950/30 text-emerald-200 border-emerald-600/40'
        : 'bg-slate-900/80 text-slate-300 border-slate-800'
    }`}>
      <div className="flex items-center gap-1.5">
        <Bell className={`w-3.5 h-3.5 ${isWarning ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {t('timer.label', 'OSPE Bell')}:
        </span>
        <span className="font-mono text-sm font-bold tracking-tight text-white">{formattedTime}</span>
      </div>

      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={toggleRun}
          className={`p-1 rounded transition-colors ${
            isRunning
              ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
              : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
          }`}
          title={isRunning ? 'Pause station timer' : 'Start station timer'}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          onClick={() => resetTimer(initialSeconds)}
          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Reset timer to 5:00"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title={soundEnabled ? 'Mute bell chime' : 'Enable bell chime'}
        >
          {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
        </button>
      </div>

      {isWarning && (
        <span className="text-[10px] text-rose-300 font-semibold uppercase tracking-wider ml-1 hidden sm:inline">
          1 min remaining!
        </span>
      )}
    </div>
  );
};
