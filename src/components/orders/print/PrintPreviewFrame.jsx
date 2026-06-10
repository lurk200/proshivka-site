import React from 'react';
import { Printer } from 'lucide-react';
import './orderPrintSheet.css';

/** Превью: карточка в стиле сайта + «лист» A4 на светлом фоне */
export default function PrintPreviewFrame({ title, onPrint, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 bg-[var(--bg-elevated)]/50">
        <h3 className="text-[14px] font-medium text-[var(--text-primary)]">{title}</h3>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-2 rounded-xl bg-[#84CC16] px-3 py-2 text-[13px] font-semibold text-[#0A0A0C] hover:bg-[#9BE02A] transition-colors shadow-sm shadow-[#84CC16]/20"
        >
          <Printer className="h-4 w-4" />
          Печать / PDF
        </button>
      </div>
      <div className="p-4 sm:p-5 bg-[var(--bg-base)]">
        <div
          className="mx-auto max-w-[210mm] rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50"
          style={{
            backgroundImage:
              'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundColor: 'var(--bg-elevated)',
            padding: '12px',
          }}
        >
          <div className="order-print-isolate rounded-md overflow-hidden bg-white">{children}</div>
        </div>
      </div>
    </div>
  );
}
