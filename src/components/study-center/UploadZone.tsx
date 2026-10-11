import React, { useRef, useState } from 'react';
import { Cloud, FileText, FileUp, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { uploadStudyMaterial } from '../../services/baas';
import { extractTextFromFile } from '../../services/textExtractor';
import { ClassItem, StudyMaterialItem } from '../../types';

interface UploadZoneProps {
  classes?: ClassItem[];
  activeClassId?: string | null;
  onMaterialUploaded: (material: StudyMaterialItem) => void;
  onClose?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  classes = [],
  activeClassId = null,
  onMaterialUploaded,
  onClose,
}) => {
  const { t } = useTranslation();
  const safeClasses = Array.isArray(classes) ? classes : [];
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return activeClassId || (safeClasses?.[0]?.id ?? '');
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState(() =>
    t('upload.uploading', 'Uploading to Supabase Storage...')
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target?.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg(t('upload.selectFileError', 'Please select a file to upload.'));
      return;
    }

    const classIdToUse = selectedClassId || safeClasses?.[0]?.id;
    if (!classIdToUse) {
      setErrorMsg(t('upload.selectClassError', 'Please create or select a Module / Class before uploading.'));
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      setUploadStatusText(t('upload.extractingText', 'Extracting document text...'));

      // 1. Extract raw text from uploaded file (PDF / text)
      const extractedText = await extractTextFromFile(selectedFile);

      setUploadStatusText(t('upload.uploading', 'Uploading to Supabase Storage...'));
      // 2. Uploads binary to Storage bucket and saves extracted_text in study_materials table
      const uploadedItem = await uploadStudyMaterial(selectedFile, classIdToUse, extractedText);
      if (uploadedItem) {
        onMaterialUploaded?.(uploadedItem);
      }
      if (onClose) onClose();
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Upload failed. Check Supabase storage bucket permissions.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const hasClasses = safeClasses.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t('upload.title', 'Upload Study Material')}</h3>
            <p className="text-[11px] text-slate-400">
              {t('upload.subTitle', "Stores directly in Supabase Storage bucket 'study-materials'")}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleUpload} className="mt-4 space-y-4">
        {/* Dynamic Module / Class Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{t('upload.moduleClassLabel', 'Module / Class')}</span>
            {!hasClasses && (
              <span className="text-amber-400 font-semibold normal-case text-[11px]">
                {t('upload.noClassesWarning', '⚠️ No classes exist. Create a class first.')}
              </span>
            )}
          </label>
          <select
            value={selectedClassId || ''}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setErrorMsg(null);
            }}
            disabled={!hasClasses}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-teal-500 font-medium disabled:opacity-50"
            required
          >
            {!hasClasses ? (
              <option value="">{t('upload.noClassesOption', "No classes found. Use '+ Add Class' first.")}</option>
            ) : (
              safeClasses.map((cls) => {
                if (!cls || !cls.id) return null;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name || 'Class'} {cls.description ? `— ${cls.description}` : ''}
                  </option>
                );
              })
            )}
          </select>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            isDragging
              ? 'border-teal-400 bg-teal-950/30 ring-4 ring-teal-500/20'
              : selectedFile
              ? 'border-teal-500/60 bg-teal-950/10'
              : 'border-slate-700 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {selectedFile.type?.includes('image') ? (
                  <ImageIcon className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block max-w-xs truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'File'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center mb-2">
                <FileUp className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {t('upload.dragDropPrompt', 'Drag & drop file here, or')}{' '}
                <span className="text-teal-400 underline">{t('upload.browse', 'browse')}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {t('upload.supportedFormats', 'Uploads directly to Supabase Storage: PDFs, Word, PowerPoint, Slides, Images')}
              </p>
            </>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 px-3 py-1.5 rounded-lg">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {t('studyCenter.cancel', 'Cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading || !selectedFile || !hasClasses}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-lg shadow-teal-950/50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadStatusText}</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>{t('upload.uploadBtn', 'Upload to Cloud Library')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
