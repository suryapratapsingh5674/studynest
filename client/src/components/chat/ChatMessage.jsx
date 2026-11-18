import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Sparkles, User, Bookmark } from 'lucide-react';

export const ChatMessage = ({ message, onCitationClick }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-4 sm:py-5 flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-100 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-4 sm:p-5 ${
        isUser
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-white border border-slate-200/80 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${
            isUser ? 'text-indigo-200' : 'text-slate-400'
          }`}>
            {isUser ? 'You' : 'StudyNest AI'}
          </span>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className={`prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed ${
          isUser 
            ? 'text-white prose-headings:text-white prose-strong:text-white prose-p:text-white' 
            : 'text-slate-700 prose-headings:text-slate-900 prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5'
        }`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Citation Badges (Assistant only) */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Sources &amp; Citations ({message.citations.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, idx) => (
                <button
                  key={idx}
                  onClick={() => onCitationClick(citation)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-medium transition-colors"
                >
                  <Bookmark className="w-3 h-3 text-indigo-600" />
                  <span className="truncate max-w-[140px]">{citation.filename}</span>
                  <span className="px-1 py-0.2 rounded bg-indigo-200/60 text-[10px] font-semibold">
                    p. {citation.pageNumber || 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

