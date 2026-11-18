import React, { useState } from 'react';
import { useNotebooks, useCreateNotebook, useDeleteNotebook } from '../hooks/useNotebooks';
import { NotebookCard } from '../components/notebooks/NotebookCard';
import { CreateNotebookModal } from '../components/notebooks/CreateNotebookModal';
import { BookOpen, Plus, Search, Loader2, AlertCircle } from 'lucide-react';

export const NotebooksPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notebooks, isLoading, isError, error } = useNotebooks();
  const createMutation = useCreateNotebook();
  const deleteMutation = useDeleteNotebook();

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? All associated document metadata will also be deleted.`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete notebook');
      }
    }
  };

  const filteredNotebooks = notebooks?.filter((nb) => {
    const q = searchQuery.toLowerCase();
    return nb.title.toLowerCase().includes(q) || nb.description?.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Notebooks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize your course notes, textbooks, and lecture materials.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>New Notebook</span>
        </button>
      </div>

      {/* Search Bar */}
      {notebooks && notebooks.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notebooks by title or topic..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
          />
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-3 font-medium">Loading your study notebooks...</p>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold">Failed to load notebooks</h3>
            <p className="text-xs mt-1 text-rose-600">
              {error.response?.data?.message || error.message || 'Please check if the backend server is running.'}
            </p>
          </div>
        </div>
      ) : filteredNotebooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchQuery ? 'No notebooks match your search' : 'No notebooks created yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            {searchQuery
              ? 'Try searching with a different keyword or clear the search filter.'
              : 'Create your first notebook to start organizing lecture slides, textbook PDFs, and class notes.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Notebook</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotebooks.map((notebook) => (
            <NotebookCard key={notebook.id} notebook={notebook} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
};
