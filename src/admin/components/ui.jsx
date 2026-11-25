import clsx from 'clsx'

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-4 flex flex-col gap-2.5 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.3rem] font-bold tracking-tight text-slate-900 sm:text-[1.6rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">
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
      className={clsx(
        'rounded-2xl border border-slate-200/90 bg-white shadow-sm',
        className || 'p-4 sm:p-5',
      )}
    >
      {children}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-semibold text-slate-600">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  )
}

const control =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-lime-500/50 focus:bg-white focus:ring-2 focus:ring-lime-500/15'

export function Input(props) {
  return <input {...props} className={`${control} ${props.className || ''}`} />
}

export function Textarea(props) {
  return <textarea {...props} className={`${control} resize-y ${props.className || ''}`} />
}

export function SaveBar({ dirty, saving, onSave, onReset, message }) {
  if (!dirty && !message) return null
  return (
    <div className="sticky bottom-4 z-30 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lime-500/25 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-[13px] text-slate-600">
          {message || (dirty ? 'Есть несохранённые изменения' : '')}
        </p>
        <div className="flex gap-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              Сбросить
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={onSave}
            className="rounded-xl bg-lime-500 px-4 py-2 text-[13px] font-bold text-slate-950 hover:brightness-105 disabled:opacity-40"
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles =
    variant === 'danger'
      ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
      : variant === 'ghost'
        ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        : variant === 'secondary'
          ? 'border border-slate-200 bg-slate-900 text-white hover:bg-slate-800'
          : 'bg-lime-500 text-slate-950 hover:brightness-105'
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold transition disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}
