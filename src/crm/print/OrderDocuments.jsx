import { Download, FileText, Lock, Printer } from 'lucide-react'
import { useCms } from '../../context/CmsContext.jsx'
import { buildOrderDocData } from './orderDocData.js'
import ReceptionReceiptDocument from './ReceptionReceiptDocument.jsx'
import WorkCompletionActDocument from './WorkCompletionActDocument.jsx'
import { useOrderPrint } from './useOrderPrint.js'

export default function OrderDocuments({
  order,
  device,
  publicMode = false,
  compact = false,
  stacked = false,
}) {
  const { company } = useCms()
  const receiptPrint = useOrderPrint(`Квитанция ${order.orderNumber || order.number}`)
  const actPrint = useOrderPrint(`Акт ${order.orderNumber || order.number}`)

  const reviewUrl = company?.reviewUrl?.trim() || ''
  const data = buildOrderDocData(order, device, company, {
    public: publicMode,
    siteOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    reviewUrl,
  })

  const canAct = Boolean(order.completionAct)

  if (stacked) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={receiptPrint.print}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left transition hover:border-slate-300 hover:bg-white"
        >
          <FileText className="h-4 w-4 shrink-0 text-[#52A800]" />
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-slate-800">
            Квитанция приёмки
          </span>
          <Download className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <button
          type="button"
          disabled={!canAct}
          onClick={actPrint.print}
          className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
            canAct
              ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
              : 'cursor-not-allowed border-slate-100 bg-slate-50/70 opacity-60'
          }`}
        >
          {canAct ? (
            <FileText className="h-4 w-4 shrink-0 text-[#52A800]" />
          ) : (
            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-slate-800">
            {canAct ? 'Акт выдачи (АВР)' : 'Акт выдачи'}
          </span>
          {!canAct ? (
            <span className="shrink-0 text-[11px] font-medium text-slate-400">
              Доступен после выдачи
            </span>
          ) : null}
          {canAct ? <Download className="h-4 w-4 shrink-0 text-slate-400" /> : null}
        </button>

        <div className="sr-only" aria-hidden>
          <div ref={receiptPrint.ref}>
            <ReceptionReceiptDocument data={data} />
          </div>
          {canAct ? (
            <div ref={actPrint.ref}>
              <WorkCompletionActDocument data={data} />
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        <button type="button" className="crm-doc-btn" onClick={receiptPrint.print}>
          <FileText className="h-3.5 w-3.5 shrink-0" />
          Квитанция
          <Printer className="crm-doc-icon h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="crm-doc-btn"
          disabled={!canAct}
          onClick={actPrint.print}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          {canAct ? 'Акт выдачи' : 'Акт после выдачи'}
          <Printer className="crm-doc-icon h-3.5 w-3.5" />
        </button>

        <div className="sr-only" aria-hidden>
          <div ref={receiptPrint.ref}>
            <ReceptionReceiptDocument data={data} />
          </div>
          {canAct ? (
            <div ref={actPrint.ref}>
              <WorkCompletionActDocument data={data} />
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="crm-doc-btn !w-auto" onClick={receiptPrint.print}>
          <FileText className="h-3.5 w-3.5" />
          Квитанция приёма
          <Printer className="crm-doc-icon h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="crm-doc-btn !w-auto"
          disabled={!canAct}
          onClick={actPrint.print}
        >
          <FileText className="h-3.5 w-3.5" />
          {canAct ? 'Акт выдачи' : 'Акт — после выдачи'}
          <Printer className="crm-doc-icon h-3.5 w-3.5" />
        </button>
      </div>
      {!publicMode && canAct ? (
        <p className="text-[12px] text-[var(--crm-text-muted,#64748b)]">
          QR отзыва в акте:{' '}
          {reviewUrl ? (
            <a
              href={reviewUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all font-semibold text-[var(--crm-brand,#52a800)] hover:underline"
            >
              {reviewUrl}
            </a>
          ) : (
            <span className="text-[var(--crm-warning-text,#92400e)]">не задан — </span>
          )}
          {!reviewUrl ? (
            <a
              href="/admin/company"
              className="font-semibold text-[var(--crm-brand,#52a800)] hover:underline"
            >
              указать в Контактах
            </a>
          ) : (
            <a
              href="/admin/company"
              className="ml-1 font-semibold text-[var(--crm-text-faint,#94a3b8)] hover:text-[var(--crm-brand,#52a800)]"
            >
              изменить
            </a>
          )}
        </p>
      ) : null}

      <div className="sr-only" aria-hidden>
        <div ref={receiptPrint.ref}>
          <ReceptionReceiptDocument data={data} />
        </div>
        {canAct ? (
          <div ref={actPrint.ref}>
            <WorkCompletionActDocument data={data} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
