import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useNotebook, useDeleteNotebook } from '../hooks/useNotebooks';
import { useDocuments, useUploadDocument, useDeleteDocument, useRetryDocument } from '../hooks/useDocuments';
import { DocumentItem } from '../components/documents/DocumentItem';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { ChatWorkspace } from '../components/chat/ChatWorkspace';
import { StudyToolsHub } from '../components/study-tools/StudyToolsHub';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  Trash2, 
  Upload, 
  Loader2, 
  AlertCircle,
  Calendar,
  Layers,
  Plus
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

export const NotebookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Queries & Mutations
  const { data: notebook, isLoading: nbLoading, isError: nbError, error: nbErr } = useNotebook(id);
  const deleteNotebookMutation = useDeleteNotebook();

  const { data: documents, isLoading: docsLoading } = useDocuments(id);
  const uploadDocMutation = useUploadDocument(id);
  const deleteDocMutation = useDeleteDocument(id);
  const retryDocMutation = useRetryDocument(id);

  const handleDeleteNotebook = async () => {
    if (window.confirm(`Are you sure you want to delete "${notebook?.title}"? All associated documents will also be removed.`)) {
      try {
        await deleteNotebookMutation.mutateAsync(id);
        navigate('/notebooks');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete notebook');
      }
    }
  };

  const handleUploadDocument = async (file) => {
    await uploadDocMutation.mutateAsync(file);
  };

  const handleDeleteDoc = async (docId, filename) => {
    if (window.confirm(`Delete "${filename}" and all its vector embeddings?`)) {
      try {
        await deleteDocMutation.mutateAsync(docId);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete document');
      }
    }
  };

  const handleRetryDoc = async (docId) => {
    try {
      await retryDocMutation.mutateAsync(docId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry ingestion');
    }
  };

  if (nbLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading notebook...</p>
      </div>
    );
  }

  if (nbError || !notebook) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
        <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Error loading notebook</span>
        </div>
        <p className="text-xs text-rose-600">
          {nbErr?.response?.data?.message || 'Notebook not found or you do not have permission to view it.'}
        </p>
        <Link
          to="/notebooks"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to notebooks</span>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(notebook.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const totalDocs = documents?.length ?? (notebook.documentCount || 0);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/notebooks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notebooks</span>
        </Link>

        <button
          onClick={handleDeleteNotebook}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Notebook</span>
        </button>
      </div>

      {/* Notebook Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{notebook.title}</h1>
                <StatusBadge status="ok" text={`${totalDocs} ${totalDocs === 1 ? 'Document' : 'Documents'}`} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                {notebook.description || 'No description provided for this notebook.'}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formattedDate}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm shadow-indigo-100 shrink-0 self-start"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents ({totalDocs})</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>RAG Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('study-tools')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'study-tools'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Study Tools</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ingested Course Documents
            </h3>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PDF / TXT</span>
            </button>
          </div>

          {docsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-500 mt-2">Loading documents...</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
              {documents.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  onDelete={handleDeleteDoc}
                  onRetry={handleRetryDoc}
                  isDeleting={deleteDocMutation.isPending}
                  isRetrying={retryDocMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-slate-800">No documents uploaded yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                Upload course lecture notes, syllabus materials, or textbook chapters in PDF or TXT format. They will be split into semantic chunks and indexed for RAG chat.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload First Document</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <ChatWorkspace
          notebookId={id}
          notebookTitle={notebook.title}
          documentCount={totalDocs}
        />
      )}

      {activeTab === 'study-tools' && (
        <StudyToolsHub notebookId={id} />
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadDocument}
        isUploading={uploadDocMutation.isPending}
      />
    </div>
  );
};
