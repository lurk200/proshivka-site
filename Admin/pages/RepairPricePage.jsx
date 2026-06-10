import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSiteDraft } from '../hooks/useSiteDraft';
import { PageHeader, AdminCard, AdminTabs, Field, Input, SaveBar } from '../components/ui';
import {
  REPAIR_TIER_KEYS,
  REPAIR_TIER_LABELS,
  repairTypeLabel,
} from '../../src/data/repairPriceSettings';
import {
  MARKET_PRICE_REFERENCE,
  PRICING_STRATEGY_HINTS,
  computeRepairPricing,
} from '../../src/data/repairPriceMarkup';
import {
  fetchAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  bulkAdminServices,
  exportServicesCsvUrl,
  fetchAdminSuppliers,
  createAdminSupplier,
  updateAdminSupplier,
  deleteAdminSupplier,
  fetchAdminSearchAnalytics,
  markServicesChecked,
} from '../../src/prise/api/repairPriceApi';
import {
  Archive, BarChart2, Check, ChevronDown, Download, Edit2, Package, Plus, RefreshCw,
  Search, Star, Trash2, TrendingUp, X, AlertTriangle, Building2, ExternalLink,
} from 'lucide-react';

// ── Shared helpers ────────────────────────────────────────────────────────────

function NumInput({ value, onChange, min, max, step = 1 }) {
  return (
    <Input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-[14px] font-semibold text-white border-b border-white/[0.06] pb-2 mb-4">
      {children}
    </h3>
  );
}

function Badge({ children, color = 'gray' }) {
  const cls = {
    gray: 'bg-white/[0.06] text-[#9ca3af]',
    lime: 'bg-[#84CC16]/15 text-[#84CC16]',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-500/15 text-red-400',
    blue: 'bg-blue-500/15 text-blue-400',
  }[color] ?? 'bg-white/[0.06] text-[#9ca3af]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

// ── Metadata maps ─────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { id: 'replace', label: 'Замена' },
  { id: 'repair', label: 'Ремонт' },
  { id: 'diagnostic', label: 'Диагностика' },
];

const DEVICE_OPTIONS = [
  { id: 'smartphone', label: 'Смартфон' },
  { id: 'tablet', label: 'Планшет' },
  { id: 'laptop', label: 'Ноутбук' },
];

const PART_OPTIONS = [
  { id: 'display', label: 'Дисплей' },
  { id: 'battery', label: 'Аккумулятор' },
  { id: 'port', label: 'Разъём зарядки' },
  { id: 'camera', label: 'Камера' },
  { id: 'speaker', label: 'Динамик' },
  { id: 'button', label: 'Кнопки' },
  { id: 'cover', label: 'Корпус/Крышка' },
  { id: 'keyboard', label: 'Клавиатура' },
  { id: 'other', label: 'Прочее' },
];

function catLabel(id) { return CATEGORY_OPTIONS.find(o => o.id === id)?.label ?? id; }
function devLabel(id) { return DEVICE_OPTIONS.find(o => o.id === id)?.label ?? id; }
function partLbl(id) { return PART_OPTIONS.find(o => o.id === id)?.label ?? id; }

function formatPrice(svc) {
  if (svc.price != null) return `${Number(svc.price).toLocaleString('ru')} ₽`;
  const from = svc.priceFrom != null ? `от ${Number(svc.priceFrom).toLocaleString('ru')}` : '';
  const to = svc.priceTo != null ? `до ${Number(svc.priceTo).toLocaleString('ru')}` : '';
  if (from && to) return `${Number(svc.priceFrom).toLocaleString('ru')} – ${Number(svc.priceTo).toLocaleString('ru')} ₽`;
  if (from) return `${from} ₽`;
  if (to) return `${to} ₽`;
  return '—';
}

// ── Service form modal ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', description: '',
  category: 'replace', deviceType: 'smartphone', partType: 'display', brand: '',
  price: '', priceFrom: '', priceTo: '',
  laborCost: '', partCost: '',
  duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
  popularity: 50, supplierId: '', available: true,
};

function ServiceFormModal({ initial, suppliers, onSave, onClose, saving }) {
  const [form, setForm] = useState(() => initial ? {
    ...EMPTY_FORM,
    ...initial,
    price: initial.price ?? '',
    priceFrom: initial.priceFrom ?? '',
    priceTo: initial.priceTo ?? '',
    laborCost: initial.laborCost ?? '',
    partCost: initial.partCost ?? '',
    brand: initial.brand ?? '',
    supplierId: initial.supplierId ?? '',
  } : EMPTY_FORM);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: form.price !== '' ? Number(form.price) : null,
      priceFrom: form.priceFrom !== '' ? Number(form.priceFrom) : null,
      priceTo: form.priceTo !== '' ? Number(form.priceTo) : null,
      laborCost: form.laborCost !== '' ? Number(form.laborCost) : null,
      partCost: form.partCost !== '' ? Number(form.partCost) : null,
      brand: form.brand || null,
      supplierId: form.supplierId || null,
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0f1014] rounded-2xl border border-white/[0.1] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#0f1014] border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-white">{initial ? 'Редактировать услугу' : 'Добавить услугу'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Название услуги *">
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Замена дисплея iPhone" required />
          </Field>
          <Field label="Описание">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[14px] outline-none focus:border-white/[0.2] resize-none"
              placeholder="Краткое описание для клиентов"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Категория">
              <select className="w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13px] outline-none"
                value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORY_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Устройство">
              <select className="w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13px] outline-none"
                value={form.deviceType} onChange={e => set('deviceType', e.target.value)}>
                {DEVICE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Тип детали">
              <select className="w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13px] outline-none"
                value={form.partType} onChange={e => set('partType', e.target.value)}>
                {PART_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Бренд (пусто = все бренды)">
            <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Apple, Samsung, Xiaomi..." />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Фиксир. цена, ₽" hint="Если 0 — используются Min/Max">
              <Input type="number" min={0} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Цена от, ₽">
              <Input type="number" min={0} value={form.priceFrom} onChange={e => set('priceFrom', e.target.value)} placeholder="2500" />
            </Field>
            <Field label="Цена до, ₽">
              <Input type="number" min={0} value={form.priceTo} onChange={e => set('priceTo', e.target.value)} placeholder="8000" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Стоимость работы, ₽" hint="Внутренняя — не показывается клиентам">
              <Input type="number" min={0} value={form.laborCost} onChange={e => set('laborCost', e.target.value)} placeholder="1500" />
            </Field>
            <Field label="Закупочная цена детали, ₽" hint="Внутренняя">
              <Input type="number" min={0} value={form.partCost} onChange={e => set('partCost', e.target.value)} placeholder="3200" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Срок выполнения">
              <Input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="1–2 часа" />
            </Field>
            <Field label="Поставщик">
              <select className="w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13px] outline-none"
                value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                <option value="">— не указан —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Популярность (0–100)">
              <Input type="number" min={0} max={100} value={form.popularity}
                onChange={e => set('popularity', Number(e.target.value))} />
            </Field>
            <Field label="Множитель экспресс">
              <Input type="number" min={1} max={3} step={0.1} value={form.expressMultiplier}
                onChange={e => set('expressMultiplier', Number(e.target.value))} />
            </Field>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-[13.5px] text-[#d1d5db] cursor-pointer">
              <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} className="rounded border-white/20" />
              Доступна клиентам
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-[#d1d5db] cursor-pointer">
              <input type="checkbox" checked={form.hasExpress} onChange={e => set('hasExpress', e.target.checked)} className="rounded border-white/20" />
              Экспресс-ремонт
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/[0.1] text-[#9ca3af] hover:text-white text-[13.5px] font-medium transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13.5px] hover:bg-[#a3e635] transition-colors disabled:opacity-60">
              {saving ? 'Сохраняем...' : initial ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bulk price adjust modal ───────────────────────────────────────────────────

function BulkPriceModal({ count, onApply, onClose }) {
  const [mode, setMode] = useState('percent');
  const [value, setValue] = useState(10);

  const multiplier = mode === 'percent' ? (100 + value) / 100 : null;
  const preview = mode === 'percent'
    ? `× ${multiplier?.toFixed(2)} (цены ${value >= 0 ? '+' : ''}${value}%)`
    : 'задать прямые значения';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1014] rounded-2xl border border-white/[0.1] p-5 w-full max-w-sm shadow-2xl">
        <h3 className="text-[15px] font-semibold text-white mb-4">Изменить цены ({count} услуг)</h3>
        <Field label="Режим">
          <select className="w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13px]"
            value={mode} onChange={e => setMode(e.target.value)}>
            <option value="percent">На % от текущей</option>
          </select>
        </Field>
        <Field label={`${value >= 0 ? '+' : ''}%, изменение`}>
          <Input type="number" min={-90} max={200} step={1} value={value} onChange={e => setValue(Number(e.target.value))} />
        </Field>
        <p className="text-[12px] text-[#6b7280] mt-1 mb-4">{preview}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px]">Отмена</button>
          <button type="button" onClick={() => onApply(multiplier)}
            className="flex-1 h-9 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px] hover:bg-[#a3e635]">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── History popover ───────────────────────────────────────────────────────────

function HistoryPopover({ history, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#0f1014] rounded-2xl border border-white/[0.1] p-5 w-full max-w-sm shadow-2xl max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-white">История изменений</h3>
          <button type="button" onClick={onClose} className="text-[#6b7280] hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {(!history || history.length === 0) ? (
          <p className="text-[13px] text-[#6b7280]">Нет истории</p>
        ) : (
          <div className="space-y-2">
            {[...history].reverse().map((h, i) => (
              <div key={i} className="text-[12px] border-b border-white/[0.04] pb-2">
                <span className="text-[#9ca3af]">{new Date(h.at).toLocaleString('ru')}</span>
                {' · '}
                <span className="text-white">{h.action === 'created' ? 'Создана' : h.action === 'updated' ? 'Изменена' : h.action === 'bulk_update' ? 'Массовое обновление' : h.action === 'price_adjust' ? `Цена ×${h.multiplier}` : h.action}</span>
                {h.changes && Object.keys(h.changes).length > 0 && (
                  <ul className="mt-1 ml-2 space-y-0.5 text-[#6b7280]">
                    {Object.entries(h.changes).map(([k, { from, to }]) => (
                      <li key={k}>{k}: <span className="line-through text-red-400">{String(from)}</span> → <span className="text-[#84CC16]">{String(to)}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline price cell ─────────────────────────────────────────────────────────

function PriceCell({ svc, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  const startEdit = () => {
    setVal(svc.price != null ? String(svc.price) : String(svc.priceFrom ?? ''));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const commit = () => {
    setEditing(false);
    const n = val !== '' ? Number(val) : null;
    if (n !== (svc.price ?? svc.priceFrom ?? null)) {
      onSave(svc.price != null ? { price: n } : { priceFrom: n });
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-24 px-2 py-1 rounded bg-[#0c0d10] border border-[#84CC16]/40 text-white text-[13px] outline-none"
        type="number"
        min={0}
      />
    );
  }

  return (
    <button type="button" onClick={startEdit}
      className="group flex items-center gap-1 text-[13px] text-[#84CC16] hover:text-white transition-colors text-left">
      {formatPrice(svc)}
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}

// ── Freshness dot ─────────────────────────────────────────────────────────────

function FreshnessDot({ status }) {
  const map = {
    fresh: { cls: 'bg-emerald-400', title: 'Свежая (<30 дней)' },
    stale: { cls: 'bg-amber-400', title: 'Устаревшая (30–90 дней)' },
    outdated: { cls: 'bg-red-400', title: 'Давно не проверялась (>90 дней)' },
  };
  const { cls, title } = map[status] ?? map.outdated;
  return <span title={title} className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

// ── Services tab ──────────────────────────────────────────────────────────────

function ServicesTab({ suppliers }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterDev, setFilterDev] = useState('');
  const [filterPart, setFilterPart] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bulkPriceModal, setBulkPriceModal] = useState(false);

  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = (v) => {
    setFilterSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 250);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminServices({
        category: filterCat || undefined,
        deviceType: filterDev || undefined,
        partType: filterPart || undefined,
        search: debouncedSearch || undefined,
        archived: showArchived ? undefined : false,
      });
      setItems(data);
      setSelected(new Set());
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterDev, filterPart, debouncedSearch, showArchived]);

  useEffect(() => { load(); }, [load]);

  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s])), [suppliers]);

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(s => s.id)));
  };

  const handleSaveService = async (data) => {
    setSaving(true);
    try {
      if (editItem) await updateAdminService(editItem.id, data);
      else await createAdminService(data);
      setAddModal(false);
      setEditItem(null);
      load();
    } catch (e) {
      alert(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить услугу навсегда?')) return;
    try { await deleteAdminService(id); load(); } catch (e) { alert(e.message); }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Архивировать ${selected.size} услуг?`)) return;
    try {
      await bulkAdminServices([...selected], 'update', { patch: { archived: true } });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить ${selected.size} услуг безвозвратно?`)) return;
    try {
      await Promise.all([...selected].map(id => deleteAdminService(id)));
      load();
    } catch (e) { alert(e.message); }
  };

  const handleBulkAvailable = async (available) => {
    try {
      await bulkAdminServices([...selected], 'update', { patch: { available } });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleBulkPriceApply = async (multiplier) => {
    try {
      await bulkAdminServices([...selected], 'price_adjust', { multiplier });
      setBulkPriceModal(false);
      load();
    } catch (e) { alert(e.message); }
  };

  const handleMarkChecked = async () => {
    try { await markServicesChecked([...selected]); load(); } catch (e) { alert(e.message); }
  };

  const handleInlinePriceSave = async (svc, patch) => {
    try { await updateAdminService(svc.id, patch); load(); } catch {}
  };

  const handleToggleAvailable = async (svc) => {
    try { await updateAdminService(svc.id, { available: !svc.available }); load(); } catch {}
  };

  const exportUrl = exportServicesCsvUrl(selected.size > 0 ? [...selected] : null);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
          <Input value={filterSearch} onChange={e => handleSearch(e.target.value)}
            className="pl-8 text-[13px]" placeholder="Поиск по названию..." />
        </div>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#d1d5db] text-[13px] outline-none">
          <option value="">Все категории</option>
          {CATEGORY_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <select value={filterDev} onChange={e => setFilterDev(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#d1d5db] text-[13px] outline-none">
          <option value="">Все устройства</option>
          {DEVICE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <label className="flex items-center gap-2 text-[12.5px] text-[#9ca3af] cursor-pointer select-none">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded border-white/20" />
          Архив
        </label>

        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={load} className="p-2 rounded-xl border border-white/[0.08] text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors" title="Обновить">
            <RefreshCw className="w-4 h-4" />
          </button>
          <a href={exportUrl} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/[0.08] text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors text-[12.5px]">
            <Download className="w-3.5 h-3.5" />CSV
          </a>
          <button type="button" onClick={() => { setEditItem(null); setAddModal(true); }}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px] hover:bg-[#a3e635] transition-colors">
            <Plus className="w-4 h-4" />Добавить
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-[#84CC16]/[0.08] border border-[#84CC16]/20">
          <span className="text-[12.5px] text-[#84CC16] font-medium">{selected.size} выбрано</span>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            <button type="button" onClick={() => handleBulkAvailable(true)} className="text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-white transition-colors flex items-center gap-1">
              <Check className="w-3 h-3" />Показать
            </button>
            <button type="button" onClick={() => handleBulkAvailable(false)} className="text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-white transition-colors flex items-center gap-1">
              <X className="w-3 h-3" />Скрыть
            </button>
            <button type="button" onClick={() => setBulkPriceModal(true)} className="text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-white transition-colors">
              Изменить цену
            </button>
            <button type="button" onClick={handleMarkChecked} className="text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Check className="w-3 h-3" />Проверено
            </button>
            <button type="button" onClick={handleBulkArchive} className="text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-amber-400 transition-colors flex items-center gap-1">
              <Archive className="w-3 h-3" />Архив
            </button>
            <button type="button" onClick={handleBulkDelete} className="text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" />Удалить
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-2 text-[13px] text-amber-400 mb-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      ) : null}

      {/* Table */}
      <AdminCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th className="px-4 py-3 w-9">
                  <input type="checkbox" className="rounded border-white/20"
                    checked={items.length > 0 && selected.size === items.length}
                    onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 font-medium text-[#6b7280]">Название</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden md:table-cell">Категория</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden lg:table-cell">Устройство</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden lg:table-cell">Деталь</th>
                <th className="px-3 py-3 font-medium text-[#6b7280]">Цена</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden xl:table-cell">Срок</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden xl:table-cell">Поставщик</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden 2xl:table-cell w-8" title="Актуальность цены">🔄</th>
                <th className="px-3 py-3 font-medium text-[#6b7280]">Статус</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td colSpan={10} className="px-4 py-3">
                      <div className="h-4 rounded bg-white/[0.04] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#6b7280]">
                    Услуги не найдены
                  </td>
                </tr>
              ) : (
                items.map(svc => (
                  <tr key={svc.id}
                    className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${svc.archived ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-white/20"
                        checked={selected.has(svc.id)}
                        onChange={e => {
                          const next = new Set(selected);
                          e.target.checked ? next.add(svc.id) : next.delete(svc.id);
                          setSelected(next);
                        }} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white leading-snug">{svc.name}</p>
                      {svc.brand && <p className="text-[11px] text-[#4b5563] mt-0.5">{svc.brand}</p>}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <Badge color="gray">{catLabel(svc.category)}</Badge>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-[#9ca3af]">{devLabel(svc.deviceType)}</td>
                    <td className="px-3 py-3 hidden lg:table-cell text-[#9ca3af]">{partLbl(svc.partType)}</td>
                    <td className="px-3 py-3">
                      <PriceCell svc={svc} onSave={patch => handleInlinePriceSave(svc, patch)} />
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell text-[#9ca3af]">{svc.duration}</td>
                    <td className="px-3 py-3 hidden xl:table-cell text-[#6b7280]">
                      {svc.supplierId ? (supplierMap[svc.supplierId]?.name ?? svc.supplierId) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => handleToggleAvailable(svc)}>
                        <Badge color={svc.archived ? 'red' : svc.available ? 'lime' : 'gray'}>
                          {svc.archived ? 'Архив' : svc.available ? 'Активна' : 'Скрыта'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button type="button" onClick={() => setHistoryItem(svc)}
                          className="p-1.5 rounded-lg text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.06] transition-colors" title="История">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => { setEditItem(svc); setAddModal(true); }}
                          className="p-1.5 rounded-lg text-[#4b5563] hover:text-white hover:bg-white/[0.06] transition-colors" title="Редактировать">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(svc.id)}
                          className="p-1.5 rounded-lg text-[#4b5563] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors" title="Удалить">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <p className="text-[11px] text-[#4b5563] mt-2">
        {items.length} услуг{items.length === 1 ? 'а' : ''} · Клик по цене — быстрое редактирование
      </p>

      {/* Modals */}
      {(addModal || editItem) && (
        <ServiceFormModal
          initial={editItem}
          suppliers={suppliers}
          saving={saving}
          onSave={handleSaveService}
          onClose={() => { setAddModal(false); setEditItem(null); }}
        />
      )}
      {bulkPriceModal && (
        <BulkPriceModal
          count={selected.size}
          onApply={handleBulkPriceApply}
          onClose={() => setBulkPriceModal(false)}
        />
      )}
      {historyItem && (
        <HistoryPopover history={historyItem.history} onClose={() => setHistoryItem(null)} />
      )}
    </div>
  );
}

// ── Suppliers tab ─────────────────────────────────────────────────────────────

const EMPTY_SUP = { name: '', url: '', phone: '', rating: 3, note: '' };

function SupplierFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...initial } : EMPTY_SUP);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1014] rounded-2xl border border-white/[0.1] p-5 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">{initial ? 'Редактировать поставщика' : 'Добавить поставщика'}</h2>
          <button type="button" onClick={onClose} className="text-[#6b7280] hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <Field label="Название *"><Input value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
          <Field label="Сайт / URL"><Input value={form.url} onChange={e => set('url', e.target.value)} placeholder="taggsmprof.ru" /></Field>
          <Field label="Телефон"><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Рейтинг (1–5)">
            <Input type="number" min={1} max={5} value={form.rating} onChange={e => set('rating', Number(e.target.value))} />
          </Field>
          <Field label="Примечание">
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[14px] outline-none resize-none" />
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px]">Отмена</button>
            <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px]">
              {saving ? 'Сохраняем...' : initial ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuppliersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchAdminSuppliers()); } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editItem) await updateAdminSupplier(editItem.id, data);
      else await createAdminSupplier(data);
      setModal(false); setEditItem(null); load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить поставщика?')) return;
    try { await deleteAdminSupplier(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[#6b7280]">Поставщики запчастей. Связываются с услугами для отслеживания источника деталей.</p>
        <button type="button" onClick={() => { setEditItem(null); setModal(true); }}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px] hover:bg-[#a3e635] transition-colors">
          <Plus className="w-4 h-4" />Добавить
        </button>
      </div>

      {loading ? (
        <AdminCard><div className="h-40 animate-pulse bg-white/[0.03] rounded-xl" /></AdminCard>
      ) : items.length === 0 ? (
        <AdminCard>
          <div className="py-10 text-center text-[#6b7280]">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Поставщики не добавлены</p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {items.map(sup => (
            <AdminCard key={sup.id} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#84CC16]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] font-semibold text-white">{sup.name}</p>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < sup.rating ? 'text-amber-400 fill-amber-400' : 'text-[#2d3139]'}`} />
                    ))}
                  </div>
                </div>
                {sup.url && (
                  <a href={`https://${sup.url.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-[#84CC16] transition-colors mt-0.5">
                    <ExternalLink className="w-3 h-3" />{sup.url}
                  </a>
                )}
                {sup.phone && <p className="text-[12px] text-[#6b7280] mt-0.5">{sup.phone}</p>}
                {sup.note && <p className="text-[12px] text-[#4b5563] mt-1">{sup.note}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => { setEditItem(sup); setModal(true); }}
                  className="p-1.5 rounded-lg text-[#4b5563] hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => handleDelete(sup.id)}
                  className="p-1.5 rounded-lg text-[#4b5563] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {(modal || editItem) && (
        <SupplierFormModal
          initial={editItem}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ── Markup calculator preview ─────────────────────────────────────────────────

const KIND_LABELS = { display: 'Дисплей', battery: 'АКБ', port: 'Разъём' };
const LABOR_MODES = [
  { id: 'base', label: 'Базовая работа (из раздела «Работа»)' },
  { id: 'multiply', label: 'База × множитель' },
  { id: 'override', label: 'Фиксированная работа по бренду' },
];

function PricingPreview({ settings }) {
  const [partPrice, setPartPrice] = useState(7500);
  const [tier, setTier] = useState('oled');
  const [kind, setKind] = useState('display');
  const [model, setModel] = useState('iPhone 14 Pro');

  const result = useMemo(
    () => computeRepairPricing({ partPrice, tier, kind, modelLabel: model, settings }),
    [partPrice, tier, kind, model, settings],
  );
  const b = result.breakdown;

  return (
    <AdminCard className="bg-[#0c0d10]/80">
      <SectionTitle>Калькулятор накрутки (проверка)</SectionTitle>
      <p className="text-[12px] text-[#6b7280] mb-4">Симуляция: закуп TagGSM → накрутки → работа → округление → минимум бренда.</p>
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <Field label="Закуп запчасти, ₽"><NumInput value={partPrice} min={0} onChange={setPartPrice} /></Field>
        <Field label="Модель (для бренда)"><Input value={model} onChange={(e) => setModel(e.target.value)} /></Field>
        <Field label="Качество запчасти">
          <select className="w-full px-4 py-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#f3f4f6] text-[14px]"
            value={tier} onChange={(e) => setTier(e.target.value)}>
            {REPAIR_TIER_KEYS.map((t) => <option key={t} value={t}>{REPAIR_TIER_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="Тип ремонта">
          <select className="w-full px-4 py-2.5 rounded-xl bg-[#14161a] border border-white/[0.08] text-[#f3f4f6] text-[14px]"
            value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(KIND_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </Field>
      </div>
      <div className="rounded-xl border border-[#84CC16]/25 bg-[#84CC16]/5 p-4">
        <p className="text-2xl font-semibold text-[#84CC16]">
          {result.total.toLocaleString('ru-RU')} ₽
          <span className="text-[14px] font-normal text-[#9ca3af] ml-2">под ключ</span>
        </p>
        <ul className="mt-3 space-y-1 text-[13px] text-[#9ca3af]">
          <li>Запчасть с накруткой: <span className="text-white">{result.partWithMarkup.toLocaleString('ru-RU')} ₽</span>{' '}(+{b.percentTotal}%: диапазон +{b.bandExtra}%, бренд +{b.brandExtra}%)</li>
          <li>Работа: <span className="text-white">{result.labor.toLocaleString('ru-RU')} ₽</span></li>
          <li>Профиль: <span className="text-white">{b.brandLabel}</span>{b.flagship ? <span className="text-[#84CC16]"> · флагман</span> : null}</li>
        </ul>
      </div>
    </AdminCard>
  );
}

function MarketReferenceTab() {
  return (
    <div className="space-y-6">
      <AdminCard>
        <SectionTitle>Как выстроить накрутку</SectionTitle>
        <ul className="space-y-2">
          {PRICING_STRATEGY_HINTS.map((hint, i) => (
            <li key={i} className="flex gap-2 text-[14px] text-[#9ca3af] leading-relaxed">
              <span className="text-[#84CC16] font-mono shrink-0">{i + 1}.</span>{hint}
            </li>
          ))}
        </ul>
      </AdminCard>
      {MARKET_PRICE_REFERENCE.map((block) => (
        <AdminCard key={block.brand}>
          <p className="text-[15px] font-medium text-white mb-1">{block.brand}</p>
          <p className="text-[11px] text-[#6b7280] mb-4">{block.source}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[#6b7280] border-b border-white/[0.06]">
                  <th className="pb-2 pr-4 font-medium">Услуга</th>
                  <th className="pb-2 font-medium">Вилка «под ключ»</th>
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.label} className="border-b border-white/[0.04]">
                    <td className="py-2.5 pr-4 text-[#d1d5db]">{row.label}</td>
                    <td className="py-2.5 text-[#84CC16] font-mono">{row.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RepairPricePage() {
  const { draft, setDraft, save: saveCms, reset, saved } = useSiteDraft('repairPrice');
  const [tab, setTab] = useState('services');
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchAdminSuppliers().then(setSuppliers).catch(() => {});
  }, [tab]);

  const updateMarkupTier = (tier, value) => {
    setDraft((prev) => ({ ...prev, markup: { ...prev.markup, byTier: { ...prev.markup.byTier, [tier]: value } } }));
  };

  const updateBrand = (id, patch) => {
    setDraft((prev) => ({
      ...prev,
      brandProfiles: prev.brandProfiles.map((p) =>
        p.id === id ? { ...p, ...patch, labor: patch.labor ? { ...p.labor, ...patch.labor } : p.labor, minTotal: patch.minTotal ? { ...p.minTotal, ...patch.minTotal } : p.minTotal } : p,
      ),
    }));
  };

  const updateBand = (index, patch) => {
    setDraft((prev) => {
      const priceBands = [...prev.priceBands];
      priceBands[index] = { ...priceBands[index], ...patch };
      return { ...prev, priceBands };
    });
  };

  const handleSave = async () => {
    setSaving(true); setSyncError('');
    try {
      const res = await fetch('/api/repair-price/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      if (!res.ok) throw new Error('sync failed');
      saveCms();
    } catch {
      setSyncError('Не удалось записать на сервер. Запустите npm run dev и сохраните снова.');
    } finally { setSaving(false); }
  };

  const mainTabs = [
    { id: 'services', label: 'Услуги' },
    { id: 'suppliers', label: 'Поставщики' },
    { id: 'brands', label: 'Бренды' },
    { id: 'markup', label: 'Накрутка' },
    { id: 'bands', label: 'Диапазоны' },
    { id: 'labor', label: 'Работа' },
    { id: 'general', label: 'Общие' },
    { id: 'market', label: 'Справка рынка' },
  ];

  const isMarkupTab = ['brands', 'markup', 'bands', 'labor', 'general'].includes(tab);

  return (
    <>
      <PageHeader
        title="Прайс и услуги (/prise)"
        description="Каталог услуг для публичной страницы, управление поставщиками и настройки калькулятора цен по TagGSM."
      />

      {tab === 'services' || tab === 'suppliers' ? null : <PricingPreview settings={draft} />}

      <AdminTabs tabs={mainTabs} active={tab} onChange={setTab} />

      {/* ── Услуги ─────────────────────────────────────────────────────────── */}
      {tab === 'services' && <ServicesTab suppliers={suppliers} />}

      {/* ── Поставщики ─────────────────────────────────────────────────────── */}
      {tab === 'suppliers' && <SuppliersTab />}

      {/* ── Бренды ─────────────────────────────────────────────────────────── */}
      {tab === 'brands' && (
        <div className="space-y-6">
          <p className="text-[13px] text-[#6b7280] -mt-2">
            Дополнительные % и работа для Apple, Samsung, Xiaomi. Флагманы (Pro / Ultra) получают ещё +% и надбавку к работе.
          </p>
          {draft.brandProfiles?.map((profile) => (
            <AdminCard key={profile.id}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="text-[15px] font-medium text-white">{profile.label}</p>
                <label className="flex items-center gap-2 text-[13px] text-[#9ca3af] ml-auto">
                  <input type="checkbox" checked={profile.enabled !== false}
                    onChange={(e) => updateBrand(profile.id, { enabled: e.target.checked })} className="rounded border-white/20" />
                  Включено
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <Field label="Доп. накрутка на запчасть, %" hint="Суммируется с общей и диапазоном">
                  <NumInput value={profile.partMarkupPercent ?? 0} min={0} max={80}
                    onChange={(v) => updateBrand(profile.id, { partMarkupPercent: v })} />
                </Field>
                <Field label="Режим работы">
                  <select className="w-full px-4 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[14px]"
                    value={profile.laborMode ?? 'base'} onChange={(e) => updateBrand(profile.id, { laborMode: e.target.value })}>
                    {LABOR_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </Field>
                {profile.laborMode === 'multiply' ? (
                  <Field label="Множитель работы">
                    <NumInput value={profile.laborMultiplier ?? 1} min={0.5} max={3} step={0.05}
                      onChange={(v) => updateBrand(profile.id, { laborMultiplier: v })} />
                  </Field>
                ) : null}
                <Field label="Флагман +%, Pro/Ultra">
                  <NumInput value={profile.flagshipExtraPercent ?? 0} min={0} max={30}
                    onChange={(v) => updateBrand(profile.id, { flagshipExtraPercent: v })} />
                </Field>
                <Field label="Флагман +работа, ₽">
                  <NumInput value={profile.flagshipLaborAdd ?? 0} min={0}
                    onChange={(v) => updateBrand(profile.id, { flagshipLaborAdd: v })} />
                </Field>
              </div>
              <p className="text-[12px] text-[#6b7280] mb-2">Работа по бренду (₽), если режим «фикс» или как минимум при ×</p>
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                {(['display', 'battery', 'port']).map((kind) => (
                  <Field key={kind} label={repairTypeLabel(kind)}>
                    <NumInput value={profile.labor?.[kind] ?? 0} min={0}
                      onChange={(v) => updateBrand(profile.id, { labor: { [kind]: v } })} />
                  </Field>
                ))}
              </div>
              <p className="text-[12px] text-[#6b7280] mb-2">Минимум «под ключ» (не показывать клиенту ниже)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['display', 'battery', 'port']).map((kind) => (
                  <Field key={kind} label={KIND_LABELS[kind]}>
                    <NumInput value={profile.minTotal?.[kind] ?? 0} min={0}
                      onChange={(v) => updateBrand(profile.id, { minTotal: { [kind]: v } })} />
                  </Field>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* ── Накрутка ───────────────────────────────────────────────────────── */}
      {tab === 'markup' && (
        <AdminCard>
          <SectionTitle>Накрутка на запчасть</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Field label="Общая накрутка, %" hint="На все бренды">
              <NumInput value={draft.markup.globalPercent} min={0} max={100}
                onChange={(v) => setDraft({ ...draft, markup: { ...draft.markup, globalPercent: v } })} />
            </Field>
            <Field label="Мин. накрутка, ₽" hint="Если % дал мало на дешёвых деталях">
              <NumInput value={draft.markup.minPartMarkupRub ?? 0} min={0}
                onChange={(v) => setDraft({ ...draft, markup: { ...draft.markup, minPartMarkupRub: v } })} />
            </Field>
            <Field label="Фикс. надбавка, ₽">
              <NumInput value={draft.markup.fixedRub} min={0}
                onChange={(v) => setDraft({ ...draft, markup: { ...draft.markup, fixedRub: v } })} />
            </Field>
          </div>
          <p className="text-[12px] text-[#6b7280] mb-3">По качеству запчасти (суммируется)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {REPAIR_TIER_KEYS.map((tier) => (
              <Field key={tier} label={REPAIR_TIER_LABELS[tier]}>
                <NumInput value={draft.markup.byTier[tier] ?? 0} min={0} max={100}
                  onChange={(v) => updateMarkupTier(tier, v)} />
              </Field>
            ))}
          </div>
        </AdminCard>
      )}

      {/* ── Диапазоны ──────────────────────────────────────────────────────── */}
      {tab === 'bands' && (
        <AdminCard>
          <SectionTitle>Диапазоны по цене закупа</SectionTitle>
          <p className="text-[12px] text-[#6b7280] mb-4">
            Чем дороже запчасть у поставщика, тем выше доп. %. Типично для OLED iPhone (закуп 8–18 тыс. ₽).
          </p>
          <div className="space-y-4">
            {draft.priceBands?.map((band, idx) => (
              <div key={idx} className="grid gap-3 sm:grid-cols-3 items-end rounded-xl border border-white/[0.06] p-4">
                <Field label="До, ₽ (пусто = без лимита)">
                  <Input type="number" value={band.upTo ?? ''} placeholder="∞"
                    onChange={(e) => { const v = e.target.value; updateBand(idx, { upTo: v === '' ? null : Number(v) }); }} />
                </Field>
                <Field label="Доп. накрутка, %">
                  <NumInput value={band.extraPercent ?? 0} min={0} max={80}
                    onChange={(v) => updateBand(idx, { extraPercent: v })} />
                </Field>
                <p className="text-[12px] text-[#6b7280] pb-2">{band.label}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* ── Работа ─────────────────────────────────────────────────────────── */}
      {tab === 'labor' && (
        <AdminCard>
          <SectionTitle>Базовая стоимость работы (₽)</SectionTitle>
          <p className="text-[12px] text-[#6b7280] mb-4">
            Для Xiaomi и режима «база» у брендов. Apple/Samsung часто переопределяют в «Бренды».
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['display', 'battery', 'port']).map((kind) => (
              <Field key={kind} label={repairTypeLabel(kind)}>
                <NumInput value={draft.labor[kind]} min={0}
                  onChange={(v) => setDraft({ ...draft, labor: { ...draft.labor, [kind]: v } })} />
              </Field>
            ))}
          </div>
        </AdminCard>
      )}

      {/* ── Общие ──────────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <AdminCard>
          <div className="space-y-8">
            <section>
              <SectionTitle>Общие</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Город для наличия">
                  <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </Field>
                <Field label="Макс. вариантов в категории">
                  <NumInput value={draft.maxOptionsPerCategory} min={1} max={12}
                    onChange={(v) => setDraft({ ...draft, maxOptionsPerCategory: v })} />
                </Field>
              </div>
              <label className="mt-4 flex items-center gap-2 text-[14px] text-[#d1d5db]">
                <input type="checkbox" checked={draft.enabled}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="rounded border-white/20" />
                Калькулятор включён
              </label>
            </section>
            <section>
              <SectionTitle>Округление цены для клиента</SectionTitle>
              <label className="flex items-center gap-2 text-[14px] text-[#d1d5db] mb-3">
                <input type="checkbox" checked={draft.rounding?.enabled !== false}
                  onChange={(e) => setDraft({ ...draft, rounding: { ...draft.rounding, enabled: e.target.checked } })} className="rounded border-white/20" />
                Округлять итог
              </label>
              <Field label="Шаг, ₽" hint="100 → 6 900, 7 500">
                <NumInput value={draft.rounding?.step ?? 100} min={10} step={10}
                  onChange={(v) => setDraft({ ...draft, rounding: { ...draft.rounding, step: v } })} />
              </Field>
            </section>
            <section>
              <SectionTitle>Сроки ремонта</SectionTitle>
              <div className="space-y-6">
                {(['display', 'battery', 'port']).map((kind) => (
                  <div key={kind} className="rounded-xl border border-white/[0.06] bg-[#0c0d10]/50 p-4">
                    <p className="text-[13px] font-medium text-[#e5e7eb] mb-3">{repairTypeLabel(kind)}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Обычный срок">
                        <Input value={draft.repairTime[kind]?.default ?? ''}
                          onChange={(e) => setDraft({ ...draft, repairTime: { ...draft.repairTime, [kind]: { ...draft.repairTime[kind], default: e.target.value } } })} />
                      </Field>
                      <Field label="Премиум срок">
                        <Input value={draft.repairTime[kind]?.premium ?? ''}
                          onChange={(e) => setDraft({ ...draft, repairTime: { ...draft.repairTime, [kind]: { ...draft.repairTime[kind], premium: e.target.value } } })} />
                      </Field>
                      <Field label="Порог премиум, ₽">
                        <NumInput value={draft.repairTime[kind]?.premiumThreshold ?? 0} min={0}
                          onChange={(v) => setDraft({ ...draft, repairTime: { ...draft.repairTime, [kind]: { ...draft.repairTime[kind], premiumThreshold: v } } })} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </AdminCard>
      )}

      {tab === 'market' && <MarketReferenceTab />}

      {/* Save bar — only for markup tabs */}
      {isMarkupTab && (
        <AdminCard className="mt-6">
          {syncError ? <p className="text-[13px] text-amber-400 mb-4">{syncError}</p> : null}
          <SaveBar onSave={handleSave} onReset={reset} saving={saving} saved={saved} />
        </AdminCard>
      )}
    </>
  );
}
