import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  Check,
  ChevronDown,
  Globe,
  Plus,
  User as UserIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClassItem } from '../types';
import { languageNames } from '../i18n';
import { StationTimer } from './StationTimer';

interface NavbarProps {
  classes?: ClassItem[];
  activeClassId?: string | null;
  onSelectClass?: (classId: string) => void;
  onOpenAddClass?: () => void;
  splitRatio?: 'equal' | 'study_focus' | 'tutor_focus';
  onChangeSplitRatio?: (ratio: 'equal' | 'study_focus' | 'tutor_focus') => void;
  userName?: string | null;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  classes = [],
  activeClassId = null,
  onSelectClass,
  onOpenAddClass,
  splitRatio = 'equal',
  onChangeSplitRatio,
  userName = 'Guest',
  onOpenAuthModal,
}) => {
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLangKey = (i18n.language || 'en').slice(0, 2).toLowerCase();
  const currentLangMeta = languageNames[currentLangKey] || languageNames.en;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('ospe_language', code);
    } catch {
      // ignore
    }
    setIsLangMenuOpen(false);
  };

  const safeClasses = Array.isArray(classes) ? classes : [];
  const displayName = typeof userName === 'string' && userName.trim().length > 0 ? userName.trim() : 'Guest';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-3 md:px-5 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Dynamic Classes Navigation Tabs */}
      <div className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar py-1">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-950/40">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                OSPE<span className="text-teal-400">prep</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block -mt-0.5">
              {t('nav.brandSub', 'Practical Exam AI Tutor')}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 shrink-0 hidden md:block" />

        {/* Dynamic Classes from Supabase (Guarded with optional chaining and safe array fallback) */}
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shrink-0">
          {safeClasses.length > 0 ? (
            safeClasses.map((cls) => {
              if (!cls || !cls.id) return null;
              const isActive = cls.id === activeClassId;
              return (
                <button
                  key={cls.id}
                  onClick={() => onSelectClass?.(cls.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{cls.name || 'Untitled Class'}</span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-500 px-3 py-1 italic">
              {t('nav.noClassesYet', 'No classes yet')}
            </span>
          )}

          <button
            onClick={() => onOpenAddClass?.()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-teal-400 hover:text-teal-300 hover:bg-teal-950/40 border border-teal-500/30 transition-all ml-1"
            title="Create a new class"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('nav.addClass', 'Add Class')}</span>
          </button>
        </nav>
      </div>

      {/* Right Controls: OSPE Timer, Desktop Split Layout, Language Switcher, Student Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* OSPE Bell Timer */}
        <div className="hidden lg:block">
          <StationTimer />
        </div>

        {/* Desktop Split Layout Controller */}
        <div className="hidden md:flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeSplitRatio?.('study_focus')}
            title="Focus Study Center (70:30)"
            className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
              splitRatio === 'study_focus'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('nav.study70', 'Study 70%')}
          </button>
          <button
            onClick={() => onChangeSplitRatio?.('equal')}
            title="Split Screen 50:50"
            className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
              splitRatio === 'equal'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('nav.split50', '50:50')}
          </button>
          <button
            onClick={() => onChangeSplitRatio?.('tutor_focus')}
            title="Focus AI Tutor (30:70)"
            className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
              splitRatio === 'tutor_focus'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('nav.tutor70', 'Tutor 70%')}
          </button>
        </div>

        {/* Trilingual Language Switcher (EN, RO, HU) */}
        <div ref={langMenuRef} className="relative">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-all text-xs cursor-pointer group"
            title={t('nav.selectLanguage', 'Select Language')}
          >
            <Globe className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase text-slate-200">{currentLangKey}</span>
            <span className="text-xs">{currentLangMeta.flag}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                isLangMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-0.5">
                {t('nav.selectLanguage', 'Select Language')}
              </div>
              {Object.entries(languageNames).map(([code, info]) => {
                const isSelected = currentLangKey === code;
                return (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 text-teal-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{info.flag}</span>
                      <span>{info.nativeName}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Button with strict null fallback to 'Guest' */}
        <button
          onClick={() => onOpenAuthModal?.()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-all text-xs cursor-pointer group"
          title={t('nav.profileTooltip', 'Click to edit profile or sign in')}
        >
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-200 hidden sm:inline max-w-[130px] truncate">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
};
