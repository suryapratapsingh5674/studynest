import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Trash2, ArrowUpRight } from 'lucide-react';

export const NotebookCard = ({ notebook, onDelete }) => {
  const formattedDate = new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all hover:border-slate-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <button
            onClick={() => onDelete(notebook.id, notebook.title)}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete notebook"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <Link to={`/notebooks/${notebook.id}`} className="block group-hover:text-indigo-600 transition-colors">
          <h3 className="font-semibold text-slate-900 text-base line-clamp-1">{notebook.title}</h3>
        </Link>
        
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
          {notebook.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>{notebook.documentCount || 0} docs</span>
        </span>

        <span className="text-[11px] text-slate-400">{formattedDate}</span>
      </div>
    </div>
  );
};

