import React, { useRef, useState } from 'react';
import {
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Minimize2,
  Presentation,
  RotateCcw,
  Sliders,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StudyMaterialItem } from '../../types';

interface UniversalDocumentViewerProps {
  material?: StudyMaterialItem | null;
}

export const UniversalDocumentViewer: React.FC<UniversalDocumentViewerProps> = ({
  material = null,
}) => {
  const { t } = useTranslation();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [invertContrast, setInvertContrast] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Strict empty state check if material is null or has no valid URL
  if (!material || !material?.file_url) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
        <FileText className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">
          {t('viewer.noDocSelectedTitle', 'No Document Selected')}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {t('viewer.noDocSelectedDesc', 'Select or upload a document to begin studying.')}
        </p>
      </div>
    );
  }

  const fileName = material?.file_name || 'Document';
  const fileUrl = material?.file_url || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const isPdf =
    ext === 'pdf' ||
    fileName.toLowerCase().endsWith('.pdf') ||
    fileUrl.toLowerCase().includes('.pdf');

  const isWord = ['docx', 'doc'].includes(ext);
  const isPowerPoint = ['pptx', 'ppt'].includes(ext);
  const isExcel = ['xlsx', 'xls'].includes(ext);
  const isOfficeDoc = isWord || isPowerPoint || isExcel;

  const isImage =
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) ||
    (!isPdf && !isOfficeDoc);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1 || isPdf || isOfficeDoc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Floating Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Document Name Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg shadow-black/40 text-xs">
          {isWord && <FileText className="w-4 h-4 text-blue-400 shrink-0" />}
          {isPowerPoint && <Presentation className="w-4 h-4 text-amber-400 shrink-0" />}
          {isExcel && <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />}
          {isPdf && <FileText className="w-4 h-4 text-rose-400 shrink-0" />}

          <span className="font-medium text-slate-200 truncate max-w-[180px] sm:max-w-[320px]">
            {fileName}
          </span>

          {fileUrl && (
            <a
              href={isOfficeDoc ? officeViewerUrl : fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-teal-300 ml-1"
              title={isOfficeDoc ? 'Open in Office Web Viewer in new window' : 'Open live URL in new window'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Right: Zoom & Tool Actions */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg shadow-black/40">
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('viewer.zoomOut', 'Zoom Out')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 px-1 min-w-[42px] text-center font-semibold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('viewer.zoomIn', 'Zoom In')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('viewer.resetZoom', 'Reset Zoom (100%)')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-0.5" />

              {/* Contrast Invert */}
              <button
                onClick={() => setInvertContrast(!invertContrast)}
                className={`p-1.5 rounded-lg transition-colors ${
                  invertContrast ? 'text-amber-300 bg-amber-950/50' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={t('viewer.invertStain', 'Invert / High Contrast Stain')}
              >
                <Sliders className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? t('viewer.exitFullscreen', 'Exit Fullscreen') : t('viewer.fullscreen', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Specimen Display Surface */}
      <div
        className={`flex-1 relative overflow-hidden flex items-center justify-center cursor-${
          zoomLevel > 1 && isImage ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isOfficeDoc ? (
          /* Microsoft Office Web Viewer (Word .docx, PowerPoint .pptx, Excel .xlsx) */
          <div className="w-full h-full pt-14 pb-2 px-2 flex flex-col">
            <iframe
              src={officeViewerUrl}
              className="w-full h-full rounded-xl border border-slate-800 bg-slate-900 shadow-inner"
              title={fileName}
              allowFullScreen
            />
          </div>
        ) : isPdf ? (
          /* PDF Viewer */
          <div className="w-full h-full pt-14 pb-2 px-2 flex flex-col">
            <object
              data={`${fileUrl}#toolbar=1&navpanes=0`}
              type="application/pdf"
              className="w-full h-full rounded-xl border border-slate-800 bg-slate-900"
            >
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="w-12 h-12 text-teal-400 mb-3" />
                <h4 className="text-sm font-bold text-white">{t('viewer.pdfDoc', 'PDF Document')}</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {t('viewer.pdfDocDesc', 'Click below to open this PDF document in a dedicated browser tab:')}
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 bg-teal-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-teal-400 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('viewer.openPdfBtn', 'Open PDF Document')}</span>
                </a>
              </div>
            </object>
          </div>
        ) : (
          /* Image Surface directly from live Supabase URL */
          <div
            className="relative transition-transform duration-75 flex items-center justify-center w-full h-full p-4"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              filter: invertContrast ? 'invert(1) hue-rotate(180deg)' : 'none',
            }}
          >
            {fileUrl ? (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain pointer-events-none rounded-lg shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="bg-slate-900/80 border-t border-slate-800/80 px-4 py-2 text-xs flex items-center justify-between gap-3 shrink-0">
        <span className="text-slate-300 font-mono text-[11px] truncate">
          {fileUrl}
        </span>
        <span className="text-[10px] text-teal-400 shrink-0 font-mono">
          {isOfficeDoc ? t('viewer.officeViewerNote', 'Microsoft Office Web Viewer') : t('viewer.storageNote', 'Supabase Storage')}
        </span>
      </div>
    </div>
  );
};
