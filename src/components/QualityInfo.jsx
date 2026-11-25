import { useEffect, useId, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'

/**
 * Подсказка по типу комплектующего: hover на десктопе, tap на мобиле.
 * @param {{ label?: string|null, points?: string[]|null }} props
 */
export default function QualityInfo({ label, points }) {
  const list = Array.isArray(points) ? points.filter(Boolean).slice(0, 5) : []
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!list.length) return null

  return (
    <span
      ref={rootRef}
      className="relative ml-1.5 inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label ? `Что значит ${label}` : 'Чем отличаются комплектующие'}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
      >
        <CircleHelp className="h-4 w-4" strokeWidth={2.25} />
      </button>

      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-2 w-[min(18.5rem,calc(100vw-2.5rem))] rounded-2xl border border-[var(--color-line)] bg-white p-3.5 shadow-float sm:left-auto sm:right-0"
        >
          {label ? (
            <p className="mb-2 font-display text-[13px] font-bold text-[var(--color-ink)]">{label}</p>
          ) : null}
          <ul className="space-y-1.5">
            {list.map((point) => (
              <li
                key={point}
                className="flex gap-2 text-[12px] leading-snug text-[var(--color-ink-soft)]"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </span>
  )
}
