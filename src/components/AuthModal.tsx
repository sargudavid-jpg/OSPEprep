import React, { useState } from 'react';
import { Check, KeyRound, Loader2, LogIn, LogOut, ShieldCheck, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName?: string | null;
  onSaveUserName: (name: string) => void;
  userEmail?: string | null;
  onSignOut: () => void;
  onSignedIn: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserName = 'Guest',
  onSaveUserName,
  userEmail = null,
  onSignOut,
  onSignedIn,
}) => {
  const { t } = useTranslation();
  const safeCurrentName =
    typeof currentUserName === 'string' && currentUserName.trim().length > 0
      ? currentUserName.trim()
      : 'Guest';

  const [activeTab, setActiveTab] = useState<'profile' | 'supabase'>('profile');
  const [customName, setCustomName] = useState(safeCurrentName);
  const [savedNotice, setSavedNotice] = useState(false);

  // Supabase Auth State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) return;
    onSaveUserName?.(trimmed);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (!isSupabaseConfigured) {
      setAuthMessage({
        type: 'error',
        text: 'Supabase credentials are not configured in .env.local yet.',
      });
      return;
    }

    try {
      setAuthLoading(true);
      setAuthMessage(null);

      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data?.user?.email) {
          onSignedIn?.(data.user.email);
          setAuthMessage({ type: 'success', text: `Signed in as ${data.user.email}` });
          setTimeout(() => onClose(), 800);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data?.user?.email) {
          onSignedIn?.(data.user.email);
          setAuthMessage({
            type: 'success',
            text: 'Account created! Check your email if email confirmation is required.',
          });
          setTimeout(() => onClose(), 1200);
        }
      }
    } catch (err: unknown) {
      console.error('Supabase auth error:', err);
      setAuthMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      onSignOut?.();
      setAuthMessage({ type: 'success', text: 'Signed out successfully.' });
    } catch (err: unknown) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('auth.title', 'Student Profile & Auth')}</h3>
              <p className="text-[11px] text-slate-400">
                {t('auth.profileDesc', 'Manage user identity and Supabase authentication')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mt-4 mb-4">
          <button
            onClick={() => {
              setActiveTab('profile');
              setAuthMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('auth.nameLabel', 'Student Name')}
          </button>
          <button
            onClick={() => {
              setActiveTab('supabase');
              setAuthMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'supabase'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('auth.orSupabase', 'Supabase Cloud Auth')}
          </button>
        </div>

        {/* Tab 1: Simple Name Input */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('auth.nameLabel', 'Display Name')}
              </label>
              <input
                type="text"
                placeholder="Enter your name (e.g. Alex Vance, Medical Student)..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 font-medium"
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                {t('auth.profileDesc', 'Sets the active student profile for chat drills and study workspace.')}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Current: <strong className="text-white">{safeCurrentName}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  {t('studyCenter.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-400 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-md shadow-teal-950/40"
                >
                  {savedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>{t('auth.saveName', 'Save Name')}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Real Supabase Auth Form */}
        {activeTab === 'supabase' && (
          <div>
            {!isSupabaseConfigured && (
              <div className="mb-3 p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200">
                <p className="font-bold">⚠️ Supabase Credentials Unset</p>
                <p className="text-[11px] text-amber-300 mt-0.5">
                  Configure <code className="bg-black/50 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> in <code className="bg-black/50 px-1 py-0.5 rounded font-mono">.env.local</code> to enable real user authentication.
                </p>
              </div>
            )}

            {userEmail ? (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-teal-950/30 border border-teal-500/30 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-teal-300 block">
                      Authenticated with Supabase
                    </span>
                    <span className="text-xs text-white truncate block">{userEmail}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOutClick}
                    className="px-4 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSupabaseAuth} className="space-y-3">
                <div className="flex justify-center gap-4 text-xs font-semibold mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthMessage(null);
                    }}
                    className={`pb-1 border-b-2 transition-colors ${
                      authMode === 'signin'
                        ? 'border-teal-400 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthMessage(null);
                    }}
                    className={`pb-1 border-b-2 transition-colors ${
                      authMode === 'signup'
                        ? 'border-teal-400 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="student@medical.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 font-medium"
                    required
                  />
                </div>

                {authMessage && (
                  <p
                    className={`text-xs px-3 py-2 rounded-lg border ${
                      authMessage.type === 'error'
                        ? 'bg-rose-950/40 border-rose-900 text-rose-300'
                        : 'bg-teal-950/40 border-teal-900 text-teal-300'
                    }`}
                  >
                    {authMessage.text}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading || !email.trim() || !password.trim()}
                    className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-400 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-md shadow-teal-950/40"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : authMode === 'signin' ? (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Sign Up</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
