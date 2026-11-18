import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useNotebooks, useCreateNotebook, useDeleteNotebook } from '../hooks/useNotebooks';
import { StatusBadge } from '../components/common/StatusBadge';
import { NotebookCard } from '../components/notebooks/NotebookCard';
import { CreateNotebookModal } from '../components/notebooks/CreateNotebookModal';
import { 
  Server, 
  Cpu, 
  Database, 
  BookOpen,
  Plus,
  ArrowRight,
  MessageSquare,
  Sparkles,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  Share2
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: health, isLoading: healthLoading, isError: healthError } = useHealthCheck();
  const { data: notebooks, isLoading: notebooksLoading } = useNotebooks();
  const createMutation = useCreateNotebook();
  const deleteMutation = useDeleteNotebook();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const recentNotebooks = notebooks?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Welcome to StudyNest'}
          </h1>
          <p className="mt-2 text-slate-600 leading-relaxed text-sm">
            {isAuthenticated
              ? 'Organize your course materials, chat with your lecture notes using grounded RAG, and generate flashcards or quizzes instantly.'
              : 'Sign in to create course notebooks, upload lecture PDFs, and generate active recall flashcards.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>New Notebook</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-100"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Document Ingestion</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload PDF and TXT lecture notes with page preservation and vector chunking.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Grounded RAG Chat</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ask deep questions answered strictly from your documents with verified page citations.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Study Tools</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generate structured summaries, 3D flip flashcards, and 4-option practice quizzes.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">MCP Server Ready</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Connect external AI tools like Claude Desktop or Cursor directly to your course notes.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Notebooks Section (When Authenticated) */}
      {isAuthenticated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Recent Notebooks
            </h2>
            <Link
              to="/notebooks"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>View all ({notebooks?.length || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {notebooksLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading notebooks...</div>
          ) : recentNotebooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentNotebooks.map((nb) => (
                <NotebookCard key={nb.id} notebook={nb} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No notebooks created yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create your first notebook to organize course documents and start asking questions.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Notebook</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Core Services & Infrastructure Health */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Core Services &amp; Infrastructure
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Backend Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              {healthLoading ? (
                <StatusBadge status="warning" text="Checking..." />
              ) : healthError ? (
                <StatusBadge status="error" text="Offline" />
              ) : (
                <StatusBadge status="ok" text="Online" />
              )}
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Express Backend &amp; MongoDB</h3>
            <p className="text-xs text-slate-500 mt-1">
              {healthLoading 
                ? 'Connecting to API...' 
                : healthError 
                ? 'Backend not reachable on port 5000' 
                : 'Core application services operational'}
            </p>
          </div>

          {/* Cloudflare AI Provider Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <StatusBadge status="ok" text="Connected" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Cloudflare Workers AI</h3>
            <p className="text-xs text-slate-500 mt-1">
              Chat generation &amp; embeddings engine
            </p>
          </div>

          {/* Qdrant Vector DB Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <StatusBadge status="ready" text="Active" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Qdrant Vector Database</h3>
            <p className="text-xs text-slate-500 mt-1">
              High-speed semantic vector search engine
            </p>
          </div>
        </div>
      </div>

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
