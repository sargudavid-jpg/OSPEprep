import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  FileQuestion,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatMessage, ClassItem, StudyMaterialItem } from '../../types';
import { sendChatMessage } from '../../services/aiEngine';
import { MessageBubble } from './MessageBubble';

interface AiTutorProps {
  activeMaterial?: StudyMaterialItem | null;
  activeClass?: ClassItem | null;
  classMaterials?: StudyMaterialItem[];
}

export const AiTutor: React.FC<AiTutorProps> = ({
  activeMaterial = null,
  activeClass = null,
  classMaterials = [],
}) => {
  const { t, i18n } = useTranslation();

  const currentLangKey = (i18n.language || 'en').slice(0, 2).toLowerCase();
  const languageMap: Record<string, string> = {
    en: 'English',
    ro: 'Romanian',
    hu: 'Hungarian',
  };
  const activeLanguageName = languageMap[currentLangKey] || 'English';

  // Starts completely empty: zero hardcoded messages or initial MCQs
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guardrail: determine whether an active document is currently loaded
  const hasActiveDoc = Boolean(activeMaterial && activeMaterial.file_url);

  // 1. Strict Chat State Isolation: Watch for changes to activeClass and activeMaterial
  // When the user switches to a different class, instantly clear messages for fresh subject window
  useEffect(() => {
    setMessages([]);
    setInputText('');
  }, [activeClass?.id, activeMaterial?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // 2. Class-Level Knowledge Base: Aggregate extracted text across all materials in this class
  const classKnowledgeBase = useMemo(() => {
    const safeMaterials = Array.isArray(classMaterials) ? classMaterials : [];
    if (safeMaterials.length === 0) return '';

    return safeMaterials
      .map((item, idx) => {
        const title = item?.file_name || `Document ${idx + 1}`;
        const text =
          item?.extracted_text?.trim() ||
          `[Document "${title}" is available in the module repository.]`;
        return `### Document ${idx + 1}: ${title}\n${text}`;
      })
      .join('\n\n---\n\n');
  }, [classMaterials]);

  const handleSendMessage = async (textToSend?: string) => {
    if (!hasActiveDoc) return;

    const raw = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!raw || isStreaming) return;

    // 1. Immediately clear the input field
    setInputText('');

    // 2. Immediately append user message to local state
    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sender: 'user',
      text: raw,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Placeholder message for streaming AI response
    const aiMessageId = `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
    setIsStreaming(true);

    // 3. Send request to Gemini AI Engine with document title, class name, Class Knowledge Base, file URL, and active language
    try {
      await sendChatMessage(
        raw,
        activeMaterial?.file_name || undefined,
        activeClass?.name || undefined,
        classKnowledgeBase || undefined,
        activeMaterial?.file_url || undefined,
        activeLanguageName,
        (_chunk, cumulative) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMessageId ? { ...m, text: cumulative } : m))
          );
        }
      );
    } catch (err: unknown) {
      console.error('Gemini AI engine error:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Failed to communicate with Google Gemini API. Please check your internet connection or API key.';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                text: `⚠️ **AI Notice:** ${errMsg}\n\n> Please verify your API key and connection in \`.env.local\`.`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const activeDocName = activeMaterial?.file_name;
  const activeClassName = activeClass?.name;
  const indexedDocsCount = Array.isArray(classMaterials) ? classMaterials.length : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-2 sm:p-3 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {t('tutor.title', 'Study Partner')}
            </span>
          </div>

          {activeClassName && (
            <span className="text-[11px] font-semibold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 rounded-lg truncate shrink-0">
              {activeClassName}
            </span>
          )}

          {indexedDocsCount > 0 && (
            <span
              className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1"
              title="Class Knowledge Base active: all module documents are indexed"
            >
              <BookOpen className="w-3 h-3 text-teal-400" />
              <span>
                {indexedDocsCount === 1
                  ? t('tutor.moduleDocsSingular', { count: indexedDocsCount, defaultValue: `${indexedDocsCount} module doc` })
                  : t('tutor.moduleDocsPlural', { count: indexedDocsCount, defaultValue: `${indexedDocsCount} module docs` })}
              </span>
            </span>
          )}

          {activeDocName && (
            <span className="text-[11px] font-medium text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg truncate max-w-[130px] sm:max-w-xs shrink-0">
              {t('tutor.focusPrefix', 'Focus:')} {activeDocName}
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
            title={t('tutor.resetChat', 'Reset Chat Session')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Stream or Blank Slate */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            {hasActiveDoc ? (
              <>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-2">
                  <Bot className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  {t('tutor.readyTitle', { name: activeDocName, defaultValue: `Ready to study "${activeDocName}"` })}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  {indexedDocsCount > 1
                    ? t('tutor.readyDescMulti', {
                        count: indexedDocsCount,
                        className: activeClassName || '',
                        defaultValue: `I have indexed all ${indexedDocsCount} documents in this ${activeClassName || 'class'} module. Click "📖 Teach me the basics" for a foundational breakdown, or drill with MCQs!`,
                      })
                    : t('tutor.readyDescSingle', 'Click "📖 Teach me the basics" for a foundational breakdown, or test yourself with MCQs and written questions!')}
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 flex items-center justify-center mb-2">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-400">
                  {t('tutor.noDocTitle', 'No Document Selected')}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  {t(
                    'tutor.noDocDesc',
                    'Select or upload a study document in the Study Center on the left to start our study session.'
                  )}
                </p>
              </>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            if (!msg) return null;
            return <MessageBubble key={msg.id} message={msg} />;
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Action Pills (Visually disabled when no active document) */}
      <div className="py-2 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* 1. Teach me the basics (First-Time Learning) */}
          <button
            disabled={!hasActiveDoc || isStreaming}
            onClick={() =>
              handleSendMessage(
                t(
                  'tutor.pillTeachBasicsPrompt',
                  'I am reading this document for the first time. Please guide me through the basic concepts step-by-step.'
                )
              )
            }
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 border ${
              !hasActiveDoc
                ? 'opacity-40 cursor-not-allowed bg-slate-900/40 text-slate-500 border-slate-800/60'
                : 'bg-slate-900 border-slate-800 text-teal-300 hover:text-white hover:border-teal-500/50 hover:bg-slate-800 cursor-pointer shadow-sm'
            }`}
            title={hasActiveDoc ? 'Guided Reading: Learn foundational concepts step-by-step' : 'Select a document first'}
          >
            <span>{t('tutor.pillTeachBasics', '📖 Teach me the basics')}</span>
          </button>

          {/* 2. Give me MCQs */}
          <button
            disabled={!hasActiveDoc || isStreaming}
            onClick={() =>
              handleSendMessage(
                t('tutor.pillMcqPrompt', 'Give me 2 Multiple Choice Questions (MCQs) testing this document.')
              )
            }
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 border ${
              !hasActiveDoc
                ? 'opacity-40 cursor-not-allowed bg-slate-900/40 text-slate-500 border-slate-800/60'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-teal-500/50 hover:bg-slate-800 cursor-pointer shadow-sm'
            }`}
            title={hasActiveDoc ? 'Generate MCQs for active document' : 'Select a document first'}
          >
            <span>{t('tutor.pillMcq', '🎯 Give me MCQs')}</span>
          </button>

          <button
            disabled={!hasActiveDoc || isStreaming}
            onClick={() =>
              handleSendMessage(
                t(
                  'tutor.pillWrittenPrompt',
                  'Switch to written questions. Give me an OSPE station question with marks breakdown.'
                )
              )
            }
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 border ${
              !hasActiveDoc
                ? 'opacity-40 cursor-not-allowed bg-slate-900/40 text-slate-500 border-slate-800/60'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 cursor-pointer shadow-sm'
            }`}
            title={hasActiveDoc ? 'Generate written station question' : 'Select a document first'}
          >
            <span>{t('tutor.pillWritten', '📝 Switch to written')}</span>
          </button>

          <button
            disabled={!hasActiveDoc || isStreaming}
            onClick={() =>
              handleSendMessage(
                t(
                  'tutor.pillExplainPrompt',
                  'Walk me through the key landmarks and high-yield concepts in this document.'
                )
              )
            }
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 border ${
              !hasActiveDoc
                ? 'opacity-40 cursor-not-allowed bg-slate-900/40 text-slate-500 border-slate-800/60'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-800 cursor-pointer shadow-sm'
            }`}
            title={hasActiveDoc ? 'Explain key landmarks and concepts' : 'Select a document first'}
          >
            <span>{t('tutor.pillExplain', '🔍 Explain document')}</span>
          </button>
        </div>
      </div>

      {/* Bottom Input Field (Disabled with specific placeholder when no document is active) */}
      <div className="shrink-0 pt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && hasActiveDoc) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!hasActiveDoc || isStreaming}
            placeholder={
              !hasActiveDoc
                ? t('tutor.placeholderEmpty', 'Select or upload a document to start studying...')
                : t('tutor.placeholderActive', {
                    name: activeDocName,
                    defaultValue: `Ask about "${activeDocName}", or click 'Give me MCQs'..."`,
                  })
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-4 pr-12 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-950/80"
          />

          <button
            type="submit"
            disabled={!hasActiveDoc || !inputText.trim() || isStreaming}
            className="absolute right-2 p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-950 cursor-pointer"
            title={
              hasActiveDoc
                ? t('tutor.sendBtn', 'Send prompt to study partner')
                : t('tutor.placeholderEmpty', 'Select or upload a document to start studying...')
            }
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
