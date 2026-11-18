import React, { useState } from 'react';
import { useFlashcardSets, useGenerateFlashcards, useDeleteFlashcardSet } from '../../hooks/useStudyTools';
import { useQuizzes, useGenerateQuiz, useDeleteQuiz } from '../../hooks/useStudyTools';
import { useDocuments } from '../../hooks/useDocuments';
import { getDocumentSummary } from '../../services/studyTools.api';
import { FlashcardPlayer } from './FlashcardPlayer';
import { QuizPlayer } from './QuizPlayer';
import { SummaryViewer } from './SummaryViewer';
import { 
  Layers, 
  CheckSquare, 
  FileText, 
  Plus, 
  Trash2, 
  Play, 
  Loader2, 
  Sparkles,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';

export const StudyToolsHub = ({ notebookId }) => {
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'quizzes' | 'summaries'
  
  // Selected players
  const [activeFlashcardSet, setActiveFlashcardSet] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);

  // Summary state
  const [selectedDocId, setSelectedDocId] = useState('');
  const [activeSummary, setActiveSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryRegenerating, setSummaryRegenerating] = useState(false);

  // Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [targetType, setTargetType] = useState('flashcards'); // 'flashcards' | 'quiz'
  const [itemCount, setItemCount] = useState(5);
  const [selectedTargetDoc, setSelectedTargetDoc] = useState('');

  // Queries & Mutations
  const { data: documents } = useDocuments(notebookId);
  const { data: flashcardSets, isLoading: flashcardsLoading } = useFlashcardSets(notebookId);
  const generateFlashcardsMutation = useGenerateFlashcards(notebookId);
  const deleteFlashcardMutation = useDeleteFlashcardSet(notebookId);

  const { data: quizzes, isLoading: quizzesLoading } = useQuizzes(notebookId);
  const generateQuizMutation = useGenerateQuiz(notebookId);
  const deleteQuizMutation = useDeleteQuiz(notebookId);

  // Handle Load Summary for Document
  const handleLoadSummary = async (docId, force = false) => {
    if (!docId) return;
    try {
      if (force) setSummaryRegenerating(true);
      else setSummaryLoading(true);

      const summary = await getDocumentSummary(docId, force);
      setActiveSummary(summary);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to load summary');
    } finally {
      setSummaryLoading(false);
      setSummaryRegenerating(false);
    }
  };

  const handleOpenGenerateModal = (type) => {
    setTargetType(type);
    setItemCount(type === 'flashcards' ? 6 : 5);
    setIsGenerateModalOpen(true);
  };

  const handleExecuteGenerate = async (e) => {
    e.preventDefault();
    try {
      if (targetType === 'flashcards') {
        const newSet = await generateFlashcardsMutation.mutateAsync({
          count: itemCount,
          documentId: selectedTargetDoc || undefined,
        });
        setIsGenerateModalOpen(false);
        setActiveFlashcardSet(newSet);
      } else {
        const newQuiz = await generateQuizMutation.mutateAsync({
          count: itemCount,
          documentId: selectedTargetDoc || undefined,
        });
        setIsGenerateModalOpen(false);
        setActiveQuiz(newQuiz);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Generation failed');
    }
  };

  const isGenerating = generateFlashcardsMutation.isPending || generateQuizMutation.isPending;

  // Render Flashcard Player view
  if (activeFlashcardSet) {
    return <FlashcardPlayer flashcardSet={activeFlashcardSet} onBack={() => setActiveFlashcardSet(null)} />;
  }

  // Render Quiz Player view
  if (activeQuiz) {
    return <QuizPlayer quiz={activeQuiz} onBack={() => setActiveQuiz(null)} />;
  }

  const readyDocs = documents?.filter((d) => d.status === 'ready') || [];

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flashcards ({flashcardSets?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'quizzes'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Quizzes ({quizzes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('summaries')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'summaries'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Summaries</span>
          </button>
        </div>

        {activeTab !== 'summaries' && (
          <button
            onClick={() => handleOpenGenerateModal(activeTab === 'flashcards' ? 'flashcards' : 'quiz')}
            disabled={readyDocs.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm shadow-indigo-100"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate {activeTab === 'flashcards' ? 'Flashcards' : 'Quiz'}</span>
          </button>
        )}
      </div>

      {readyDocs.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <span>Upload and index study documents in the <strong>Documents</strong> tab to generate grounded flashcards, quizzes, and summaries.</span>
        </div>
      )}

      {/* 1. Flashcards View */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          {flashcardsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400 mt-2">Loading flashcard decks...</p>
            </div>
          ) : flashcardSets && flashcardSets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcardSets.map((set) => (
                <div
                  key={set._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <button
                        onClick={() => deleteFlashcardMutation.mutate(set._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{set.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{set.cards.length} Active Recall Cards</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(set.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setActiveFlashcardSet(set)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Study Deck</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Flashcard Decks Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Generate concept decks from your lecture notes with one click.
              </p>
              {readyDocs.length > 0 && (
                <button
                  onClick={() => handleOpenGenerateModal('flashcards')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate First Deck</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Quizzes View */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {quizzesLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400 mt-2">Loading quizzes...</p>
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <button
                        onClick={() => deleteQuizMutation.mutate(quiz._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{quiz.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{quiz.questions.length} Multiple Choice Questions</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setActiveQuiz(quiz)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Take Quiz</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Quizzes Created Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Test your mastery with 4-option MCQs generated from your documents.
              </p>
              {readyDocs.length > 0 && (
                <button
                  onClick={() => handleOpenGenerateModal('quiz')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate First Quiz</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Document Summaries View */}
      {activeTab === 'summaries' && (
        <div className="space-y-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 sm:flex-initial">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Select Document to Summarize
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    handleLoadSummary(e.target.value);
                  }}
                  className="mt-1 px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
                >
                  <option value="">-- Choose a ready document --</option>
                  {readyDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.originalFilename} ({d.pageCount || 1} pages)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDocId && (
              <button
                onClick={() => handleLoadSummary(selectedDocId, true)}
                disabled={summaryLoading || summaryRegenerating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
              >
                {summaryRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Regenerate Summary</span>
              </button>
            )}
          </div>

          {selectedDocId ? (
            <SummaryViewer
              summary={activeSummary}
              isLoading={summaryLoading}
              onRegenerate={() => handleLoadSummary(selectedDocId, true)}
              isRegenerating={summaryRegenerating}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-700">Select a document above</h4>
              <p className="text-xs text-slate-400 mt-1">
                Choose any uploaded PDF or text file to synthesize an executive overview and key takeaways.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Generate Material Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Generate {targetType === 'flashcards' ? 'Active Recall Flashcards' : 'Multiple Choice Quiz'}
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isGenerating}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteGenerate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scope Source Material
                </label>
                <select
                  value={selectedTargetDoc}
                  onChange={(e) => setSelectedTargetDoc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                >
                  <option value="">Entire Notebook (All ready documents)</option>
                  {readyDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.originalFilename}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Number of {targetType === 'flashcards' ? 'Cards' : 'Questions'}: {itemCount}
                </label>
                <input
                  type="range"
                  min={3}
                  max={targetType === 'flashcards' ? 10 : 8}
                  value={itemCount}
                  onChange={(e) => setItemCount(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>3 items (Quick)</span>
                  <span>{targetType === 'flashcards' ? '10 cards' : '8 questions'} (Deep)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  disabled={isGenerating}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isGenerating ? 'Synthesizing with AI...' : 'Generate Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

