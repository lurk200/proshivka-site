import React, { useMemo } from 'react';
import { FileText, ClipboardList, Printer } from 'lucide-react';
import { buildOrderDocData } from '../../utils/orderDocData';
import { useOrderPrint } from './print/useOrderPrint';
import ReceptionReceiptDocument from './print/ReceptionReceiptDocument';
import WorkCompletionActDocument from './print/WorkCompletionActDocument';

function mergeOrderForDoc(source, warranty) {
  if (!source) return null;
  return {
    ...source,
    warranty: warranty ?? source.warranty,
    workPerformed: source.workPerformed || source.publicComment,
  };
}

function DocActionCard({ icon: Icon, title, hint, onPrint }) {
  return (
    <div className="flex flex-1 min-w-[140px] flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#84CC16]/10 text-[#84CC16]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{title}</p>
          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{hint}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onPrint}
        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#84CC16] px-3 py-2 text-[12px] font-semibold text-[#0A0A0C] hover:bg-[#9BE02A] transition-colors"
      >
        <Printer className="h-3.5 w-3.5" />
        PDF
      </button>
    </div>
  );
}

/** Документы для клиента — в строку на планшете и ПК */
export default function OrderDocumentsPublic({ documents, company, reviewUrl }) {
  const warranty = documents?.warranty;
  const reviewSettings = reviewUrl ? { reviewUrl } : undefined;

  const receiptData = useMemo(
    () =>
      documents?.receipt
        ? buildOrderDocData(mergeOrderForDoc(documents.receipt, warranty), company, { settings: reviewSettings })
        : null,
    [documents?.receipt, warranty, company, reviewUrl],
  );

  const actData = useMemo(
    () =>
      documents?.act
        ? buildOrderDocData(mergeOrderForDoc(documents.act, warranty), company, { settings: reviewSettings })
        : null,
    [documents?.act, warranty, company, reviewUrl],
  );

  const receiptPrint = useOrderPrint('Приемная квитанция');
  const actPrint = useOrderPrint('Акт выполненных работ');

  if (!documents?.receipt && !documents?.act) return null;

  return (
    <div className="h-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5">
        <FileText className="h-4 w-4 text-[#84CC16]" />
        <p className="text-[12px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          Документы
        </p>
      </div>

      <div className="flex flex-1 flex-col sm:flex-row gap-2 p-3">
        {documents.receipt ? (
          <DocActionCard
            icon={ClipboardList}
            title="Квитанция"
            hint="При сдаче"
            onPrint={receiptPrint.print}
          />
        ) : null}
        {documents.act ? (
          <DocActionCard
            icon={FileText}
            title="Акт работ"
            hint="При выдаче"
            onPrint={actPrint.print}
          />
        ) : null}
      </div>

      {receiptData ? (
        <div className="sr-only" aria-hidden>
          <div ref={receiptPrint.ref} className="order-print-isolate">
            <ReceptionReceiptDocument data={receiptData} />
          </div>
        </div>
      ) : null}
      {actData ? (
        <div className="sr-only" aria-hidden>
          <div ref={actPrint.ref} className="order-print-isolate">
            <WorkCompletionActDocument data={actData} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
