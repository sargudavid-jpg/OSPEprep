import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start items-start gap-2.5'} animate-in fade-in`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-teal-950 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 mt-0.5 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-tr-xs'
            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs'
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-teal-300">Study Partner</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md font-medium">
                AI Peer
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">{message.timestamp}</span>
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text || ''}</p>
        ) : message.text ? (
          <div className="prose-container space-y-1.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-sm font-extrabold text-teal-300 mt-2 mb-1.5 border-b border-slate-800 pb-1">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xs font-bold text-teal-200 mt-2 mb-1 flex items-center gap-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-semibold text-cyan-300 mt-1.5 mb-0.5">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-xs text-slate-200 leading-relaxed mb-1.5 last:mb-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-1.5 ml-4 list-disc space-y-1 text-xs text-slate-200">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-1.5 ml-4 list-decimal space-y-1 text-xs text-slate-200">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-0.5">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white bg-slate-800/50 px-1 py-0.2 rounded">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-teal-200">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-2 border-teal-400 bg-teal-950/40 pl-3 py-1.5 pr-2 rounded-r-xl text-teal-100 text-xs italic">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-teal-300 mb-0.5 not-italic">
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      <span>Key Takeaway</span>
                    </div>
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ..._props }) => {
                  const isInline = !className && typeof children === 'string' && !children.includes('\n');
                  if (isInline) {
                    return (
                      <code className="bg-slate-950 text-teal-300 px-1 py-0.5 rounded text-[11px] font-mono border border-slate-800">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="my-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono text-teal-300">
                      <code>{children}</code>
                    </pre>
                  );
                },
                table: ({ children }) => (
                  <div className="my-2 overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-800/80 text-teal-300 font-bold border-b border-slate-700">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-slate-800/30 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-2.5 py-1.5 font-semibold text-[11px] text-teal-300">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-2.5 py-1.5 text-[11px] text-slate-300">{children}</td>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-teal-300 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
            <span className="text-xs text-slate-400">
              Formulating study drill...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
