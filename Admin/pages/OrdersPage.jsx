import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Archive, Check, CheckCheck, CheckSquare,
  ChevronDown, Download, ExternalLink, Flame, Loader2,
  MoreHorizontal, Package, Plus, RefreshCw, Search,
  Square, Trash2, X, Zap, Calendar,
} from 'lucide-react';
import PhoneMaskInput from '../components/ui/PhoneMaskInput';
import { PageHeader, ConfirmModal } from '../components/ui';
import { ORDER_STATUSES } from '../../src/data/orderStatuses';
import {
  createOrderAdmin,
  deleteOrderAdmin,
  fetchOrdersAdmin,
  updateOrderAdmin,
} from '../../src/api/ordersApi';
import {
  STATUS_CONFIG,
  isOverdue,
  isStale,
  isReadyUnpicked,
  isAwaitingApprovalStale,
  getAttentionLabel,
  matchesOrderSearch,
  getWarrantyDaysLeft,
  warrantyBadge,
  computeOrderTotal,
  formatDate,
  formatDt,
} from './orders/orderAdminUtils';
import OrderSlideOver from './orders/OrderSlideOver';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function exportCSV(orders) {
  const cols = ['Номер', 'Статус', 'Клиент', 'Телефон', 'Устройство', 'Сумма', 'Предоплата', 'Менеджер', 'Создан', 'Комментарий'];
  const rows = orders.map(o => [
    o.orderNumber ?? '',
    STATUS_CONFIG[o.status]?.label ?? o.status,
    o.clientName ?? '',
    o.clientPhone ?? '',
    o.device ?? '',
    o.cost ?? '',
    o.prepayment ?? '',
    o.managerName ?? '',
    formatDate(o.createdAt),
    o.publicComment ?? '',
  ]);
  const csv = [cols, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, small = false }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.accepted;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'} ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── StatusDropdown (inline quick-change) ─────────────────────────────────────

function StatusDropdown({ currentStatus, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 w-48 bg-[#1a1d22] border border-white/[0.12] rounded-xl shadow-2xl py-1 overflow-hidden"
    >
      {ORDER_STATUSES.map(s => {
        const c = STATUS_CONFIG[s.id];
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => { onSelect(s.id); onClose(); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-white/[0.06] transition-colors text-left ${currentStatus === s.id ? 'bg-white/[0.04]' : ''}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${c?.dot ?? 'bg-gray-400'}`} />
            <span className="text-white">{s.label}</span>
            {currentStatus === s.id && <Check className="w-3.5 h-3.5 text-[#84CC16] ml-auto" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── OrderIndicators ──────────────────────────────────────────────────────────

function OrderIndicators({ order }) {
  const flags = [];
  if (isOverdue(order)) flags.push({ key: 'ov', icon: AlertTriangle, title: 'Просрочен', cls: 'text-red-400' });
  if (isStale(order)) flags.push({ key: 'st', icon: Flame, title: 'Нет движения 3+ дн.', cls: 'text-orange-400' });
  if (isReadyUnpicked(order)) flags.push({ key: 'rp', icon: Zap, title: 'Готово 7+ дн., не забирают', cls: 'text-amber-300' });
  if (isAwaitingApprovalStale(order)) flags.push({ key: 'aa', icon: Archive, title: 'Ожидает согласования 24+ ч.', cls: 'text-orange-300' });
  else if (order.status === 'ready') flags.push({ key: 'rd', icon: Zap, title: 'Готов к выдаче', cls: 'text-[#84CC16]' });
  if (order.cost && !order.costConfirmed) flags.push({ key: 'un', icon: AlertTriangle, title: 'Оплата не подтверждена', cls: 'text-amber-400' });
  if (!flags.length) return null;
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {flags.map(({ key, icon: Icon, title, cls }) => (
        <Icon key={key} className={`w-3 h-3 ${cls}`} title={title} />
      ))}
    </span>
  );
}

// ─── STATS definitions ────────────────────────────────────────────────────────

const STATS_DEF = [
  {
    id: 'all',
    label: 'Все активные',
    filter: o => o.status !== 'completed' && o.status !== 'cancelled',
    color: 'text-white',
    accent: 'border-white/[0.1] hover:border-white/[0.2]',
    activeAccent: 'border-white/[0.3] bg-white/[0.04]',
  },
  {
    id: 'accepted',
    label: 'Принято',
    filter: o => o.status === 'accepted',
    color: 'text-blue-300',
    accent: 'border-blue-500/20 hover:border-blue-500/40',
    activeAccent: 'border-blue-500/50 bg-blue-500/[0.07]',
  },
  {
    id: 'in_progress',
    label: 'В работе',
    filter: o => o.status === 'in_progress' || o.status === 'diagnostics' || o.status === 'waiting_parts',
    color: 'text-amber-200',
    accent: 'border-amber-500/20 hover:border-amber-500/40',
    activeAccent: 'border-amber-500/50 bg-amber-500/[0.07]',
  },
  {
    id: 'ready',
    label: 'Готово',
    filter: o => o.status === 'ready',
    color: 'text-[#84CC16]',
    accent: 'border-[#84CC16]/20 hover:border-[#84CC16]/40',
    activeAccent: 'border-[#84CC16]/50 bg-[#84CC16]/[0.07]',
  },
  {
    id: 'completed',
    label: 'Выдано',
    filter: o => o.status === 'completed',
    color: 'text-[#9ca3af]',
    accent: 'border-white/[0.08] hover:border-white/[0.15]',
    activeAccent: 'border-white/[0.2] bg-white/[0.03]',
  },
  {
    id: 'cancelled',
    label: 'Отменено',
    filter: o => o.status === 'cancelled',
    color: 'text-red-300',
    accent: 'border-red-500/15 hover:border-red-500/30',
    activeAccent: 'border-red-500/40 bg-red-500/[0.05]',
  },
];

// ─── StatsBar ──────────────────────────────────────────────────────────────────

function StatsBar({ orders, activeFilter, onFilter }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
      {STATS_DEF.map(s => {
        const count = orders.filter(s.filter).length;
        const isActive = activeFilter === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onFilter(isActive ? null : s.id)}
            className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
              isActive ? s.activeAccent : s.accent + ' bg-[#14161a]'
            }`}
          >
            <span className={`text-[22px] font-bold leading-none ${s.color}`}>{count}</span>
            <span className="text-[11px] text-[#6b7280] mt-1 leading-tight">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── FilterBar ─────────────────────────────────────────────────────────────────

function FilterBar({ search, onSearch, filterStatus, onStatus, filterManager, onManager, managers, loading, onRefresh, onNew, onExport, totalFiltered, totalAll }) {

  const uniqueStatuses = [{ id: '', label: 'Все статусы' }, ...ORDER_STATUSES];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563] pointer-events-none" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Поиск: номер, клиент, телефон, устройство…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#f3f4f6] text-[13.5px] placeholder:text-[#4b5563] focus:outline-none focus:border-[#84CC16]/40 focus:ring-1 focus:ring-[#84CC16]/20 transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="relative shrink-0">
        <select
          value={filterStatus}
          onChange={e => onStatus(e.target.value)}
          className="pl-3 pr-8 py-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#f3f4f6] text-[13px] appearance-none focus:outline-none focus:border-white/[0.2] transition-colors"
        >
          {uniqueStatuses.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280] pointer-events-none" />
      </div>

      {/* Manager filter */}
      {managers.length > 0 && (
        <div className="relative shrink-0">
          <select
            value={filterManager}
            onChange={e => onManager(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#f3f4f6] text-[13px] appearance-none focus:outline-none focus:border-white/[0.2] transition-colors"
          >
            <option value="">Все менеджеры</option>
            {managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280] pointer-events-none" />
        </div>
      )}

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="p-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#9ca3af] hover:text-white hover:border-white/[0.16] transition-colors shrink-0"
        title="Обновить"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>

      <button
        type="button"
        onClick={onExport}
        className="p-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#9ca3af] hover:text-white hover:border-white/[0.16] transition-colors shrink-0"
        title="Экспорт CSV"
      >
        <Download className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13.5px] hover:bg-[#9be02a] transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        Новый заказ
      </button>
    </div>
  );
}

// ─── OrderRow ──────────────────────────────────────────────────────────────────

function OrderRow({ order, selected, onSelect, onOpen, onQuickStatus, saving }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const cellRef = useRef(null);
  const overdueFlag = isOverdue(order);
  const staleFlag = isStale(order);
  const unpickedFlag = isReadyUnpicked(order);
  const warrantyLeft = order.status === 'completed' ? getWarrantyDaysLeft(order) : null;
  const wBadge = warrantyBadge(warrantyLeft);

  const leftBorder = overdueFlag
    ? 'border-l-2 border-l-red-500/50'
    : unpickedFlag
    ? 'border-l-2 border-l-amber-500/50'
    : staleFlag
    ? 'border-l-2 border-l-orange-500/40'
    : '';

  return (
    <tr
      className={`group border-b border-white/[0.04] cursor-pointer transition-colors ${
        selected ? 'bg-[#84CC16]/[0.03]' : 'hover:bg-white/[0.02]'
      } ${leftBorder}`}
    >
      {/* Checkbox */}
      <td className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onSelect(order.id)}
          className="text-[#4b5563] hover:text-[#9ca3af] transition-colors"
        >
          {selected
            ? <CheckSquare className="w-4 h-4 text-[#84CC16]" />
            : <Square className="w-4 h-4" />
          }
        </button>
      </td>

      {/* Order number */}
      <td className="px-3 py-3 w-32" onClick={() => onOpen(order.id)}>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[13px] font-semibold text-white leading-tight">
            {order.orderNumber}
          </span>
          <OrderIndicators order={order} />
        </div>
        <p className="text-[11px] text-[#4b5563] mt-0.5">{formatDate(order.createdAt)}</p>
      </td>

      {/* Status */}
      <td className="px-3 py-3 w-40" ref={cellRef}>
        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setStatusOpen(o => !o)}
            className="flex items-center gap-1"
            disabled={saving}
          >
            <StatusBadge status={order.status} small />
            <ChevronDown className="w-3 h-3 text-[#4b5563] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          {statusOpen && (
            <StatusDropdown
              currentStatus={order.status}
              onSelect={id => onQuickStatus(order.id, id)}
              onClose={() => setStatusOpen(false)}
            />
          )}
        </div>
        {/* Archive: show warranty */}
        {order.status === 'completed' && warrantyLeft !== null && (
          <p className={`text-[10px] mt-1 ${wBadge.className.includes('green') || wBadge.className.includes('84CC16') ? 'text-[#84CC16]' : 'text-amber-400'}`}>
            {wBadge.text}
          </p>
        )}
      </td>

      {/* Client */}
      <td className="px-3 py-3 min-w-0" onClick={() => onOpen(order.id)}>
        <p className="text-[13px] text-white truncate max-w-[120px]">{order.clientName || <span className="text-[#4b5563]">—</span>}</p>
        {order.clientPhone && (
          <p className="text-[11px] text-[#6b7280] truncate max-w-[120px]">{order.clientPhone}</p>
        )}
      </td>

      {/* Device */}
      <td className="px-3 py-3 hidden sm:table-cell" onClick={() => onOpen(order.id)}>
        <p className="text-[13px] text-[#e5e7eb] truncate max-w-[160px]">{order.device}</p>
        {order.reason && (
          <p className="text-[11px] text-[#6b7280] truncate max-w-[160px]">{order.reason}</p>
        )}
      </td>

      {/* Cost */}
      <td className="px-3 py-3 w-24 hidden md:table-cell" onClick={() => onOpen(order.id)}>
        {order.cost ? (
          <div>
            <p className="text-[13px] text-white font-medium">{Number(order.cost).toLocaleString('ru')} ₽</p>
            {!order.costConfirmed && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Не согл.
              </p>
            )}
          </div>
        ) : (
          <span className="text-[#4b5563] text-[13px]">—</span>
        )}
      </td>

      {/* Manager */}
      <td className="px-3 py-3 w-28 hidden lg:table-cell" onClick={() => onOpen(order.id)}>
        <p className="text-[13px] text-[#9ca3af] truncate">{order.managerName || '—'}</p>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 w-10">
        <button
          type="button"
          onClick={() => onOpen(order.id)}
          className="p-1.5 rounded-lg text-[#4b5563] opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── MobileCard ────────────────────────────────────────────────────────────────

function MobileCard({ order, selected, onSelect, onOpen, onQuickStatus }) {
  return (
    <div
      className={`relative border rounded-xl p-4 transition-colors ${
        selected ? 'border-[#84CC16]/30 bg-[#84CC16]/[0.03]' : 'border-white/[0.08] bg-[#14161a]'
      } ${isOverdue(order) ? 'border-l-2 border-l-red-500/50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onSelect(order.id)} className="mt-0.5 shrink-0 text-[#4b5563]">
          {selected ? <CheckSquare className="w-4 h-4 text-[#84CC16]" /> : <Square className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0" onClick={() => onOpen(order.id)}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-[13px] font-bold text-white">{order.orderNumber}</span>
            <StatusBadge status={order.status} small />
          </div>
          <p className="text-[14px] text-[#e5e7eb] truncate">{order.device}</p>
          {(order.clientName || order.clientPhone) && (
            <p className="text-[12px] text-[#6b7280] mt-1">
              {order.clientName}{order.clientName && order.clientPhone ? ' · ' : ''}{order.clientPhone}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            {order.cost
              ? <span className="text-[13px] font-medium text-white">{Number(order.cost).toLocaleString('ru')} ₽</span>
              : <span />
            }
            <span className="text-[11px] text-[#4b5563]">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>
      <OrderIndicators order={order} />
    </div>
  );
}

// ─── BulkActionBar ─────────────────────────────────────────────────────────────

function BulkActionBar({ count, orders, selectedIds, onClear, onBulkStatus, onBulkDelete, onBulkExport }) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1a1d22] border border-white/[0.15] shadow-2xl backdrop-blur-sm">
        <button type="button" onClick={onClear} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors">
          <X className="w-4 h-4" />
        </button>

        <span className="text-[13px] font-semibold text-white px-2 border-r border-white/[0.1] mr-1">
          {count} выбрано
        </span>

        {/* Bulk status change */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#e5e7eb] text-[12.5px] font-medium transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Статус
            <ChevronDown className="w-3 h-3" />
          </button>
          {statusOpen && (
            <div className="absolute bottom-full mb-2 left-0 z-50 w-48 bg-[#1a1d22] border border-white/[0.12] rounded-xl shadow-2xl py-1 overflow-hidden">
              {ORDER_STATUSES.map(s => {
                const c = STATUS_CONFIG[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { onBulkStatus(s.id); setStatusOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-white/[0.06] text-white text-left"
                  >
                    <span className={`w-2 h-2 rounded-full ${c?.dot ?? 'bg-gray-400'}`} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onBulkExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#e5e7eb] text-[12.5px] font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Экспорт
        </button>

        <button
          type="button"
          onClick={() => setConfirmDel(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-[12.5px] font-medium transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Удалить
        </button>
      </div>

      <ConfirmModal
        open={confirmDel}
        title={`Удалить ${count} заказ(а)?`}
        message="Это действие необратимо."
        confirmLabel="Удалить всё"
        onConfirm={() => { setConfirmDel(false); onBulkDelete(); }}
        onCancel={() => setConfirmDel(false)}
      />
    </>
  );
}

// ─── CreateModal constants ─────────────────────────────────────────────────────

const BRANDS = ['iPhone', 'Samsung', 'Xiaomi', 'Redmi', 'POCO', 'Realme', 'Huawei', 'iPad', 'MacBook', 'Другое'];

const REASONS = [
  'Замена дисплея', 'Замена аккумулятора', 'Замена разъема зарядки',
  'Замена задней крышки', 'Замена корпуса', 'Замена камеры',
  'Замена динамика', 'Замена микрофона', 'Замена кнопок',
  'Не включается', 'После попадания влаги', 'Диагностика', 'Другое',
];

const APPEARANCES = [
  'Без повреждений', 'Царапины и потертости', 'Разбита задняя крышка',
  'Разбито стекло', 'Вмятины на корпусе', 'Следы вскрытия',
  'Следы влаги', 'Потертости корпуса',
];

const KIT_ITEMS = [
  'Телефон', 'SIM карта', 'Карта памяти', 'Кабель',
  'Зарядное устройство', 'Коробка', 'Чехол', 'Документы',
];

const READY_OFFSETS = [
  { label: '+1 д', days: 1 }, { label: '+3 д', days: 3 },
  { label: '+5 д', days: 5 }, { label: '+7 д', days: 7 },
  { label: '+14 д', days: 14 },
];

function todayPlusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatReadyDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch { return iso; }
}

const EMPTY_FORM = {
  brand: '', model: '', serialNumber: '',
  clientName: '', clientPhone: '',
  reason: '', reasonCustom: '',
  appearances: [], appearanceCustom: '',
  kit: new Set(['Телефон']), kitComment: '',
  estimatedReadyAt: todayPlusDays(3),
  estimatedCost: '',
  managerName: '', masterName: '',
  status: 'accepted',
};

// ─── CreateModal ───────────────────────────────────────────────────────────────

function CreateModal({ open, onCreate, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reasonSearch, setReasonSearch] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13.5px] placeholder:text-[#4b5563] focus:outline-none focus:border-[#84CC16]/50 focus:ring-1 focus:ring-[#84CC16]/20 transition-colors';
  const labelCls = 'block text-[11px] text-[#9ca3af] mb-1.5 font-medium uppercase tracking-wide';
  const chipBase = 'px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap border';
  const chipOff = `${chipBase} bg-white/[0.04] border-white/[0.08] text-[#9ca3af] hover:border-white/[0.18] hover:text-white`;
  const chipOn = `${chipBase} bg-[#84CC16]/15 border-[#84CC16]/40 text-[#84CC16]`;

  const toggleAppearance = (v) => set('appearances',
    form.appearances.includes(v) ? form.appearances.filter(x => x !== v) : [...form.appearances, v]
  );
  const toggleKit = (v) => {
    const next = new Set(form.kit);
    next.has(v) ? next.delete(v) : next.add(v);
    set('kit', next);
  };

  const filteredReasons = reasonSearch
    ? REASONS.filter(r => r.toLowerCase().includes(reasonSearch.toLowerCase()))
    : REASONS;

  const buildPayload = () => {
    const device = [form.brand !== 'Другое' ? form.brand : '', form.model].filter(Boolean).join(' ').trim() || 'Устройство';
    const kitArr = [...form.kit];
    if (form.kitComment.trim()) kitArr.push(form.kitComment.trim());
    const appearanceArr = [...form.appearances];
    if (form.appearanceCustom.trim()) appearanceArr.push(form.appearanceCustom.trim());
    const reason = form.reason === 'Другое' ? (form.reasonCustom || 'Другое') : form.reason;
    return {
      device,
      serialNumber: form.serialNumber.trim() || undefined,
      clientName: form.clientName.trim() || undefined,
      clientPhone: form.clientPhone || undefined,
      reason: reason || undefined,
      appearance: appearanceArr.join(', ') || undefined,
      kit: kitArr.join(', ') || undefined,
      estimatedReadyAt: form.estimatedReadyAt || undefined,
      managerName: form.managerName.trim() || undefined,
      masterName: form.masterName.trim() || undefined,
      cost: form.estimatedCost !== '' ? Number(form.estimatedCost) : undefined,
      status: form.status,
      historyNote: 'Заказ создан',
    };
  };

  const handleCreate = async () => {
    const payload = buildPayload();
    if (!payload.device || payload.device === 'Устройство') { setError('Укажите устройство'); return; }
    setSaving(true); setError('');
    try {
      await onCreate(payload);
      setForm(EMPTY_FORM);
      setReasonSearch('');
      onClose();
    } catch (e) {
      setError(e.message || 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const section = (title) => (
    <p className="text-[10px] font-mono uppercase tracking-widest text-[#4b5563] pt-1 pb-0.5">{title}</p>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#14161a] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <h2 className="text-[15px] font-semibold text-white">Новый заказ</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">

          {/* ── Клиент ── */}
          {section('Клиент')}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Имя</label>
              <input className={inputCls} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Иван Петров" autoFocus />
            </div>
            <div>
              <label className={labelCls}>Телефон</label>
              <PhoneMaskInput className={inputCls} value={form.clientPhone} onChange={v => set('clientPhone', v)} />
            </div>
          </div>

          {/* ── Устройство ── */}
          {section('Устройство')}
          <div>
            <label className={labelCls}>Бренд</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {BRANDS.map(b => (
                <button key={b} type="button" onClick={() => set('brand', form.brand === b ? '' : b)}
                  className={form.brand === b ? chipOn : chipOff}>{b}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Модель *</label>
                <input className={inputCls} value={form.model} onChange={e => set('model', e.target.value)}
                  placeholder={form.brand && form.brand !== 'Другое' ? `${form.brand} …` : 'Galaxy S24, 14 Pro…'} />
              </div>
              <div>
                <label className={labelCls}>Серийный номер</label>
                <input className={inputCls} value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="IMEI / S/N (необязательно)" />
              </div>
            </div>
          </div>

          {/* ── Причина обращения ── */}
          {section('Причина обращения')}
          <div>
            <input className={`${inputCls} mb-2`} value={reasonSearch}
              onChange={e => setReasonSearch(e.target.value)} placeholder="Поиск причины…" />
            <div className="flex flex-wrap gap-1.5">
              {filteredReasons.map(r => (
                <button key={r} type="button" onClick={() => { set('reason', form.reason === r ? '' : r); setReasonSearch(''); }}
                  className={form.reason === r ? chipOn : chipOff}>{r}</button>
              ))}
            </div>
            {form.reason === 'Другое' && (
              <input className={`${inputCls} mt-2`} value={form.reasonCustom}
                onChange={e => set('reasonCustom', e.target.value)} placeholder="Опишите проблему…" />
            )}
          </div>

          {/* ── Внешний вид ── */}
          {section('Внешний вид')}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {APPEARANCES.map(a => (
                <button key={a} type="button" onClick={() => toggleAppearance(a)}
                  className={form.appearances.includes(a) ? chipOn : chipOff}>{a}</button>
              ))}
            </div>
            <input className={inputCls} value={form.appearanceCustom}
              onChange={e => set('appearanceCustom', e.target.value)} placeholder="Дополнительно…" />
          </div>

          {/* ── Комплектация ── */}
          {section('Комплектация')}
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-3 mb-2">
              {KIT_ITEMS.map(k => (
                <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                  <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    form.kit.has(k) ? 'bg-[#84CC16] border-[#84CC16]' : 'border-white/[0.18] bg-white/[0.04]'
                  }`} onClick={() => toggleKit(k)}>
                    {form.kit.has(k) && <Check className="w-3 h-3 text-[#0c0d10]" strokeWidth={3} />}
                  </span>
                  <span className="text-[13px] text-[#d1d5db]" onClick={() => toggleKit(k)}>{k}</span>
                </label>
              ))}
            </div>
            <input className={inputCls} value={form.kitComment}
              onChange={e => set('kitComment', e.target.value)} placeholder="Дополнительно…" />
          </div>

          {/* ── Ориентировочная дата ── */}
          {section('Ориентировочная готовность')}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#4b5563] shrink-0" />
              <input type="date" className={`${inputCls} flex-1`} value={form.estimatedReadyAt}
                onChange={e => set('estimatedReadyAt', e.target.value)} />
            </div>
            {form.estimatedReadyAt && (
              <p className="text-[12px] text-[#84CC16] mb-2">{formatReadyDate(form.estimatedReadyAt)}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {READY_OFFSETS.map(({ label, days }) => (
                <button key={label} type="button" onClick={() => set('estimatedReadyAt', todayPlusDays(days))}
                  className={chipOff}>{label}</button>
              ))}
            </div>
          </div>

          {/* ── Ориентировочная стоимость ── */}
          {section('Стоимость')}
          <div>
            <label className={labelCls}>Ориентировочная стоимость (₽)</label>
            <input
              type="number"
              min="0"
              step="100"
              className={inputCls}
              value={form.estimatedCost}
              onChange={e => set('estimatedCost', e.target.value)}
              placeholder="Не указана"
            />
          </div>

          {/* ── Менеджер / Мастер ── */}
          {section('Сотрудники')}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Менеджер</label>
              <input className={inputCls} value={form.managerName} onChange={e => set('managerName', e.target.value)} placeholder="Имя менеджера" />
            </div>
            <div>
              <label className={labelCls}>Мастер</label>
              <input className={inputCls} value={form.masterName} onChange={e => set('masterName', e.target.value)} placeholder="Имя мастера" />
            </div>
          </div>

          {/* ── Статус ── */}
          {section('Начальный статус')}
          <select className={`${inputCls} cursor-pointer`} value={form.status} onChange={e => set('status', e.target.value)}>
            {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          {error && (
            <p className="text-[13px] text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3 shrink-0">
          <button type="button" onClick={handleCreate} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13.5px] hover:bg-[#9be02a] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Создание…' : 'Создать заказ'}
          </button>
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-[#9ca3af] hover:bg-white/[0.04] transition-colors text-[13.5px]">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingIds, setSavingIds] = useState(new Set());

  // Slide-over
  const [openId, setOpenId] = useState(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterManager, setFilterManager] = useState('');
  const [statsFilter, setStatsFilter] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useDebounce(search, 250);

  // ── Load ──────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await fetchOrdersAdmin();
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err.status === 401 ? 'Сессия истекла — войдите снова' : (err.message || 'Ошибка загрузки'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [load]);

  // ── Filtered & sorted list ────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Stats filter (click on KPI card)
    if (statsFilter) {
      const def = STATS_DEF.find(s => s.id === statsFilter);
      if (def) list = list.filter(def.filter);
    }

    // Status select
    if (filterStatus) list = list.filter(o => o.status === filterStatus);

    // Manager
    if (filterManager) list = list.filter(o => o.managerName === filterManager);

    // Search
    if (debouncedSearch) list = list.filter(o => matchesOrderSearch(o, debouncedSearch));

    // Sort: overdue first, then by updatedAt
    list.sort((a, b) => {
      const aOv = isOverdue(a) ? 1 : 0;
      const bOv = isOverdue(b) ? 1 : 0;
      if (aOv !== bOv) return bOv - aOv;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    return list;
  }, [orders, statsFilter, filterStatus, filterManager, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statsFilter, filterStatus, filterManager, debouncedSearch]);

  // ── Managers list ─────────────────────────────────────────────────
  const managers = useMemo(() => {
    const set = new Set(orders.map(o => o.managerName).filter(Boolean));
    return [...set].sort();
  }, [orders]);

  // ── Slide-over order ──────────────────────────────────────────────
  const openOrder = useMemo(() => orders.find(o => o.id === openId) ?? null, [orders, openId]);

  const handleOpen = (id) => {
    setOpenId(id);
    setSlideOverOpen(true);
  };
  const handleClose = () => {
    setSlideOverOpen(false);
    setTimeout(() => setOpenId(null), 300);
  };

  // ── Quick status change from table row ────────────────────────────
  const handleQuickStatus = async (orderId, newStatus) => {
    setSavingIds(s => new Set(s).add(orderId));
    try {
      const statusLabel = STATUS_CONFIG[newStatus]?.label ?? newStatus;
      await updateOrderAdmin(orderId, { status: newStatus, statusNote: statusLabel });
      await load(true);
    } catch (e) {
      setError(e.message || 'Ошибка обновления');
    } finally {
      setSavingIds(s => { const n = new Set(s); n.delete(orderId); return n; });
    }
  };

  // ── Slide-over save ───────────────────────────────────────────────
  const handleSave = async (id, patch) => {
    await updateOrderAdmin(id, patch);
    await load(true);
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    await deleteOrderAdmin(id);
    await load(true);
  };

  // ── Create ────────────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    await createOrderAdmin(payload);
    await load(true);
  };

  // ── Selection ─────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pagedOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedOrders.map(o => o.id)));
    }
  };

  // ── Bulk actions ──────────────────────────────────────────────────
  const handleBulkStatus = async (newStatus) => {
    const ids = [...selectedIds];
    const statusLabel = STATUS_CONFIG[newStatus]?.label ?? newStatus;
    for (const id of ids) {
      try { await updateOrderAdmin(id, { status: newStatus, statusNote: statusLabel }); } catch {}
    }
    await load(true);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of [...selectedIds]) {
      try { await deleteOrderAdmin(id); } catch {}
    }
    await load(true);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = orders.filter(o => selectedIds.has(o.id));
    exportCSV(selected);
  };

  // ── Stats filter toggle ───────────────────────────────────────────
  const handleStatsFilter = (id) => {
    setStatsFilter(id);
    setFilterStatus('');
  };

  const allPageSelected = pagedOrders.length > 0 && pagedOrders.every(o => selectedIds.has(o.id));
  const somePageSelected = pagedOrders.some(o => selectedIds.has(o.id));

  return (
    <>
      <div className="pb-24">
        <PageHeader
          title="Заказы"
          description="Управление всеми заказами — поиск, фильтрация, быстрое редактирование."
          actions={
            <a
              href="/status-zakaza"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px] hover:text-white hover:border-white/[0.2] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Статус на сайте
            </a>
          }
        />

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-[14px] text-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button type="button" onClick={() => setError('')} className="ml-auto p-0.5 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Attention alerts */}
        {(() => {
          const overdue = orders.filter(o => isOverdue(o));
          const stale = orders.filter(o => isStale(o) && !isOverdue(o));
          const unpicked = orders.filter(o => isReadyUnpicked(o));
          const approval = orders.filter(o => isAwaitingApprovalStale(o));
          const items = [
            overdue.length && { key: 'ov', cls: 'border-red-500/30 bg-red-500/[0.06] text-red-300', icon: AlertTriangle, label: `${overdue.length} просроч.` },
            unpicked.length && { key: 'rp', cls: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-300', icon: Zap, label: `${unpicked.length} не забирают 7+ дн.` },
            approval.length && { key: 'ap', cls: 'border-orange-500/30 bg-orange-500/[0.06] text-orange-300', icon: Archive, label: `${approval.length} ждут согласования` },
            stale.length && { key: 'st', cls: 'border-orange-500/20 bg-orange-500/[0.04] text-orange-300', icon: Flame, label: `${stale.length} без движения 3+ дн.` },
          ].filter(Boolean);
          if (!items.length) return null;
          return (
            <div className="flex flex-wrap gap-2 mb-4">
              {items.map(({ key, cls, icon: Icon, label }) => (
                <div key={key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium ${cls}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Stats bar */}
        <StatsBar orders={orders} activeFilter={statsFilter} onFilter={handleStatsFilter} />

        {/* Filter bar */}
        <FilterBar
          search={search}
          onSearch={setSearch}
          filterStatus={filterStatus}
          onStatus={v => { setFilterStatus(v); setStatsFilter(null); }}
          filterManager={filterManager}
          onManager={setFilterManager}
          managers={managers}
          loading={loading}
          onRefresh={load}
          onNew={() => setCreating(true)}
          onExport={() => exportCSV(filteredOrders)}
          totalFiltered={filteredOrders.length}
          totalAll={orders.length}
        />

        {/* Results count */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[12px] text-[#6b7280]">
            {loading ? 'Загрузка…' : `${filteredOrders.length} из ${orders.length} заказов`}
            {selectedIds.size > 0 && ` · ${selectedIds.size} выбрано`}
          </p>
          {(statsFilter || filterStatus || filterManager || search) && (
            <button
              type="button"
              onClick={() => { setStatsFilter(null); setFilterStatus(''); setFilterManager(''); setSearch(''); }}
              className="text-[12px] text-[#84CC16] hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Сбросить фильтры
            </button>
          )}
        </div>

        {/* ── Desktop Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#84CC16]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-10 h-10 text-[#4b5563] mb-3" />
            <p className="text-[15px] text-[#9ca3af]">
              {orders.length === 0 ? 'Заказов пока нет' : 'Ничего не найдено'}
            </p>
            <p className="text-[13px] text-[#6b7280] mt-1">
              {orders.length === 0
                ? 'Создайте первый заказ кнопкой «Новый заказ»'
                : 'Попробуйте изменить фильтры или поисковый запрос'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-white/[0.06] bg-[#14161a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-3 py-3 w-10">
                        <button type="button" onClick={toggleAll} className="text-[#4b5563] hover:text-white transition-colors">
                          {allPageSelected
                            ? <CheckSquare className="w-4 h-4 text-[#84CC16]" />
                            : somePageSelected
                            ? <CheckSquare className="w-4 h-4 text-[#6b7280]" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563] w-32">Заказ</th>
                      <th className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563] w-40">Статус</th>
                      <th className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563]">Клиент</th>
                      <th className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563] hidden sm:table-cell">Устройство</th>
                      <th className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563] w-24 hidden md:table-cell">Сумма</th>
                      <th className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563] w-28 hidden lg:table-cell">Менеджер</th>
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.map(order => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        selected={selectedIds.has(order.id)}
                        onSelect={toggleSelect}
                        onOpen={handleOpen}
                        onQuickStatus={handleQuickStatus}
                        saving={savingIds.has(order.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {pagedOrders.map(order => (
                <MobileCard
                  key={order.id}
                  order={order}
                  selected={selectedIds.has(order.id)}
                  onSelect={toggleSelect}
                  onOpen={handleOpen}
                  onQuickStatus={handleQuickStatus}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-[13px] text-[#9ca3af] hover:text-white hover:border-white/[0.2] disabled:opacity-40 transition-colors"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                      p === page
                        ? 'bg-[#84CC16]/15 text-[#84CC16] border border-[#84CC16]/25'
                        : 'border border-white/[0.08] text-[#9ca3af] hover:text-white hover:border-white/[0.2]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-[13px] text-[#9ca3af] hover:text-white hover:border-white/[0.2] disabled:opacity-40 transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-over */}
      <OrderSlideOver
        order={openOrder}
        open={slideOverOpen}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        orders={orders}
        selectedIds={selectedIds}
        onClear={() => setSelectedIds(new Set())}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
      />

      {/* Create modal */}
      <CreateModal
        open={creating}
        onCreate={handleCreate}
        onClose={() => setCreating(false)}
      />
    </>
  );
}
