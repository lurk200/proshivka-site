import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center backdrop-blur-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
        <AlertCircle className="h-6 w-6 text-red-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
        Ошибка загрузки
      </h3>
      <p className="text-[14px] text-[var(--text-secondary)] mb-6">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-elevated)] px-5 py-3 text-[13px] font-medium text-[var(--text-primary)] transition-all duration-300 hover:border-[#84CC16]/30 hover:text-[#84CC16]"
        >
          <RefreshCw className="h-4 w-4" />
          Повторить
        </button>
      ) : null}
    </div>
  );
}
