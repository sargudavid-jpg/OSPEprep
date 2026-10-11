import React, { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Offline Examination Mode • All loaded station materials and offline BaaS active</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {isVisible && (
        <div className="fixed bottom-20 left-4 z-40 bg-slate-900 border border-teal-500/50 p-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 max-w-sm">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install OSPEprep</h4>
            <p className="text-[11px] text-slate-400">Add to home screen for instant offline study</p>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-400 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
