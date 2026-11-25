import { useEffect } from 'react'
import { Check } from 'lucide-react'

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--crm-text,#0f172a)] sm:text-[24px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--crm-text-muted,#64748b)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[var(--crm-radius-lg,16px)] border border-[var(--crm-border,#e2e8f0)] bg-[var(--crm-surface,#fff)] p-4 shadow-[var(--crm-shadow-card)] sm:p-5 ${className}`}
    >
      {children}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-semibold text-[var(--crm-text-secondary,#475569)]">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-[11px] text-[var(--crm-text-muted,#64748b)]">{hint}</span>
      ) : null}
    </label>
  )
}

const control = 'crm-input'

export function Input(props) {
  return <input {...props} className={`${control} ${props.className || ''}`} />
}

export function Textarea(props) {
  return <textarea {...props} className={`${control} resize-y ${props.className || ''}`} />
}

export function Select(props) {
  return <select {...props} className={`${control} ${props.className || ''}`} />
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles =
    variant === 'danger'
      ? 'inline-flex items-center justify-center gap-2 rounded-[var(--crm-radius-sm)] border border-red-200 bg-[var(--crm-danger-bg,#fee2e2)] px-3.5 py-2 text-[13px] font-semibold text-[var(--crm-danger-text,#991b1b)] transition hover:brightness-95 disabled:opacity-40'
      : variant === 'ghost' || variant === 'secondary'
        ? 'crm-btn-ghost'
        : variant === 'dark'
          ? 'inline-flex items-center justify-center gap-2 rounded-[var(--crm-radius-sm)] border border-slate-200 bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40'
          : 'crm-btn-primary'

  return (
    <button type="button" {...props} className={`${styles} ${className}`.trim()}>
      {children}
    </button>
  )
}

/** Toast в правом нижнем углу. */
export function Toast({ message, onDone, ms = 1800 }) {
  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(() => onDone?.(), ms)
    return () => clearTimeout(t)
  }, [message, ms, onDone])

  if (!message) return null
  return (
    <div className="crm-toast" role="status">
      <Check className="h-4 w-4 shrink-0 text-[var(--crm-brand-border)]" />
      {message}
    </div>
  )
}

export function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatMoney(n) {
  if (n == null || n === '') return '—'
  return `${Number(n).toLocaleString('ru-RU')} ₽`
}
