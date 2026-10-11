import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/Navbar';
import { StudyCenter } from './components/study-center/StudyCenter';
import { AiTutor } from './components/ai-tutor/AiTutor';
import { QuickFlipButton } from './components/QuickFlipButton';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { AuthModal } from './components/AuthModal';
import { ClassItem, StudyMaterialItem } from './types';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import {
  createClass,
  deleteStudyMaterial,
  fetchClasses,
  fetchStudyMaterials,
} from './services/baas';
import { AlertCircle, FolderPlus, Loader2 } from 'lucide-react';

export function App() {
  const { t } = useTranslation();
  // True blank slate state - guaranteed [] and null initial states
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterialItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // User Profile & Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('ospe_student_name') || 'Guest';
    } catch {
      return 'Guest';
    }
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Layout State
  const [splitRatio, setSplitRatio] = useState<'equal' | 'study_focus' | 'tutor_focus'>('equal');
  const [mobilePane, setMobilePane] = useState<'study' | 'tutor'>('study');

  // Add Class Modal State
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassDescription, setNewClassDescription] = useState<string>('');
  const [isCreatingClass, setIsCreatingClass] = useState<boolean>(false);

  // 1. Initial Load: Check auth safely if Supabase configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    try {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.email) {
          setUserEmail(data.session.user.email);
          setUserName(data.session.user.email.split('@')[0] || 'Student');
        }
      }).catch((e) => {
        console.warn('Session check warning:', e);
      });

      const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          setUserName(session.user.email.split('@')[0] || 'Student');
        } else {
          setUserEmail(null);
          try {
            setUserName(localStorage.getItem('ospe_student_name') || 'Guest');
          } catch {
            setUserName('Guest');
          }
        }
      });

      return () => {
        authData?.subscription?.unsubscribe?.();
      };
    } catch (err) {
      console.warn('Auth subscription notice:', err);
    }
  }, []);

  const handleSaveUserName = (name: string) => {
    const clean = name?.trim() || 'Guest';
    setUserName(clean);
    try {
      localStorage.setItem('ospe_student_name', clean);
    } catch {
      // Storage unavailable
    }
  };

  // 2. Fetch Classes from Supabase (graceful empty state)
  const loadClassesAndMaterials = async () => {
    try {
      setIsLoading(true);
      setErrorNotice(null);

      const remoteClasses = await fetchClasses();
      const safeClasses = Array.isArray(remoteClasses) ? remoteClasses : [];
      setClasses(safeClasses);

      if (safeClasses.length > 0) {
        const initialClassId = safeClasses[0]?.id;
        setActiveClassId(initialClassId || null);

        if (initialClassId) {
          const remoteMaterials = await fetchStudyMaterials(initialClassId);
          const safeMaterials = Array.isArray(remoteMaterials) ? remoteMaterials : [];
          setMaterials(safeMaterials);
          setActiveMaterial(safeMaterials.length > 0 ? safeMaterials[0] : null);
        } else {
          setMaterials([]);
          setActiveMaterial(null);
        }
      } else {
        setActiveClassId(null);
        setMaterials([]);
        setActiveMaterial(null);
      }
    } catch (err: unknown) {
      console.warn('Supabase fetch notice:', err);
      setClasses([]);
      setMaterials([]);
      setActiveMaterial(null);

      if (isSupabaseConfigured) {
        setErrorNotice(
          err instanceof Error
            ? err.message
            : 'Could not connect to Supabase. Please ensure tables are created via supabase_schema.sql.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndMaterials();
  }, []);

  // 3. Class Switch: Fetch materials for selected class
  const handleSelectClass = async (classId: string) => {
    if (!classId) return;
    setActiveClassId(classId);
    try {
      const items = await fetchStudyMaterials(classId);
      const safeItems = Array.isArray(items) ? items : [];
      setMaterials(safeItems);
      setActiveMaterial(safeItems.length > 0 ? safeItems[0] : null);
    } catch (err) {
      console.error('Error fetching materials for class:', err);
      setMaterials([]);
      setActiveMaterial(null);
    }
  };

  // 4. Create Class Handler
  const handleCreateClass = async (name: string, description?: string) => {
    const created = await createClass(name, description);
    if (created && created.id) {
      setClasses((prev) => [...(prev || []), created]);
      setActiveClassId(created.id);
      setMaterials([]);
      setActiveMaterial(null);
    }
  };

  const handleModalCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      setIsCreatingClass(true);
      await handleCreateClass(newClassName.trim(), newClassDescription?.trim() || undefined);
      setNewClassName('');
      setNewClassDescription('');
      setIsAddClassModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setIsCreatingClass(false);
    }
  };

  // 5. Handle Material Uploaded
  const handleMaterialUploaded = (newItem: StudyMaterialItem) => {
    if (!newItem) return;
    setMaterials((prev) => [newItem, ...(prev || [])]);
    setActiveMaterial(newItem);
  };

  // 6. Handle Delete Material
  const handleDeleteMaterial = async (id: string, fileUrl: string) => {
    try {
      await deleteStudyMaterial(id, fileUrl);
      setMaterials((prev) => {
        const remaining = (prev || []).filter((m) => m?.id !== id);
        if (activeMaterial?.id === id) {
          setActiveMaterial(remaining.length > 0 ? remaining[0] : null);
        }
        return remaining;
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  // Flex layout classes for desktop
  const getSplitClasses = () => {
    switch (splitRatio) {
      case 'study_focus':
        return { study: 'md:w-[70%]', tutor: 'md:w-[30%]' };
      case 'tutor_focus':
        return { study: 'md:w-[30%]', tutor: 'md:w-[70%]' };
      case 'equal':
      default:
        return { study: 'md:w-[50%]', tutor: 'md:w-[50%]' };
    }
  };

  const splitClasses = getSplitClasses();
  const activeClass = (classes || []).find((c) => c?.id === activeClassId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <PwaInstallPrompt />

      {/* Error / Setup Notice if Supabase query fails */}
      {errorNotice && (
        <aside
          aria-label="Configuration notice"
          className="bg-rose-950 border-b border-rose-800 px-4 py-2 text-xs text-rose-200 flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Supabase Connection:</strong> {errorNotice}. Make sure you ran{' '}
              <code className="bg-black/50 px-1 py-0.5 rounded text-white font-mono">
                supabase_schema.sql
              </code>{' '}
              in your Supabase SQL Editor.
            </span>
          </div>
          <button
            onClick={() => loadClassesAndMaterials()}
            className="px-2.5 py-1 rounded bg-rose-900 hover:bg-rose-800 text-white font-bold shrink-0 text-[11px]"
          >
            Retry Connection
          </button>
        </aside>
      )}

      {/* Header Bar */}
      <Navbar
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onOpenAddClass={() => setIsAddClassModalOpen(true)}
        splitRatio={splitRatio}
        onChangeSplitRatio={setSplitRatio}
        userName={userName}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Split Screen Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-3" />
          <h3 className="text-sm font-bold text-white">{t('app.loadingWorkspace', 'Loading Workspace...')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('app.connectingDb', 'Connecting to workspace database')}</p>
        </div>
      ) : (
        <main className="flex-1 flex overflow-hidden relative">
          {/* Left Side: Study Center (Shared Workspace) */}
          <section
            className={`h-full flex flex-col transition-all duration-200 border-r border-slate-800/80 ${
              splitClasses.study
            } ${mobilePane === 'study' ? 'w-full flex' : 'hidden md:flex'}`}
            aria-label="Study Center"
          >
            <StudyCenter
              classes={classes}
              activeClassId={activeClassId}
              onSelectClass={handleSelectClass}
              onCreateClass={handleCreateClass}
              materials={materials}
              activeMaterial={activeMaterial}
              onSelectMaterial={setActiveMaterial}
              onMaterialUploaded={handleMaterialUploaded}
              onDeleteMaterial={handleDeleteMaterial}
            />
          </section>

          {/* Right Side: AI Tutor (Live Gemini API Workspace) */}
          <section
            className={`h-full flex flex-col transition-all duration-200 ${
              splitClasses.tutor
            } ${mobilePane === 'tutor' ? 'w-full flex' : 'hidden md:flex'}`}
            aria-label="AI Tutor"
          >
            <AiTutor
              activeMaterial={activeMaterial}
              activeClass={activeClass}
              classMaterials={materials}
            />
          </section>

          {/* Mobile Quick Flip Floating Button */}
          <QuickFlipButton
            activePane={mobilePane}
            onTogglePane={() => setMobilePane(mobilePane === 'study' ? 'tutor' : 'study')}
          />
        </main>
      )}

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  {t('app.createClassModalTitle', 'Create New Class')}
                </h3>
              </div>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalCreateClass} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  placeholder={t('studyCenter.classNamePlaceholder', 'e.g. Anatomy, Histology, Pathology...')}
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder={t('studyCenter.classDescPlaceholder', 'e.g. Head & Neck practical stations...')}
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  {t('studyCenter.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClass || !newClassName.trim()}
                  className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-400 disabled:opacity-50 transition-colors"
                >
                  {isCreatingClass ? t('studyCenter.saving', 'Saving...') : t('app.createClassBtn', 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth & Student Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserName={userName}
        onSaveUserName={handleSaveUserName}
        userEmail={userEmail}
        onSignOut={() => {
          setUserEmail(null);
          try {
            setUserName(localStorage.getItem('ospe_student_name') || 'Guest');
          } catch {
            setUserName('Guest');
          }
        }}
        onSignedIn={(email) => {
          setUserEmail(email);
          setUserName(email?.split('@')[0] || 'Student');
        }}
      />
    </div>
  );
}

export default App;
