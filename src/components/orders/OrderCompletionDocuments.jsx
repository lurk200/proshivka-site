import React, { useMemo } from 'react';
import { FileText, ClipboardList } from 'lucide-react';
import { buildOrderDocData } from '../../utils/orderDocData';
import PrintPreviewFrame from './print/PrintPreviewFrame';
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

export function ReceptionReceiptCard({ receipt, company, warranty, settings }) {
  const { ref, print } = useOrderPrint('Приемная квитанция');
  const data = useMemo(
    () => buildOrderDocData(mergeOrderForDoc(receipt, warranty), company, { settings }),
    [receipt, warranty, company, settings],
  );
  if (!receipt) return null;

  return (
    <PrintPreviewFrame title="Приемная квитанция" onPrint={print}>
      <div ref={ref} className="order-print-isolate">
        <ReceptionReceiptDocument data={data} />
      </div>
    </PrintPreviewFrame>
  );
}

export function CompletionActCard({ act, company, warranty, settings }) {
  const { ref, print } = useOrderPrint('Акт выполненных работ');
  const data = useMemo(
    () => buildOrderDocData(mergeOrderForDoc(act, warranty), company, { settings }),
    [act, warranty, company, settings],
  );
  if (!act) return null;

  return (
    <PrintPreviewFrame title="Акт выполненных работ" onPrint={print}>
      <div ref={ref} className="order-print-isolate">
        <WorkCompletionActDocument data={data} />
      </div>
    </PrintPreviewFrame>
  );
}

/** Блок документов на странице статуса заказа */
export default function OrderCompletionDocuments({ documents, company }) {
  if (!documents) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#84CC16]">
        <FileText className="h-5 w-5" />
        <p className="text-[14px] font-medium text-[var(--text-primary)]">Документы от сервиса</p>
      </div>

      {documents.receipt ? (
        <ReceptionReceiptCard
          receipt={documents.receipt}
          company={company}
          warranty={documents.warranty}
        />
      ) : null}

      {documents.act ? (
        <CompletionActCard act={documents.act} company={company} warranty={documents.warranty} />
      ) : documents.receipt ? null : (
        <p className="text-[12px] text-[var(--text-muted)]">
          Акт и гарантия появятся после выдачи устройства (статус «Выдан»).
        </p>
      )}
    </div>
  );
}

/** Превью в админке */
export function OrderDocumentsAdminPreview({ company, order, settings }) {
  if (!order) return null;
  const warranty = order.warranty;
  const actSource = order.completionAct
    ? {
        ...order,
        issuedAt: order.issuedAt,
        completionAct: order.completionAct,
      }
    : null;

  return (
    <div className="space-y-4 mt-2">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-[#6b7280]">
          <ClipboardList className="h-3.5 w-3.5" />
          Приём
        </p>
        <ReceptionReceiptCard receipt={order} company={company} warranty={warranty} settings={settings} />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-mono uppercase tracking-widest text-[#6b7280]">Выдача</p>
        {actSource ? (
          <CompletionActCard act={actSource} company={company} warranty={warranty} settings={settings} />
        ) : (
          <p className="text-[12px] text-[#9ca3af]">Акт появится после статуса «Выдан».</p>
        )}
      </div>
    </div>
  );
}
