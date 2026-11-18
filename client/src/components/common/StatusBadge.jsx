import React from 'react';

export const StatusBadge = ({ status, text }) => {
  const getStyles = () => {
    switch (status) {
      case 'success':
      case 'ready':
      case 'ok':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {text}
    </span>
  );
};

