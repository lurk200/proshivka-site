import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Smartphone,
  CircleDollarSign,
  MessageSquare,
  CheckCircle2,
  Clock,
  Shield,
  Bell,
  ChevronDown,
  Check,
} from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { Reveal } from '../components/ui';
import { useOrderTrack } from '../hooks/useOrderTrack';
import { useCms } from '../context/CmsContext';
import { ORDER_STATUSES, getStatusProgressIndex } from '../data/orderStatuses';
import OrderDocumentsPublic from '../components/orders/OrderDocumentsPublic';
import { getWarrantyDaysLeft, formatWarrantyUntil } from '../utils/warrantyRemaining';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TONE_STYLES = {
  muted: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  info: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  active: 'bg-[#84CC16]/15 text-[#84CC16] border-[#84CC16]/35',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35',
  done: 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/25',
};

function formatRub(value) {
  if (value == null || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return ''; }
}

function formatDateShort(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'short',
    }).format(new Date(iso));
  } catch { return ''; }
}

// ─── Progress bar with step timestamps ───────────────────────────────────────

function ProgressBar({ currentStatus, statusTimestamps = {} }) {
  const steps = ORDER_STATUSES.filter(s => s.id !== 'cancelled');
  const currentIdx = getStatusProgressIndex(currentStatus);
  const cancelled = currentStatus === 'cancelled';

  if (cancelled) {
    return (
      <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
        Заказ отменён. Свяжитесь с сервисом.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <ol className="flex items-start gap-0 min-w-[480px]">
        {steps.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const ts = statusTimestamps[step.id];
          const isLast = idx === steps.length - 1;

          return (
            <li key={step.id} className="flex flex-1 items-start">
              <div className="flex flex-col items-center flex-1">
                {/* Connector line + circle row */}
                <div className="flex items-center w-full">
                  {/* Left line */}
                  <div
                    className={`flex-1 h-[2px] ${idx === 0 ? 'invisible' : done || active ? 'bg-[#84CC16]' : 'bg-[var(--border-subtle)]'}`}
                  />
                  {/* Circle */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                      active
                        ? 'border-[#84CC16] bg-[#84CC16]/15'
                        : done
                        ? 'border-[#84CC16] bg-[#84CC16]'
                        : 'border-[var(--border-subtle)] bg-transparent'
                    }`}
                  >
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-[#0a0a0c]" />
                    ) : active ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#84CC16] animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[var(--border-subtle)]" />
                    )}
                  </div>
                  {/* Right line */}
                  <div
                    className={`flex-1 h-[2px] ${isLast ? 'invisible' : done ? 'bg-[#84CC16]' : 'bg-[var(--border-subtle)]'}`}
                  />
                </div>
                {/* Label + timestamp below */}
                <div className="mt-1.5 text-center px-1">
                  <p
                    className={`text-[10px] sm:text-[11px] font-medium leading-tight ${
                      active ? 'text-[#84CC16]' : done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {step.label}
                  </p>
                  {ts && (
                    <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5 whitespace-nowrap">
                      {formatDateShort(ts)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Client comment card ──────────────────────────────────────────────────────

function ClientCommentCard({ comment }) {
  if (!comment?.trim()) return null;
  return (
    <div className="flex gap-3 rounded-xl border border-[#84CC16]/25 bg-[#84CC16]/[0.06] px-4 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#84CC16]/15">
        <Bell className="h-3.5 w-3.5 text-[#84CC16]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#84CC16] mb-1">
          Сообщение от мастера
        </p>
        <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{comment}</p>
      </div>
    </div>
  );
}

// ─── Info tile ────────────────────────────────────────────────────────────────

function InfoTile({ icon: Icon, label, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 flex flex-col min-h-[88px] ${className}`}>
      <div className="mb-1 flex items-center gap-1.5 text-[var(--text-muted)]">
        <Icon className="h-3.5 w-3.5 text-[#84CC16] shrink-0" />
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Improved timeline with expand/collapse ───────────────────────────────────

function FullTimeline({ timeline }) {
  const [expanded, setExpanded] = useState(false);
  if (!timeline?.length) return null;

  const items = [...timeline].reverse();
  const latest = items[0];
  const rest = items.slice(1);

  return (
    <div className="h-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5">
        <p className="text-[12px] font-mono uppercase tracking-widest text-[var(--text-muted)]">История</p>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] text-[#84CC16] hover:underline"
          >
            {expanded ? 'Свернуть' : `+${rest.length}`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <div className="flex-1 px-3 py-3">
        {/* Latest entry — always visible */}
        <div className="flex gap-2.5">
          <div className="flex flex-col items-center pt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#84CC16] shrink-0" />
            {expanded && rest.length > 0 && (
              <div className="w-px flex-1 bg-[var(--border-subtle)] mt-1" />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{latest.label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{formatDateTime(latest.at)}</p>
            {latest.note && (
              <p className="mt-1 text-[12px] text-[var(--text-secondary)] leading-snug">{latest.note}</p>
            )}
          </div>
        </div>

        {expanded && rest.length > 0 && (
          <ol className="space-y-0">
            {rest.map((item, idx) => (
              <li key={`${item.at}-${idx}`} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <div className="w-px flex-1 bg-[var(--border-subtle)]" style={{ minHeight: 8 }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-subtle)] shrink-0 my-0.5" />
                  {idx < rest.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border-subtle)]" style={{ minHeight: 8 }} />
                  )}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <p className="text-[12px] font-medium text-[var(--text-secondary)]">{item.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatDateTime(item.at)}</p>
                  {item.note && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ─── Order result ─────────────────────────────────────────────────────────────

function OrderResult({ order, company, lastUpdated, onRefresh, refreshing }) {
  const tone = TONE_STYLES[order.statusTone] ?? TONE_STYLES.muted;
  const price = formatRub(order.cost);
  const warranty = order.documents?.warranty;
  const warrantyDaysLeft = getWarrantyDaysLeft(warranty);

  return (
    <div className="space-y-4">
      {/* Верхняя строка: номер · статус · гарантия · обновить */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <p className="font-mono text-lg md:text-xl font-semibold tabular-nums text-[var(--text-primary)] shrink-0">
          {order.orderNumber}
        </p>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold shrink-0 ${tone}`}>
          {order.status === 'ready' || order.status === 'completed'
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <Clock className="h-3.5 w-3.5" />}
          {order.statusLabel}
        </span>
        {warranty?.days && order.status === 'completed' && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#84CC16]/30 bg-[#84CC16]/10 px-2.5 py-1 text-[11px] text-[#84CC16] shrink-0">
            <Shield className="h-3.5 w-3.5" />
            {warranty.days} дн.
            {warrantyDaysLeft != null && warrantyDaysLeft > 0 ? ` · осталось ${warrantyDaysLeft} дн.` : ''}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto text-[10px] text-[var(--text-muted)]">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2 py-1 text-[#84CC16] hover:bg-[var(--bg-elevated)] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          {lastUpdated && (
            <span className="hidden sm:inline">{formatDateTime(lastUpdated.toISOString())}</span>
          )}
        </div>
      </div>

      {/* Progress bar with stage timestamps */}
      <ProgressBar
        currentStatus={order.status}
        statusTimestamps={order.statusTimestamps ?? {}}
      />

      {/* Manager message — prominent card */}
      <ClientCommentCard comment={order.clientComment || order.publicComment} />

      {/* Info tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        <InfoTile icon={Smartphone} label="Устройство">
          <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">{order.device}</p>
          <p className="mt-auto pt-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">
            {order.statusDescription}
          </p>
        </InfoTile>

        <InfoTile icon={CircleDollarSign} label="Стоимость">
          {price ? (
            <>
              <p className="text-[18px] md:text-[20px] font-medium tabular-nums text-[var(--text-primary)]">
                {price}
              </p>
              <p className="mt-auto pt-0.5 text-[10px] text-[var(--text-muted)]">
                {order.costConfirmed ? '✓ Согласовано' : 'Ориентировочно'}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-[var(--text-secondary)]">Уточняется после диагностики</p>
          )}
        </InfoTile>

        {order.status === 'ready' ? (
          <InfoTile icon={CheckCircle2} label="Выдача" className="sm:col-span-2 lg:col-span-1">
            <p className="text-[13px] text-[#84CC16] leading-snug">
              Ваше устройство готово.{' '}
              <Link to="/otpravit-v-remont" className="underline font-medium">
                Адрес сервиса
              </Link>
            </p>
          </InfoTile>
        ) : (
          <div className="hidden lg:block rounded-xl border border-dashed border-[var(--border-subtle)]/60 min-h-[88px]" aria-hidden />
        )}
      </div>

      {/* History and documents side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 md:items-stretch">
        {order.timeline?.length ? <FullTimeline timeline={order.timeline} /> : null}
        {order.documents ? (
          <OrderDocumentsPublic documents={order.documents} company={company} />
        ) : null}
      </div>

      {order.status === 'completed' && !order.documents?.act && (
        <p className="text-[12px] text-center text-[var(--text-muted)]">Документы готовятся…</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderStatusPage() {
  const { cmsData } = useCms();
  const [searchParams] = useSearchParams();
  const numberFromUrl = searchParams.get('number')?.trim() || '';
  const [query, setQuery] = useState(numberFromUrl);
  const [activeNumber, setActiveNumber] = useState(numberFromUrl || null);

  useEffect(() => {
    if (numberFromUrl) {
      setQuery(numberFromUrl.toUpperCase());
      setActiveNumber(numberFromUrl);
    }
  }, [numberFromUrl]);

  const { order, loading, error, lastUpdated, reload } = useOrderTrack(activeNumber, {
    poll: !!activeNumber,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setActiveNumber(trimmed);
  };

  return (
    <PageTransition>
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bg-base)] pt-24 pb-12 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />
        <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="mb-6 md:mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <Link
                  to="/"
                  className="group mb-3 inline-flex items-center text-[12px] text-[var(--text-muted)] hover:text-[#84CC16]"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                  На главную
                </Link>
                <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-tight text-[var(--text-primary)]">
                  Статус заказа
                </h1>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)] max-w-md">
                  Введите номер с квитанции — данные обновляются автоматически
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full lg:max-w-md shrink-0">
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                  Номер заказа
                </label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value.toUpperCase())}
                      placeholder="260610-01"
                      className="w-full rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] py-3 pl-10 pr-3 font-mono text-[15px] tracking-wide text-[var(--text-primary)] outline-none focus:border-[#84CC16]/50 focus:ring-2 focus:ring-[#84CC16]/20"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-[#84CC16] px-4 py-3 text-[13px] font-semibold text-[#0A0A0C] hover:bg-[#9BE02A] transition-colors"
                  >
                    Найти
                  </button>
                </div>
              </form>
            </div>
          </Reveal>

          {loading && !order && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
              <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#84CC16]" />
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">Загрузка…</p>
            </div>
          )}

          {error && !order && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center max-w-lg mx-auto">
              <p className="text-[14px] text-red-200">{error.message || 'Заказ не найден'}</p>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                <Link to="/otpravit-v-remont" className="text-[#84CC16] hover:underline">
                  Контакты сервиса
                </Link>
              </p>
            </div>
          )}

          {order ? (
            <Reveal delay={40}>
              <div className="rounded-xl md:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 p-4 md:p-5 backdrop-blur-xl">
                <OrderResult
                  order={order}
                  company={cmsData.company}
                  lastUpdated={lastUpdated}
                  onRefresh={reload}
                  refreshing={loading}
                />
              </div>
            </Reveal>
          ) : !loading && !error ? (
            <p className="text-center text-[13px] text-[var(--text-muted)] py-8">
              Введите номер заказа и нажмите «Найти»
            </p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
