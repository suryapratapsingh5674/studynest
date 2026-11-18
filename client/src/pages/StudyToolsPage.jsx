import React, { useState } from 'react';
import { useNotebooks } from '../hooks/useNotebooks';
import { StudyToolsHub } from '../components/study-tools/StudyToolsHub';
import { Sparkles, BookOpen, Layers, CheckSquare, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudyToolsPage = () => {
  const { data: notebooks, isLoading } = useNotebooks();
  const [selectedNotebookId, setSelectedNotebookId] = useState('');

  const selectedNotebook = notebooks?.find((n) => n.id === selectedNotebookId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Study Tools</h1>
          <p className="text-sm text-slate-500 mt-1">
            Active recall flashcard decks, practice quizzes, and executive document summaries.
          </p>
        </div>

        {/* Notebook Selector */}
        {notebooks && notebooks.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Active Notebook:
            </label>
            <select
              value={selectedNotebookId}
              onChange={(e) => setSelectedNotebookId(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 shadow-2xs"
            >
              <option value="">-- Choose a Notebook --</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.title} ({nb.documentCount || 0} docs)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {selectedNotebookId ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{selectedNotebook?.title}</h3>
                <p className="text-xs text-slate-400">{selectedNotebook?.documentCount || 0} Documents available for generation</p>
              </div>
            </div>
            <Link
              to={`/notebooks/${selectedNotebookId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
            >
              <span>View Notebook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <StudyToolsHub notebookId={selectedNotebookId} />
        </div>
      ) : (
        /* Overview Cards when no notebook is selected */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm shadow-indigo-100">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Active Recall Flashcards</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Synthesize question-and-answer concept cards from your course materials. Study with our 3D interactive flip player.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm shadow-emerald-100">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Multiple Choice Quizzes</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Test your mastery with 4-option MCQs featuring verified answer keys, detailed explanations, and instant score tracking.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm shadow-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Document Summaries</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Generate executive summaries and bulleted core takeaways for lengthy chapters. Cached in MongoDB to conserve quota.
                </p>
              </div>
            </div>
          </div>

          {notebooks && notebooks.length > 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-lg mx-auto shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Select a notebook to begin studying</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Choose one of your notebooks from the selector above, or jump into your recent notebook directly:
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {notebooks.slice(0, 3).map((nb) => (
                  <button
                    key={nb.id}
                    onClick={() => setSelectedNotebookId(nb.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
                  >
                    {nb.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center max-w-md mx-auto">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No notebooks available</h4>
              <p className="text-xs text-slate-400 mt-1">Create a notebook and upload study documents to unlock AI study tools.</p>
              <Link
                to="/notebooks"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
              >
                Go to Notebooks
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
