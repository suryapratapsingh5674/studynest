import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, CheckCircle2, RotateCw, Loader2 } from 'lucide-react';

export const SummaryViewer = ({ summary, isLoading, onRegenerate, isRegenerating }) => {
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Synthesizing document summary with Llama 3.2...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title & Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{summary.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI synthesized from course text &bull; Saved to your notebook
          </p>
        </div>

        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600 transition-colors disabled:opacity-50"
          title="Regenerate summary"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
        </button>
      </div>

      {/* Key Takeaways Cards */}
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Core Takeaways</span>
          </h4>
          <ul className="space-y-2 text-xs text-indigo-950">
            {summary.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content Markdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold prose-p:my-3">
          <ReactMarkdown>{summary.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

