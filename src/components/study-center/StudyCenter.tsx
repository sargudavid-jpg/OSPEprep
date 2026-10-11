import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClassItem, StudyMaterialItem } from '../../types';
import { UniversalDocumentViewer } from './UniversalDocumentViewer';
import { UploadZone } from './UploadZone';

interface StudyCenterProps {
  classes?: ClassItem[];
  activeClassId?: string | null;
  onSelectClass?: (id: string) => void;
  onCreateClass?: (name: string, description?: string) => Promise<void>;
  materials?: StudyMaterialItem[];
  activeMaterial?: StudyMaterialItem | null;
  onSelectMaterial?: (material: StudyMaterialItem) => void;
  onMaterialUploaded?: (material: StudyMaterialItem) => void;
  onDeleteMaterial?: (id: string, fileUrl: string) => void;
}

export const StudyCenter: React.FC<StudyCenterProps> = ({
  classes = [],
  activeClassId = null,
  onSelectClass,
  onCreateClass,
  materials = [],
  activeMaterial = null,
  onSelectMaterial,
  onMaterialUploaded,
  onDeleteMaterial,
}) => {
  const { t } = useTranslation();
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  const activeClass = safeClasses.find((c) => c?.id === activeClassId);

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !onCreateClass) return;
    try {
      setIsCreatingClass(true);
      await onCreateClass(newClassName.trim(), newClassDesc.trim() || undefined);
      setNewClassName('');
      setNewClassDesc('');
      setIsAddClassOpen(false);
    } catch (err) {
      console.error('Error creating class:', err);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const hasClasses = safeClasses.length > 0;
  const hasMaterials = safeMaterials.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-2 sm:p-3 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {t('studyCenter.title', 'Study Center')}
            </span>
          </div>

          {/* Class Selector Dropdown */}
          {hasClasses ? (
            <div className="relative">
              <select
                value={activeClassId || ''}
                onChange={(e) => onSelectClass?.(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none focus:border-teal-500 max-w-[140px] sm:max-w-[200px] truncate"
              >
                {safeClasses.map((cls) => {
                  if (!cls || !cls.id) return null;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name || 'Untitled Class'}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">
              {t('nav.noClassesYet', 'No classes yet')}
            </span>
          )}

          <button
            onClick={() => setIsAddClassOpen(true)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-slate-800 transition-colors"
            title={t('studyCenter.createNewClass', 'Create New Class')}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Button: Upload */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            disabled={!hasClasses}
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shadow-sm"
            title={t('studyCenter.uploadBtn', 'Upload')}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('studyCenter.uploadBtn', 'Upload')}</span>
          </button>
        </div>
      </div>

      {/* Add Class Inline Modal */}
      {isAddClassOpen && (
        <div className="mb-2 p-3 bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in">
          <form onSubmit={handleCreateClassSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">
                {t('studyCenter.createNewClass', 'Create New Class')}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddClassOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={t('studyCenter.classNamePlaceholder', 'Class Name (e.g. Anatomy, Histology)')}
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
                required
              />
              <input
                type="text"
                placeholder={t('studyCenter.classDescPlaceholder', 'Description (optional)')}
                value={newClassDesc}
                onChange={(e) => setNewClassDesc(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddClassOpen(false)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                {t('studyCenter.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isCreatingClass || !newClassName.trim()}
                className="px-3 py-1 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-400 disabled:opacity-50"
              >
                {isCreatingClass ? t('studyCenter.saving', 'Saving...') : t('studyCenter.saveClass', 'Add Class')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Zone */}
      {isUploadOpen && (
        <div className="mb-2 shrink-0 animate-in fade-in slide-in-from-top-2">
          <UploadZone
            classes={safeClasses}
            activeClassId={activeClassId}
            onMaterialUploaded={(mat) => {
              onMaterialUploaded?.(mat);
              setIsUploadOpen(false);
            }}
            onClose={() => setIsUploadOpen(false)}
          />
        </div>
      )}

      {/* Materials List Pills */}
      {hasMaterials && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-1 shrink-0">
          {safeMaterials.map((m) => {
            if (!m || !m.id) return null;
            const isSelected = activeMaterial?.id === m.id;
            const fileName = m.file_name || 'Document';
            return (
              <div
                key={m.id}
                onClick={() => onSelectMaterial?.(m)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-teal-950/60 border-teal-500/80 text-teal-200 ring-1 ring-teal-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {fileName.toLowerCase().endsWith('.pdf') ? (
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                )}
                <span className="truncate max-w-[140px]">{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('studyCenter.deleteConfirm', { fileName, defaultValue: `Delete ${fileName}?` }))) {
                      onDeleteMaterial?.(m.id, m.file_url || '');
                    }
                  }}
                  className="p-0.5 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  title="Delete file"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Document Viewer or Empty States */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!hasClasses ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">
              {t('studyCenter.noClassesTitle', 'No Classes Found')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {t('studyCenter.noClassesDesc', 'Your workspace is connected and ready. Click below to create your first class.')}
            </p>
            <button
              onClick={() => setIsAddClassOpen(true)}
              className="px-4 py-2 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-teal-400 transition-colors flex items-center gap-1.5 shadow-md shadow-teal-950"
            >
              <Plus className="w-4 h-4" />
              <span>{t('studyCenter.createFirstClass', 'Create First Class')}</span>
            </button>
          </div>
        ) : !hasMaterials ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <Upload className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">
              {t('studyCenter.noMaterialsTitle', {
                className: activeClass?.name || 'Selected Class',
                defaultValue: `No Materials Uploaded in "${activeClass?.name || 'Selected Class'}"`,
              })}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {t('studyCenter.noMaterialsDesc', 'Upload your first study PDF or anatomical/histological slide to Supabase Storage.')}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-teal-400 transition-colors flex items-center gap-1.5 shadow-md shadow-teal-950"
            >
              <Upload className="w-4 h-4" />
              <span>{t('studyCenter.uploadFirstMaterial', 'Upload Study Material')}</span>
            </button>
          </div>
        ) : !activeMaterial ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">
              {t('studyCenter.noDocSelectedTitle', 'No Document Selected')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {t('studyCenter.noDocSelectedDesc', 'Select or upload a document to begin studying.')}
            </p>
          </div>
        ) : (
          <UniversalDocumentViewer material={activeMaterial} />
        )}
      </div>
    </div>
  );
};
