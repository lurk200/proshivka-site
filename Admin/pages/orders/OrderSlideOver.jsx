import React, { useEffect, useRef, useState } from 'react';
import {
  X, Phone, User, Cpu, Clock, FileText, DollarSign,
  MessageSquare, Save, Trash2, Printer, ChevronDown, CheckCircle,
  AlertTriangle, Bell, TrendingUp, Calculator,
} from 'lucide-react';
import { useCms } from '../../../src/context/CmsContext';
import { Field, Input, AdminTabs, ConfirmModal } from '../../components/ui';
import { ORDER_STATUSES } from '../../../src/data/orderStatuses';
import { WARRANTY_DAY_OPTIONS } from '../../../src/data/orderWarranty';
import { OrderDocumentsAdminPreview } from '../../../src/components/orders/OrderCompletionDocuments';
import OrderDocumentsEditor from './OrderDocumentsEditor';
import {
  STATUS_CONFIG,
  getWarrantyDaysLeft,
  warrantyBadge,
  formatDt,
  computeOrderTotal,
} from './orderAdminUtils';
import {
  fetchOrderNotificationEvents,
} from '../../../src/api/ordersApi';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'main',    label: 'Основное' },
  { id: 'client',  label: 'Клиент' },
  { id: 'finance', label: 'Финансы' },
  { id: 'issue',   label: 'Выдача' },
  { id: 'history', label: 'История' },
  { id: 'docs',    label: 'Документы' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13.5px] placeholder:text-[#4b5563] focus:outline-none focus:border-[#84CC16]/50 focus:ring-1 focus:ring-[#84CC16]/20 transition-colors';

const textareaCls = `${inputCls} min-h-[72px] resize-y`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SField({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">{label}</p>
      {children}
      {hint && <p className="text-[11px] text-[#4b5563]">{hint}</p>}
    </div>
  );
}

function StatusPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CONFIG[value] ?? STATUS_CONFIG.accepted;

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border ${cfg.badge} cursor-pointer`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-[#1a1d22] border border-white/[0.12] rounded-xl shadow-2xl py-1 overflow-hidden">
          {ORDER_STATUSES.map(s => {
            const c = STATUS_CONFIG[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-white/[0.06] text-left ${value === s.id ? 'bg-white/[0.04]' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${c?.dot ?? 'bg-gray-400'}`} />
                <span className="text-white">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryTimeline({ history }) {
  if (!history?.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Clock className="w-8 h-8 text-[#4b5563] mb-2" />
        <p className="text-[13px] text-[#9ca3af]">История пуста</p>
      </div>
    );
  }

  const items = [...history].reverse();
  const typeColors = {
    created: 'bg-[#84CC16]',
    status: 'bg-blue-400',
    note: 'bg-amber-400',
    field_change: 'bg-[#6b7280]',
  };
  const typeIcons = {
    field_change: '✏',
    note: '📝',
    created: '✚',
  };

  return (
    <ul className="space-y-0">
      {items.map((h, i) => {
        const dotColor = typeColors[h.type] ?? typeColors.status;
        const icon = typeIcons[h.type];
        return (
          <li key={`${h.at}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
              {i < items.length - 1 && (
                <div className="w-px flex-1 bg-white/[0.06] mt-1" />
              )}
            </div>
            <div className="pb-4 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {icon && <span className="text-[10px]">{icon}</span>}
                <p className="text-[13px] text-white font-medium leading-tight">
                  {h.label || h.note}
                </p>
                {h.public === false && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#4b5563] uppercase tracking-wide">
                    внутр.
                  </span>
                )}
              </div>
              {h.type === 'field_change' ? (
                <p className="text-[11px] text-[#6b7280] mt-0.5">
                  {h.from || '—'} → {h.to || '—'}
                </p>
              ) : h.note && h.note !== h.label ? (
                <p className="text-[12px] text-[#9ca3af] mt-0.5">{h.note}</p>
              ) : null}
              <p className="text-[10px] text-[#4b5563] mt-1">{formatDt(h.at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NotificationLog({ orderId }) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetchOrderNotificationEvents(orderId)
      .then(d => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <p className="text-[12px] text-[#6b7280] py-4 text-center">Загрузка…</p>;
  }

  if (!events?.length) {
    return (
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <p className="text-[11px] font-mono uppercase tracking-wide text-[#4b5563] mb-2">Уведомления</p>
        <p className="text-[12px] text-[#6b7280]">Уведомлений не отправлялось</p>
      </div>
    );
  }

  const statusColor = { sent: 'text-[#84CC16]', queued: 'text-amber-400', error: 'text-red-400', pending: 'text-[#6b7280]' };

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      <p className="text-[11px] font-mono uppercase tracking-wide text-[#4b5563] mb-3">
        Уведомления ({events.length})
      </p>
      <ul className="space-y-2">
        {events.map(ev => (
          <li key={ev.id} className="flex items-start gap-2 text-[12px]">
            <Bell className="w-3.5 h-3.5 text-[#6b7280] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[#e5e7eb] truncate">{ev.subject}</p>
              <p className="text-[#6b7280]">{formatDt(ev.createdAt)}</p>
            </div>
            <span className={`ml-auto text-[10px] font-mono uppercase shrink-0 ${statusColor[ev.status] ?? 'text-[#6b7280]'}`}>
              {ev.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Financial tab ────────────────────────────────────────────────────────────

function FinanceTab({ form, set }) {
  const diag = Number(form.diagCost) || 0;
  const repair = Number(form.repairCost) || 0;
  const parts = Number(form.partsCost) || 0;
  const discount = Number(form.discount) || 0;
  const autoTotal = diag + repair + parts - discount;
  const hasBreakdown = diag + repair + parts > 0;

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] text-[#9ca3af] leading-relaxed">
        Разбивка по составляющим стоимости. Итог рассчитывается автоматически, но можно указать вручную в поле «Стоимость заказа».
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <SField label="Диагностика, ₽">
          <input className={inputCls} type="number" min={0} value={form.diagCost} onChange={set('diagCost')} placeholder="0" />
        </SField>
        <SField label="Ремонт (работы), ₽">
          <input className={inputCls} type="number" min={0} value={form.repairCost} onChange={set('repairCost')} placeholder="0" />
        </SField>
        <SField label="Запчасти, ₽">
          <input className={inputCls} type="number" min={0} value={form.partsCost} onChange={set('partsCost')} placeholder="0" />
        </SField>
        <SField label="Скидка, ₽">
          <input className={inputCls} type="number" min={0} value={form.discount} onChange={set('discount')} placeholder="0" />
        </SField>
      </div>

      {/* Auto-total */}
      {hasBreakdown && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#84CC16]/20 bg-[#84CC16]/[0.05]">
          <Calculator className="w-4 h-4 text-[#84CC16] shrink-0" />
          <div>
            <p className="text-[11px] text-[#6b7280]">Автоматический итог</p>
            <p className="text-[18px] font-bold text-[#84CC16]">
              {autoTotal.toLocaleString('ru')} ₽
            </p>
          </div>
          {discount > 0 && (
            <span className="ml-auto text-[11px] text-[#84CC16] bg-[#84CC16]/10 border border-[#84CC16]/20 px-2 py-0.5 rounded-full">
              −{discount.toLocaleString('ru')} ₽ скидка
            </span>
          )}
        </div>
      )}

      {/* Manual override */}
      <SField
        label="Стоимость заказа (итог, вручную)"
        hint="Если заполнено — перекрывает автоматический расчёт"
      >
        <input
          className={inputCls}
          type="number"
          min={0}
          value={form.cost}
          onChange={set('cost')}
          placeholder={hasBreakdown ? String(Math.max(autoTotal, 0)) : '0'}
        />
      </SField>

      <SField label="Предоплата, ₽">
        <input className={inputCls} type="number" min={0} value={form.prepayment} onChange={set('prepayment')} />
      </SField>

      {/* Balance */}
      {(Number(form.cost) > 0 || (hasBreakdown && autoTotal > 0)) && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-[12px] text-[#9ca3af]">Остаток к оплате</span>
          <span className="text-[16px] font-semibold text-white">
            {Math.max(0, (Number(form.cost) || autoTotal) - (Number(form.prepayment) || 0)).toLocaleString('ru')} ₽
          </span>
        </div>
      )}

      {/* Agreed */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.costConfirmed}
          onChange={set('costConfirmed')}
          className="w-4 h-4 rounded accent-[#84CC16]"
        />
        <div>
          <p className="text-[13px] text-white font-medium">Стоимость согласована</p>
          <p className="text-[11px] text-[#6b7280]">Клиент подтвердил стоимость ремонта</p>
        </div>
      </label>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrderSlideOver({ order, open, onClose, onSave, onDelete }) {
  const { cmsData } = useCms();
  const [tab, setTab] = useState('main');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const panelRef = useRef(null);

  const [form, setForm] = useState({});
  const syncedForId = useRef(null);

  // Sync form when order changes
  useEffect(() => {
    if (!order) return;
    if (syncedForId.current === order.id) return;
    syncedForId.current = order.id;
    setTab('main');
    setSaved(false);
    setForm({
      device: order.device ?? '',
      orderNumber: order.orderNumber ?? '',
      status: order.status ?? 'accepted',
      // Financial
      cost: order.cost != null ? String(order.cost) : '',
      diagCost: order.diagCost != null ? String(order.diagCost) : '0',
      repairCost: order.repairCost != null ? String(order.repairCost) : '0',
      partsCost: order.partsCost != null ? String(order.partsCost) : '0',
      discount: order.discount != null ? String(order.discount) : '0',
      costConfirmed: !!order.costConfirmed,
      // Comments
      publicComment: order.publicComment ?? '',
      clientComment: order.clientComment ?? '',
      internalNote: order.internalNote ?? '',
      statusNote: '',
      // Client
      clientName: order.clientName ?? '',
      clientPhone: order.clientPhone ?? '',
      reason: order.reason ?? '',
      appearance: order.appearance ?? '',
      kit: order.kit ?? '',
      prepayment: order.prepayment != null ? String(order.prepayment) : '',
      estimatedReadyAt: order.estimatedReadyAt ? order.estimatedReadyAt.slice(0, 10) : '',
      managerName: order.managerName ?? '',
      // Issuance
      workPerformed: order.workPerformed ?? '',
      warrantyDays: order.warranty?.days ? String(order.warranty.days) : '',
      recommendations: order.recommendations ?? '',
    });
  }, [order]);

  useEffect(() => {
    if (order?.id !== syncedForId.current) {
      syncedForId.current = null;
    }
  }, [order?.id]);

  const set = key => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: v }));
    setSaved(false);
  };

  const setV = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const patch = {
        device: form.device,
        status: form.status,
        cost: form.cost !== '' ? form.cost : null,
        diagCost: form.diagCost,
        repairCost: form.repairCost,
        partsCost: form.partsCost,
        discount: form.discount,
        costConfirmed: form.costConfirmed,
        publicComment: form.publicComment,
        clientComment: form.clientComment,
        internalNote: form.internalNote,
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        reason: form.reason,
        appearance: form.appearance,
        kit: form.kit,
        prepayment: form.prepayment,
        recommendations: form.recommendations,
        estimatedReadyAt: form.estimatedReadyAt || '',
        managerName: form.managerName,
        workPerformed: form.workPerformed,
        warrantyDays: form.status === 'completed' ? form.warrantyDays : undefined,
      };

      // Status change note
      if (form.status !== order.status) {
        patch.statusNote = form.statusNote.trim() || STATUS_CONFIG[form.status]?.label || form.status;
      } else if (form.statusNote.trim()) {
        patch.historyNote = form.statusNote.trim();
      }

      await onSave(order.id, patch);
      setForm(f => ({ ...f, statusNote: '' }));
      setSaved(true);
      syncedForId.current = null;
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await onDelete(order.id);
    onClose();
  };

  const canSetWarranty = form.status === 'completed';
  const warrantyLeft = order ? getWarrantyDaysLeft(order) : null;
  const wBadge = warrantyBadge(warrantyLeft);

  const previewOrder = order ? {
    ...order,
    device: form.device,
    cost: form.cost === '' ? null : Number(form.cost),
    publicComment: form.publicComment,
    clientName: form.clientName,
    clientPhone: form.clientPhone,
    reason: form.reason,
    appearance: form.appearance,
    kit: form.kit,
    prepayment: form.prepayment,
    recommendations: form.recommendations,
    estimatedReadyAt: form.estimatedReadyAt,
    managerName: form.managerName,
    workPerformed: form.workPerformed,
  } : null;

  if (!order) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-screen w-full sm:w-[560px] flex flex-col bg-[#0f1014] border-l border-white/[0.08] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[15px] font-bold text-white">{order.orderNumber}</span>
              {order.status === 'completed' && warrantyLeft !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${wBadge.className}`}>
                  {wBadge.text}
                </span>
              )}
            </div>
            <div className="mt-2">
              <StatusPicker
                value={form.status ?? order.status}
                onChange={v => setV('status', v)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick info strip */}
        <div className="flex items-center gap-4 px-5 py-2 bg-white/[0.02] border-b border-white/[0.04] text-[12px] text-[#6b7280] shrink-0 flex-wrap gap-y-1">
          {order.device && (
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> {order.device}
            </span>
          )}
          {order.clientName && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {order.clientName}
            </span>
          )}
          {order.clientPhone && (
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {order.clientPhone}
            </span>
          )}
          {(order.cost || computeOrderTotal(order)) != null && (
            <span className="flex items-center gap-1.5 ml-auto">
              <DollarSign className="w-3.5 h-3.5" />
              {(order.cost ?? computeOrderTotal(order))?.toLocaleString('ru')} ₽
              {!order.costConfirmed && (
                <AlertTriangle className="w-3 h-3 text-amber-400" title="Не согласована" />
              )}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/[0.06] px-2 shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-3 text-[12.5px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-[#84CC16] text-[#84CC16]'
                  : 'border-transparent text-[#6b7280] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── Основное ── */}
          {tab === 'main' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SField label="Устройство">
                  <input className={inputCls} value={form.device} onChange={set('device')} placeholder="iPhone 14 Pro" />
                </SField>
                <SField label="Номер заказа">
                  <input className={inputCls} value={form.orderNumber} disabled />
                </SField>
              </div>

              <SField
                label="Сообщение клиенту"
                hint="Отображается на странице статуса заказа. Видно клиенту."
              >
                <textarea
                  className={textareaCls}
                  value={form.clientComment}
                  onChange={set('clientComment')}
                  rows={2}
                  placeholder="Ожидаем поставку запчасти до пятницы…"
                />
              </SField>

              <SField label="Внутренняя заметка" hint="Видна только в панели управления">
                <input className={inputCls} value={form.internalNote} onChange={set('internalNote')} />
              </SField>

              <SField label="Комментарий для документов (квитанция, акт)">
                <textarea
                  className={textareaCls}
                  value={form.publicComment}
                  onChange={set('publicComment')}
                  rows={2}
                  placeholder="Описание неисправности, что сделано…"
                />
              </SField>

              <SField label="Заметка в историю" hint="Добавится к записи при сохранении">
                <input
                  className={inputCls}
                  value={form.statusNote}
                  onChange={set('statusNote')}
                  placeholder="Смена статуса, событие…"
                />
              </SField>
            </div>
          )}

          {/* ── Клиент ── */}
          {tab === 'client' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SField label="Имя клиента">
                  <input className={inputCls} value={form.clientName} onChange={set('clientName')} />
                </SField>
                <SField label="Телефон">
                  <input className={inputCls} value={form.clientPhone} onChange={set('clientPhone')} />
                </SField>
              </div>
              <SField label="Причина обращения">
                <input className={inputCls} value={form.reason} onChange={set('reason')} />
              </SField>
              <div className="grid grid-cols-2 gap-3">
                <SField label="Внешний вид">
                  <input className={inputCls} value={form.appearance} onChange={set('appearance')} />
                </SField>
                <SField label="Комплектация">
                  <input className={inputCls} value={form.kit} onChange={set('kit')} />
                </SField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SField label="Ориент. дата готовности">
                  <input className={inputCls} type="date" value={form.estimatedReadyAt} onChange={set('estimatedReadyAt')} />
                </SField>
                <SField label="Менеджер / мастер">
                  <input className={inputCls} value={form.managerName} onChange={set('managerName')} />
                </SField>
              </div>
            </div>
          )}

          {/* ── Финансы ── */}
          {tab === 'finance' && (
            <FinanceTab form={form} set={set} />
          )}

          {/* ── Выдача ── */}
          {tab === 'issue' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] text-[#9ca3af]">
                <strong className="text-white">Готово</strong> — можно забрать.{' '}
                <strong className="text-white">Выдан</strong> — уходит в архив, оформляются гарантия и акт.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SField label="Гарантия (только «Выдан»)">
                  <select
                    className={`${inputCls} cursor-pointer disabled:opacity-50`}
                    value={form.warrantyDays}
                    onChange={set('warrantyDays')}
                    disabled={!canSetWarranty}
                  >
                    <option value="">Без гарантии</option>
                    {WARRANTY_DAY_OPTIONS.map(o => (
                      <option key={o.days} value={String(o.days)}>{o.label}</option>
                    ))}
                  </select>
                </SField>
                {order.warranty?.until && (
                  <SField label="Гарантия до">
                    <p className="text-[13px] text-[#84CC16] py-2">{formatDt(order.warranty.until)}</p>
                  </SField>
                )}
              </div>
              <SField label="Выполненные работы">
                <textarea className={textareaCls} value={form.workPerformed} onChange={set('workPerformed')} rows={4} />
              </SField>
              <SField label="Рекомендации после ремонта">
                <input className={inputCls} value={form.recommendations} onChange={set('recommendations')} />
              </SField>
            </div>
          )}

          {/* ── История ── */}
          {tab === 'history' && (
            <div>
              <HistoryTimeline history={order.history} />
              <NotificationLog orderId={order.id} />
            </div>
          )}

          {/* ── Документы ── */}
          {tab === 'docs' && (
            <div>
              <OrderDocumentsEditor form={form} set={key => e => set(key)(e)} />
              <OrderDocumentsAdminPreview order={previewOrder} company={cmsData?.company} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-2 shrink-0 bg-[#0f1014]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13.5px] hover:bg-[#9be02a] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>

          {saved && (
            <span className="text-[#84CC16] text-[12px] flex items-center gap-1 shrink-0">
              <CheckCircle className="w-4 h-4" /> Сохранено
            </span>
          )}

          <a
            href={`/status-zakaza?number=${encodeURIComponent(order.orderNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl border border-white/[0.1] text-[#9ca3af] hover:text-white hover:border-white/[0.2] transition-colors"
            title="Статус на сайте"
          >
            <FileText className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
            title="Удалить заказ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Удалить заказ?"
        message={`Заказ ${order.orderNumber} будет удалён без возможности восстановления.`}
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
