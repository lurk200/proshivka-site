import { useState } from 'react'
import { MessageCircle, Phone, X } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { isUsableMessengerUrl } from '../data/defaults.js'

export default function WriteFab() {
  const { company } = useCms()
  const [open, setOpen] = useState(false)
  const showWa = isUsableMessengerUrl(company.whatsapp)
  const showTg = isUsableMessengerUrl(company.telegram)

  return (
    <div
      className="fixed bottom-[4.75rem] right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6"
      aria-label="Написать"
    >
      {open ? (
        <div className="w-[220px] rounded-2xl border border-[var(--color-line)] bg-white p-2 shadow-float">
          {showWa ? (
            <a
              href={company.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
            >
              WhatsApp
            </a>
          ) : null}
          {showTg ? (
            <a
              href={company.telegram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
            >
              Telegram
            </a>
          ) : null}
          <a
            href={company.phoneHref}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
          >
            <Phone className="h-4 w-4 text-[var(--color-accent)]" />
            {company.phone}
          </a>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-3 text-[13px] font-bold text-white shadow-float transition hover:brightness-110 active:scale-[0.98]"
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? 'Закрыть' : 'Написать'}
      </button>
    </div>
  )
}
