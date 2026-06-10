import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react';

// ─── AdminCard ────────────────────────────────────────────────────────────

export function AdminCard({ children, className = '' }) {
  return (
    <div className={`bg-[#14161a] border border-white/[0.06] rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────

export function StatCard({ icon: Icon, label, value, sub, accent = false, to, onClick }) {
  const cls =
    'flex flex-col gap-3 p-5 bg-[#14161a] border rounded-2xl transition-colors ' +
    (accent
      ? 'border-[#84CC16]/20 hover:border-[#84CC16]/40'
      : 'border-white/[0.06] hover:border-white/[0.12]') +
    (to || onClick ? ' cursor-pointer' : '');

  const inner = (
    <>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-[#84CC16]/10' : 'bg-white/[0.05]'}`}>
        <Icon className={`w-4.5 h-4.5 ${accent ? 'text-[#84CC16]' : 'text-[#9ca3af]'}`} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[24px] font-bold text-white leading-none">{value ?? '—'}</p>
        <p className="text-[13px] text-[#6b7280] mt-1">{label}</p>
        {sub && <p className="text-[11px] text-[#4b5563] mt-1">{sub}</p>}
      </div>
    </>
  );

  if (to) {
    return (
      <a href={to} className={cls}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls + ' text-left'}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

// ─── Field ────────────────────────────────────────────────────────────────

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-medium text-[#e5e7eb] mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="text-[12px] text-[#6b7280] mt-1.5 block">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[14px] placeholder:text-[#4b5563] focus:outline-none focus:border-[#84CC16]/50 focus:ring-1 focus:ring-[#84CC16]/30 transition-colors';

export function Input(props) {
  return <input className={inputClass} {...props} />;
}

export function Textarea({ rows = 4, ...props }) {
  return <textarea rows={rows} className={`${inputClass} resize-y min-h-[100px]`} {...props} />;
}

export function ArrayLinesInput({ value = [], onChange, rows = 4, placeholder }) {
  return (
    <Textarea
      rows={rows}
      placeholder={placeholder}
      value={Array.isArray(value) ? value.join('\n') : ''}
      onChange={e =>
        onChange(
          e.target.value
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select className={`${inputClass} cursor-pointer`} {...props}>
      {children}
    </select>
  );
}

// ─── SaveBar ──────────────────────────────────────────────────────────────

export function SaveBar({ onSave, onReset, saving, saved }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-6 -mb-6 mt-8 px-6 py-4 bg-[#14161a]/95 backdrop-blur border-t border-white/[0.06] flex flex-wrap items-center gap-3 rounded-b-2xl">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[14px] hover:bg-[#9be02a] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Сохранение…' : 'Сохранить'}
      </button>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl border border-white/[0.1] text-[#d1d5db] text-[14px] hover:bg-white/[0.04] transition-colors"
        >
          Сбросить
        </button>
      ) : null}
      {saved ? <span className="text-[#84CC16] text-[13px] ml-auto flex items-center gap-1.5">
        <CheckCircle className="w-4 h-4" />
        Изменения сохранены
      </span> : null}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────

export function PageHeader({ title, description, actions }) {
  return (
    <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
        {description ? <p className="text-[#9ca3af] text-[15px] mt-2 max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
    </header>
  );
}

export function PreviewLink({ href, label = 'Открыть на сайте' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#84CC16]/30 text-[#84CC16] text-[13px] font-medium hover:bg-[#84CC16]/10 transition-colors"
    >
      {label}
    </a>
  );
}

// ─── AdminTabs ────────────────────────────────────────────────────────────

export function AdminTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[#0c0d10] border border-white/[0.06] mb-6">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            active === id
              ? 'bg-[#84CC16]/15 text-[#84CC16] border border-[#84CC16]/25'
              : 'text-[#9ca3af] hover:text-white border border-transparent'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── CollapsibleCard ──────────────────────────────────────────────────────

export function CollapsibleCard({ title, subtitle, open, onToggle, actions, children, className = '' }) {
  return (
    <div className={`bg-[#14161a] border border-white/[0.06] rounded-2xl overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className={`mt-1 text-[#6b7280] transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden>
          ▶
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-white truncate">{title}</p>
          {subtitle ? <p className="text-[12px] text-[#6b7280] mt-1 truncate">{subtitle}</p> : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        ) : null}
      </button>
      {open ? <div className="px-5 pb-5 pt-0 border-t border-white/[0.06]">{children}</div> : null}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white/[0.08] text-[#9ca3af]',
    green: 'bg-[#84CC16]/15 text-[#84CC16] border border-[#84CC16]/20',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    red: 'bg-red-500/15 text-red-400 border border-red-500/20',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant] ?? variants.default}`}>
      {children}
    </span>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-[#6b7280]" />
        </div>
      )}
      <p className="text-[15px] font-medium text-[#9ca3af]">{title}</p>
      {description && <p className="text-[13px] text-[#6b7280] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const TOAST_ICONS = {
  success: <CheckCircle className="w-4 h-4 text-[#84CC16]" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

const TOAST_BORDER = {
  success: 'border-[#84CC16]/20',
  error: 'border-red-500/20',
  info: 'border-blue-500/20',
};

function ToastItem({ id, message, type, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 3500);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1a1d22] border ${TOAST_BORDER[type] ?? 'border-white/[0.08]'} shadow-xl min-w-[280px] max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-200`}
    >
      <span className="shrink-0 mt-0.5">{TOAST_ICONS[type] ?? TOAST_ICONS.info}</span>
      <p className="flex-1 text-[14px] text-[#e5e7eb] leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="p-0.5 rounded text-[#6b7280] hover:text-white transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────

export function ConfirmModal({ open, title, message, confirmLabel = 'Удалить', onConfirm, onCancel, danger = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={ref}
        tabIndex={-1}
        className="relative w-full max-w-sm bg-[#14161a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl"
        onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
      >
        <h2 className="text-[16px] font-semibold text-white mb-2">{title}</h2>
        {message && <p className="text-[14px] text-[#9ca3af] mb-6">{message}</p>}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[14px] hover:bg-white/[0.04] transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
              danger
                ? 'bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25'
                : 'bg-[#84CC16] text-[#0c0d10] hover:bg-[#9be02a]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
