import React from 'react';
import { FileText, Trash2, RefreshCw, AlertTriangle, Layers, Clock } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const DocumentItem = ({ document, onDelete, onRetry, isDeleting, isRetrying }) => {
  const isPdf = document.mimeType === 'application/pdf' || document.originalFilename.endsWith('.pdf');
  const sizeKb = (document.fileSize / 1024).toFixed(1);
  const sizeMb = (document.fileSize / (1024 * 1024)).toFixed(2);
  const displaySize = document.fileSize > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

  const formattedDate = new Date(document.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isPdf ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
        }`}>
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 truncate" title={document.originalFilename}>
              {document.originalFilename}
            </h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
              {isPdf ? 'PDF' : 'TXT'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
            <span>{displaySize}</span>
            <span>&bull;</span>
            <span>{document.pageCount || 1} {document.pageCount === 1 ? 'page' : 'pages'}</span>
            {document.chunkCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <Layers className="w-3 h-3" />
                  <span>{document.chunkCount} chunks</span>
                </span>
              </>
            )}
            <span>&bull;</span>
            <span>{formattedDate}</span>
          </div>

          {document.status === 'failed' && document.processingError && (
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{document.processingError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {document.status === 'processing' || document.status === 'uploaded' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Indexing...</span>
            </span>
          ) : (
            <StatusBadge status={document.status} text={document.status} />
          )}
        </div>

        <div className="flex items-center gap-1">
          {document.status === 'failed' && (
            <button
              onClick={() => onRetry(document.id)}
              disabled={isRetrying}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              title="Retry Ingestion"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={() => onDelete(document.id, document.originalFilename)}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

