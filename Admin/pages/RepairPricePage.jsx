import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRepairSettings } from '../hooks/useRepairSettings';
import { PageHeader, AdminCard, AdminTabs, Field, Input, SaveBar, useToast, ConfirmModal } from '../components/ui';
import {
  computeSimplePrice,
  createDefaultCategorySettings,
  PART_TYPE_LABELS,
  PART_TYPE_KEYS,
} from '../../src/data/repairCategorySettings';
import {
  fetchAdminServices, createAdminService, updateAdminService, deleteAdminService,
  bulkAdminServices, downloadServicesCsv,
  fetchAdminSuppliers, createAdminSupplier, updateAdminSupplier, deleteAdminSupplier,
  fetchAdminSearchAnalytics, markServicesChecked,
  fetchSupplierSyncStatus, triggerSupplierSync,
  fetchLibertiMapStatus, triggerLibertiMapBuild,
} from '../../src/prise/api/repairPriceApi';
import {
  Activity, Archive, BarChart2, Check, ChevronDown, Download, Edit2, ExternalLink,
  Package, Plus, RefreshCw, Search, Smartphone, Star, Trash2, TrendingUp, X,
  AlertTriangle, Building2, RotateCcw, Link2,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

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

// Full part options: new types + legacy 'cover' for existing services
const PART_OPTIONS = [
  { id: 'display',       label: 'Дисплей' },
  { id: 'glass',         label: 'Стекло дисплея' },
  { id: 'battery',       label: 'Аккумулятор' },
  { id: 'port',          label: 'Разъём зарядки' },
  { id: 'cover',         label: 'Задняя крышка (устар.)' },
  { id: 'back-glass',    label: 'Задняя крышка (стекло)' },
  { id: 'housing',       label: 'Корпус' },
  { id: 'camera',        label: 'Камера' },
  { id: 'camera-glass',  label: 'Стекло камеры' },
  { id: 'speaker',       label: 'Динамик (полифон)' },
  { id: 'ear-speaker',   label: 'Слуховой динамик' },
  { id: 'microphone',    label: 'Микрофон' },
  { id: 'face-id',       label: 'Face ID' },
  { id: 'button',        label: 'Кнопки' },
  { id: 'flex',          label: 'Шлейф' },
  { id: 'vibration',     label: 'Вибромотор' },
  { id: 'keyboard',      label: 'Клавиатура' },
  { id: 'water',         label: 'После воды' },
  { id: 'diagnostic',    label: 'Диагностика' },
  { id: 'other',         label: 'Другое' },
];

// Legacy type aliases for computeSimplePrice
const PART_TYPE_ALIASES = { cover: 'back-glass' };
function resolvePartType(pt) { return PART_TYPE_ALIASES[pt] ?? pt; }

// Example purchase prices for markup preview cards
const CAT_EXAMPLE_PRICES = {
  display: 3000, glass: 400, battery: 800, port: 500,
  'back-glass': 800, housing: 1500, camera: 1200, 'camera-glass': 250,
  speaker: 400, 'ear-speaker': 350, microphone: 250, 'face-id': 2000,
  button: 350, flex: 400, vibration: 250, keyboard: 1500,
  water: 0, diagnostic: 0, other: 800,
};

function catLabel(id) { return CATEGORY_OPTIONS.find(o => o.id === id)?.label ?? id; }
function devLabel(id) { return DEVICE_OPTIONS.find(o => o.id === id)?.label ?? id; }
function partLbl(id) {
  return PART_OPTIONS.find(o => o.id === id)?.label ?? PART_TYPE_LABELS[id] ?? id;
}

function formatPrice(svc) {
  if (svc.price != null) return `${Number(svc.price).toLocaleString('ru')} ₽`;
  const from = svc.priceFrom; const to = svc.priceTo;
  if (from != null && to != null) return `${Number(from).toLocaleString('ru')} – ${Number(to).toLocaleString('ru')} ₽`;
  if (from != null) return `от ${Number(from).toLocaleString('ru')} ₽`;
  if (to != null) return `до ${Number(to).toLocaleString('ru')} ₽`;
  return '—';
}

function formatMoney(n) {
  return n != null ? `${Number(n).toLocaleString('ru')} ₽` : '—';
}

function freshnessLabel(status) {
  if (status === 'fresh') return 'Проверено <30 дней';
  if (status === 'stale') return 'Проверено 30–90 дней';
  return 'Не проверялось >90 дней';
}

// ── Shared small components ───────────────────────────────────────────────────

function Badge({ children, color = 'gray' }) {
  const cls = {
    gray:  'bg-white/[0.06] text-[#9ca3af]',
    lime:  'bg-[#84CC16]/15 text-[#84CC16]',
    amber: 'bg-amber-500/15 text-amber-400',
    red:   'bg-red-500/15 text-red-400',
    blue:  'bg-blue-500/15 text-blue-400',
  }[color] ?? 'bg-white/[0.06] text-[#9ca3af]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function FreshnessDot({ status }) {
  const { cls, title } = {
    fresh:    { cls: 'bg-emerald-400', title: 'Проверено <30 дней' },
    stale:    { cls: 'bg-amber-400',   title: 'Проверено 30–90 дней' },
    outdated: { cls: 'bg-red-400',     title: 'Не проверялось >90 дней' },
  }[status] ?? { cls: 'bg-red-400', title: 'Давно не проверялась' };
  return <span title={title} className={`inline-block w-2 h-2 rounded-full ${cls}`} />;
}

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
                <span className="text-white">
                  {h.action === 'created' ? 'Создана' : h.action === 'updated' ? 'Изменена' :
                   h.action === 'bulk_update' ? 'Массовое обновление' :
                   h.action === 'price_adjust' ? `Цена ×${h.multiplier}` : h.action}
                </span>
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

// ── Service form modal ────────────────────────────────────────────────────────

const EMPTY_SVC_FORM = {
  name: '', description: '',
  category: 'replace', deviceType: 'smartphone', partType: 'display', brand: '',
  price: '', priceFrom: '', priceTo: '',
  purchasePrice: '', laborCost: '',
  duration: '1–2 часа', hasExpress: false, expressMultiplier: 1.5,
  popularity: 50, supplierId: '', available: true, inStockStavropol: null,
};

function ServiceFormModal({ initial, suppliers, onSave, onClose, saving, categorySettings }) {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_SVC_FORM;
    return {
      ...EMPTY_SVC_FORM,
      ...initial,
      price: initial.price ?? '',
      priceFrom: initial.priceFrom ?? '',
      priceTo: initial.priceTo ?? '',
      purchasePrice: initial.purchasePrice ?? '',
      laborCost: initial.laborCost ?? '',
      brand: initial.brand ?? '',
      supplierId: initial.supplierId ?? '',
      inStockStavropol: initial.inStockStavropol ?? null,
    };
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const catSettings = categorySettings ?? createDefaultCategorySettings();
  const resolved = resolvePartType(form.partType);
  const cat = catSettings[resolved] ?? catSettings['other'] ?? {};

  const previewPrice = form.purchasePrice !== ''
    ? computeSimplePrice(Number(form.purchasePrice), resolved, catSettings,
        form.laborCost !== '' ? Number(form.laborCost) : null)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const pp = form.purchasePrice !== '' ? Number(form.purchasePrice) : null;
    onSave({
      ...form,
      price: form.price !== '' ? Number(form.price) : null,
      priceFrom: form.priceFrom !== '' ? Number(form.priceFrom) : null,
      priceTo: form.priceTo !== '' ? Number(form.priceTo) : null,
      purchasePrice: pp,
      partCost: pp,
      laborCost: form.laborCost !== '' ? Number(form.laborCost) : null,
      brand: form.brand || null,
      supplierId: form.supplierId || null,
    });
  };

  const selCls = 'w-full px-3 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13px] outline-none focus:border-white/[0.2]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0f1014] rounded-2xl border border-white/[0.1] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#0f1014] border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-white">{initial ? 'Редактировать услугу' : 'Добавить услугу'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Название услуги *">
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Замена дисплея iPhone 14" required />
          </Field>
          <Field label="Описание">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[14px] outline-none focus:border-white/[0.2] resize-none"
              placeholder="Краткое описание для клиентов" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Категория">
              <select className={selCls} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORY_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Устройство">
              <select className={selCls} value={form.deviceType} onChange={e => set('deviceType', e.target.value)}>
                {DEVICE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Тип детали">
              <select className={selCls} value={form.partType} onChange={e => set('partType', e.target.value)}>
                {PART_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Бренд (пусто = все бренды)">
            <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Apple, Samsung, Xiaomi..." />
          </Field>

          {/* Pricing */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10]/40 p-4 space-y-3">
            <p className="text-[12px] font-medium text-[#84CC16] uppercase tracking-wide">Цена</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Закупочная цена, ₽" hint="Что заплатили поставщику">
                <Input type="number" min={0} value={form.purchasePrice}
                  onChange={e => set('purchasePrice', e.target.value)} placeholder="3500" />
              </Field>
              <Field label="Работа, ₽" hint={`Категория: ${cat.laborRate ?? '—'} ₽`}>
                <Input type="number" min={0} value={form.laborCost}
                  onChange={e => set('laborCost', e.target.value)} placeholder={String(cat.laborRate ?? 1500)} />
              </Field>
            </div>

            {previewPrice != null && (
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-[#84CC16]/[0.08] border border-[#84CC16]/20">
                <p className="text-[13px] text-[#9ca3af]">Цена клиенту:</p>
                <p className="text-[15px] font-semibold text-[#84CC16]">{previewPrice.toLocaleString('ru')} ₽</p>
                <p className="text-[11px] text-[#6b7280] ml-auto">наценка {cat.markupPercent ?? 100}%</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <Field label="Фиксир. цена, ₽" hint="Переопределяет диапазон">
                <Input type="number" min={0} value={form.price}
                  onChange={e => set('price', e.target.value)} placeholder="—" />
              </Field>
              <Field label="Цена от, ₽">
                <Input type="number" min={0} value={form.priceFrom}
                  onChange={e => set('priceFrom', e.target.value)} placeholder="2500" />
              </Field>
              <Field label="Цена до, ₽">
                <Input type="number" min={0} value={form.priceTo}
                  onChange={e => set('priceTo', e.target.value)} placeholder="8000" />
              </Field>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Срок выполнения">
              <Input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="1–2 часа" />
            </Field>
            <Field label="Поставщик">
              <select className={selCls} value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
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

          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 text-[13.5px] text-[#d1d5db] cursor-pointer">
              <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} className="rounded border-white/20" />
              Доступна клиентам
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-[#d1d5db] cursor-pointer">
              <input type="checkbox" checked={form.hasExpress} onChange={e => set('hasExpress', e.target.checked)} className="rounded border-white/20" />
              Экспресс-ремонт
            </label>
          </div>

          <Field label="В наличии в Ставрополе" hint="null = авто (по городу поставщика)">
            <div className="flex gap-2">
              {[
                { v: null,  label: 'Авто' },
                { v: true,  label: 'Да' },
                { v: false, label: 'Нет' },
              ].map(({ v, label }) => (
                <button key={String(v)} type="button"
                  onClick={() => set('inStockStavropol', v)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors ${
                    form.inStockStavropol === v
                      ? 'bg-[#84CC16] text-[#0a0b0e] border-[#84CC16]'
                      : 'bg-[#0c0d10] text-[#9ca3af] border-white/[0.08] hover:text-white'
                  }`}
                >{label}</button>
              ))}
            </div>
          </Field>

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

// ── Inline purchase price cell ────────────────────────────────────────────────

function PurchasePriceCell({ svc, categorySettings, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  const current = svc.purchasePrice;

  const startEdit = () => {
    setVal(current != null ? String(current) : '');
    setEditing(true);
    setTimeout(() => { inputRef.current?.select(); }, 40);
  };

  const commit = () => {
    setEditing(false);
    const n = val !== '' ? Number(val) : null;
    if (n !== current) onSave({ purchasePrice: n, partCost: n });
  };

  if (editing) {
    return (
      <input ref={inputRef} value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-24 px-2 py-1 rounded bg-[#0c0d10] border border-[#84CC16]/40 text-white text-[13px] outline-none"
        type="number" min={0}
      />
    );
  }

  return (
    <button type="button" onClick={startEdit}
      className={`group flex items-center gap-1 text-[13px] transition-colors text-left ${current != null ? 'text-white hover:text-[#84CC16]' : 'text-[#4b5563] hover:text-[#6b7280]'}`}>
      {current != null ? `${Number(current).toLocaleString('ru')} ₽` : '—'}
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </button>
  );
}

// Computed customer price display
function CustomerPrice({ svc, categorySettings }) {
  const pp = svc.purchasePrice;
  if (pp != null && pp > 0) {
    const computed = computeSimplePrice(pp, resolvePartType(svc.partType), categorySettings);
    if (computed != null) {
      return <span className="text-[13px] font-medium text-[#84CC16]">{computed.toLocaleString('ru')} ₽</span>;
    }
  }
  const range = formatPrice(svc);
  return <span className="text-[13px] text-[#6b7280]">{range}</span>;
}

// ── Services Tab ──────────────────────────────────────────────────────────────

function ServicesTab({ suppliers, categorySettings, pendingCreate, onPendingConsumed }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [filterDev, setFilterDev] = useState('');
  const [filterPart, setFilterPart] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterNoPurchase, setFilterNoPurchase] = useState(false);
  const [filterStale, setFilterStale] = useState(false);
  const [addModal, setAddModal] = useState(null); // null | {} | service object
  const [historyItem, setHistoryItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = v => {
    setFilterSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 250);
  };

  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s])), [suppliers]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchAdminServices({
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
  }, [filterDev, filterPart, debouncedSearch, showArchived]);

  useEffect(() => { load(); }, [load]);

  // Open service form when parent requests a create-from-demand
  useEffect(() => {
    if (pendingCreate) {
      setAddModal({ ...EMPTY_SVC_FORM, ...pendingCreate });
      onPendingConsumed?.();
    }
  }, [pendingCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filters
  const visibleItems = useMemo(() => {
    let list = items;
    if (filterNoPurchase) list = list.filter(s => !s.purchasePrice || s.purchasePrice <= 0);
    if (filterStale) list = list.filter(s => s.freshness === 'stale' || s.freshness === 'outdated');
    return list;
  }, [items, filterNoPurchase, filterStale]);

  const toggleAll = () => {
    if (selected.size === visibleItems.length) setSelected(new Set());
    else setSelected(new Set(visibleItems.map(s => s.id)));
  };

  const handleSave = async data => {
    setSaving(true);
    try {
      const isEdit = addModal && addModal.id;
      if (isEdit) await updateAdminService(addModal.id, data);
      else await createAdminService(data);
      setAddModal(null);
      load();
    } catch (e) { alert(e.message || 'Ошибка сохранения'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Удалить услугу навсегда?')) return;
    try { await deleteAdminService(id); load(); } catch (e) { alert(e.message); }
  };

  const handleInlinePriceSave = async (svc, patch) => {
    try { await updateAdminService(svc.id, patch); load(); } catch {}
  };

  const handleToggleAvailable = async svc => {
    try { await updateAdminService(svc.id, { available: !svc.available }); load(); } catch {}
  };

  const handleMarkChecked = async () => {
    try { await markServicesChecked([...selected]); load(); } catch (e) { alert(e.message); }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Архивировать ${selected.size} услуг?`)) return;
    try { await bulkAdminServices([...selected], 'update', { patch: { archived: true } }); load(); }
    catch (e) { alert(e.message); }
  };

  const handleBulkAvailable = async available => {
    try { await bulkAdminServices([...selected], 'update', { patch: { available } }); load(); }
    catch (e) { alert(e.message); }
  };

  const openSupplierSearch = (svc) => {
    const sup = supplierMap[svc.supplierId];
    if (!sup) return;
    const tmpl = sup.searchTemplate;
    if (!tmpl) {
      window.open(`https://${sup.url}`, '_blank');
      return;
    }
    window.open(tmpl.replace('{query}', encodeURIComponent(svc.name)), '_blank');
  };

  const handleExportCsv = () => downloadServicesCsv(selected.size > 0 ? [...selected] : null).catch(() => {});
  const btnCls = 'flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/[0.08] text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors text-[12.5px]';
  const chipCls = 'text-[12px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9ca3af] hover:text-white transition-colors flex items-center gap-1';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
          <Input value={filterSearch} onChange={e => handleSearch(e.target.value)}
            className="pl-8 text-[13px]" placeholder="Поиск..." />
        </div>

        <select value={filterDev} onChange={e => setFilterDev(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#d1d5db] text-[13px] outline-none">
          <option value="">Все устройства</option>
          {DEVICE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <select value={filterPart} onChange={e => setFilterPart(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#d1d5db] text-[13px] outline-none">
          <option value="">Все категории</option>
          {PART_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <label className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-white/[0.08] text-[13px] text-[#9ca3af] cursor-pointer select-none hover:text-white transition-colors"
          title="Только услуги без закупочной цены">
          <input type="checkbox" checked={filterNoPurchase} onChange={e => setFilterNoPurchase(e.target.checked)} className="rounded border-white/20" />
          Без закупки
        </label>

        <label className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-white/[0.08] text-[13px] text-[#9ca3af] cursor-pointer select-none hover:text-white transition-colors"
          title="Только устаревшие (требует проверки)">
          <input type="checkbox" checked={filterStale} onChange={e => setFilterStale(e.target.checked)} className="rounded border-white/20" />
          Требует проверки
        </label>

        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={load} className={btnCls} title="Обновить">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" onClick={handleExportCsv} className={btnCls}>
            <Download className="w-3.5 h-3.5" />CSV
          </button>
          <button type="button" onClick={() => setAddModal({})}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px] hover:bg-[#a3e635] transition-colors">
            <Plus className="w-4 h-4" />Добавить
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl bg-[#84CC16]/[0.08] border border-[#84CC16]/20">
          <span className="text-[12.5px] text-[#84CC16] font-medium">{selected.size} выбрано</span>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            <button type="button" onClick={() => handleBulkAvailable(true)} className={chipCls}><Check className="w-3 h-3" />Показать</button>
            <button type="button" onClick={() => handleBulkAvailable(false)} className={chipCls}><X className="w-3 h-3" />Скрыть</button>
            <button type="button" onClick={handleMarkChecked} className={chipCls + ' hover:!text-emerald-400'}><Check className="w-3 h-3" />Проверено</button>
            <button type="button" onClick={handleBulkArchive} className={chipCls + ' hover:!text-amber-400'}><Archive className="w-3 h-3" />Архив</button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Desktop table */}
      <AdminCard className="overflow-hidden p-0 hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th className="px-4 py-3 w-9">
                  <input type="checkbox" className="rounded border-white/20"
                    checked={visibleItems.length > 0 && selected.size === visibleItems.length}
                    onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 font-medium text-[#6b7280]">Услуга</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden lg:table-cell">Категория</th>
                <th className="px-3 py-3 font-medium text-[#6b7280]">Закупка</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden lg:table-cell">Наценка</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden lg:table-cell">Работа</th>
                <th className="px-3 py-3 font-medium text-[#6b7280]">Цена клиенту</th>
                <th className="px-3 py-3 font-medium text-[#6b7280] hidden xl:table-cell w-10 text-center">🔄</th>
                <th className="px-3 py-3 font-medium text-[#6b7280]">Статус</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-4 rounded bg-white/[0.04] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#6b7280]">Услуги не найдены</td>
                </tr>
              ) : (
                visibleItems.map(svc => {
                  const resolved = resolvePartType(svc.partType);
                  const cat = categorySettings?.[resolved] ?? createDefaultCategorySettings()[resolved] ?? {};
                  const markup = cat.markupPercent;
                  const labor = svc.laborCost ?? cat.laborRate;
                  const hasSupplierSearch = !!(svc.supplierId && supplierMap[svc.supplierId]?.searchTemplate);
                  return (
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
                      <td className="px-3 py-3 hidden lg:table-cell text-[#9ca3af] whitespace-nowrap">
                        {partLbl(svc.partType)}
                      </td>
                      <td className="px-3 py-3">
                        <PurchasePriceCell svc={svc} categorySettings={categorySettings}
                          onSave={patch => handleInlinePriceSave(svc, patch)} />
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell text-[#9ca3af] whitespace-nowrap">
                        {markup != null ? `${markup}%` : '—'}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell text-[#9ca3af] whitespace-nowrap">
                        {labor != null ? formatMoney(labor) : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <CustomerPrice svc={svc} categorySettings={categorySettings} />
                      </td>
                      <td className="px-3 py-3 hidden xl:table-cell text-center">
                        <FreshnessDot status={svc.freshness} />
                      </td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => handleToggleAvailable(svc)}>
                          <Badge color={svc.archived ? 'red' : svc.available ? 'lime' : 'gray'}>
                            {svc.archived ? 'Архив' : svc.available ? 'Активна' : 'Скрыта'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 justify-end">
                          {svc.supplierId && (
                            <button type="button" onClick={() => openSupplierSearch(svc)}
                              className="p-1.5 rounded-lg text-[#4b5563] hover:text-[#84CC16] hover:bg-[#84CC16]/[0.08] transition-colors"
                              title={hasSupplierSearch ? 'Найти у поставщика' : 'Перейти к поставщику'}>
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => setHistoryItem(svc)}
                            className="p-1.5 rounded-lg text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.06] transition-colors" title="История">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => setAddModal(svc)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
          ))
        ) : visibleItems.length === 0 ? (
          <AdminCard><p className="text-center text-[#6b7280] py-6">Услуги не найдены</p></AdminCard>
        ) : (
          visibleItems.map(svc => {
            const resolved = resolvePartType(svc.partType);
            const cat = categorySettings?.[resolved] ?? createDefaultCategorySettings()[resolved] ?? {};
            return (
              <AdminCard key={svc.id} className={`p-3 ${svc.archived ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-white leading-snug">{svc.name}</p>
                    <p className="text-[11px] text-[#6b7280] mt-0.5">{devLabel(svc.deviceType)} · {partLbl(svc.partType)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FreshnessDot status={svc.freshness} />
                    <Badge color={svc.available ? 'lime' : 'gray'}>{svc.available ? 'Активна' : 'Скрыта'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-[#4b5563] mb-0.5">Закупка</p>
                    <PurchasePriceCell svc={svc} categorySettings={categorySettings}
                      onSave={patch => handleInlinePriceSave(svc, patch)} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#4b5563] mb-0.5">Наценка</p>
                    <p className="text-[13px] text-[#9ca3af]">{cat.markupPercent != null ? `${cat.markupPercent}%` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#4b5563] mb-0.5">Клиенту</p>
                    <CustomerPrice svc={svc} categorySettings={categorySettings} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setAddModal(svc)}
                    className="flex-1 h-7 rounded-lg border border-white/[0.08] text-[#9ca3af] hover:text-white text-[12px] transition-colors flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" />Изменить
                  </button>
                  {svc.supplierId && (
                    <button type="button" onClick={() => openSupplierSearch(svc)}
                      className="h-7 w-7 rounded-lg border border-white/[0.08] text-[#4b5563] hover:text-[#84CC16] transition-colors flex items-center justify-center">
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => setHistoryItem(svc)}
                    className="h-7 w-7 rounded-lg border border-white/[0.08] text-[#4b5563] hover:text-white transition-colors flex items-center justify-center">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </AdminCard>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-[#4b5563]">
        {visibleItems.length} услуг · Клик по закупке — быстрое редактирование · 🟢 &lt;30д 🟡 30–90д 🔴 &gt;90д
      </p>

      {/* Modals */}
      {addModal !== null && (
        <ServiceFormModal
          initial={addModal && addModal.id ? addModal : (addModal && Object.keys(addModal).length > 0 ? { ...EMPTY_SVC_FORM, ...addModal } : null)}
          suppliers={suppliers}
          saving={saving}
          categorySettings={categorySettings}
          onSave={handleSave}
          onClose={() => setAddModal(null)}
        />
      )}
      {historyItem && (
        <HistoryPopover history={historyItem.history} onClose={() => setHistoryItem(null)} />
      )}
    </div>
  );
}

// ── Markup Tab ────────────────────────────────────────────────────────────────

function MarkupTab({ settings, onUpdateCategory, onSave, onReset, saving, saved, saveError }) {
  const catSettings = settings?.categorySettings ?? createDefaultCategorySettings();
  const defaults = createDefaultCategorySettings();

  const [examplePrice, setExamplePrice] = useState('');

  const applyBulkMarkup = (delta) => {
    PART_TYPE_KEYS.forEach(pt => {
      const cur = Number(catSettings[pt]?.markupPercent ?? defaults[pt]?.markupPercent ?? 0);
      const next = Math.max(0, Math.round(cur * (1 + delta / 100)));
      onUpdateCategory(pt, 'markupPercent', next);
    });
  };

  const resetAllToDefaults = () => {
    PART_TYPE_KEYS.forEach(pt => {
      onUpdateCategory(pt, 'markupPercent', defaults[pt]?.markupPercent ?? 0);
      onUpdateCategory(pt, 'laborRate', defaults[pt]?.laborRate ?? 1000);
    });
  };

  return (
    <div className="space-y-5">
      {/* Bulk actions */}
      <AdminCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] font-medium text-white">Все наценки:</p>
          {[
            { label: '+10%', delta: 10, color: 'text-emerald-400' },
            { label: '+20%', delta: 20, color: 'text-emerald-400' },
            { label: '−10%', delta: -10, color: 'text-red-400' },
          ].map(({ label, delta, color }) => (
            <button key={label} type="button" onClick={() => applyBulkMarkup(delta)}
              className={`h-8 px-3 rounded-xl border border-white/[0.08] text-[13px] font-medium ${color} hover:bg-white/[0.06] transition-colors`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={resetAllToDefaults}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.08] text-[13px] text-[#9ca3af] hover:text-white hover:bg-white/[0.06] transition-colors ml-auto">
            <RotateCcw className="w-3.5 h-3.5" />Сбросить к рекомендуемым
          </button>
        </div>
      </AdminCard>

      {/* Category cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PART_TYPE_KEYS.map(pt => {
          const cat = catSettings[pt] ?? defaults[pt] ?? {};
          const def = defaults[pt] ?? {};
          const exPP = examplePrice !== '' ? Number(examplePrice) : (CAT_EXAMPLE_PRICES[pt] ?? 0);
          const computedEx = exPP > 0
            ? computeSimplePrice(exPP, pt, catSettings)
            : null;

          return (
            <div key={pt} className="rounded-xl border border-white/[0.08] bg-[#0c0d10]/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-semibold text-white">{cat.name ?? def.name ?? PART_TYPE_LABELS[pt]}</p>
                {(cat.markupPercent !== def.markupPercent || cat.laborRate !== def.laborRate) && (
                  <span className="text-[10px] text-[#84CC16] font-medium px-1.5 py-0.5 rounded bg-[#84CC16]/10">изм.</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Наценка, %">
                  <div className="relative">
                    <Input type="number" min={0} max={1000} step={5}
                      value={cat.markupPercent ?? 0}
                      onChange={e => onUpdateCategory(pt, 'markupPercent', Number(e.target.value))}
                      className="pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6b7280]">%</span>
                  </div>
                </Field>
                <Field label="Работа, ₽">
                  <Input type="number" min={0} step={100}
                    value={cat.laborRate ?? 0}
                    onChange={e => onUpdateCategory(pt, 'laborRate', Number(e.target.value))}
                  />
                </Field>
              </div>

              {exPP > 0 ? (
                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-[12px]">
                  <div className="flex items-center justify-between text-[#6b7280]">
                    <span>Закупка {exPP.toLocaleString('ru')} ₽</span>
                    <span className="text-white font-medium">
                      {computedEx != null ? `${computedEx.toLocaleString('ru')} ₽` : '—'}
                    </span>
                  </div>
                  {computedEx != null && (
                    <div className="text-[11px] text-[#4b5563] mt-0.5">
                      наценка {Math.round(exPP * (cat.markupPercent ?? 0) / 100).toLocaleString('ru')} ₽ + работа {(cat.laborRate ?? 0).toLocaleString('ru')} ₽
                    </div>
                  )}
                </div>
              ) : pt === 'water' || pt === 'diagnostic' ? (
                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] text-[#6b7280]">
                  Цена = стоимость работы {(cat.laborRate ?? 0).toLocaleString('ru')} ₽
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Example price control */}
      <AdminCard className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[13px] text-[#6b7280]">Пример закупки для предпросмотра:</p>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} value={examplePrice}
              onChange={e => setExamplePrice(e.target.value)}
              className="w-28 text-[13px]" placeholder="авто" />
            <span className="text-[13px] text-[#6b7280]">₽</span>
          </div>
          <p className="text-[11px] text-[#4b5563] ml-auto">Пустое = стандартная для категории</p>
        </div>
      </AdminCard>

      {/* Save bar */}
      {saveError && <p className="text-[13px] text-amber-400">{saveError}</p>}
      <AdminCard className="p-4">
        <SaveBar onSave={onSave} onReset={onReset} saving={saving} saved={saved} />
      </AdminCard>
    </div>
  );
}

// ── Suppliers Tab ─────────────────────────────────────────────────────────────

const EMPTY_SUP = { name: '', url: '', searchTemplate: '', phone: '', city: '', deliveryDays: '', rating: 3, note: '' };

function SupplierFormModal({ initial, existingNames, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? { ...EMPTY_SUP, ...initial, deliveryDays: initial.deliveryDays ?? '' } : EMPTY_SUP);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Обязательное поле';
    else {
      const dup = existingNames?.find(n => n.toLowerCase() === form.name.trim().toLowerCase() && n !== initial?.name);
      if (dup) e.name = 'Поставщик с таким именем уже существует';
    }
    if (!form.url.trim() && !form.phone.trim()) e.contact = 'Укажите сайт или телефон';
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const data = { ...form, name: form.name.trim(), deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : null };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1014] rounded-2xl border border-white/[0.1] p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">{initial ? 'Редактировать поставщика' : 'Добавить поставщика'}</h2>
          <button type="button" onClick={onClose} className="text-[#6b7280] hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Название *" hint={errors.name}>
            <Input value={form.name} onChange={e => set('name', e.target.value)}
              className={errors.name ? 'border-red-500/50' : ''} />
          </Field>
          <Field label="Сайт" hint={errors.contact}>
            <Input value={form.url} onChange={e => set('url', e.target.value)} placeholder="gsmops.ru"
              className={errors.contact ? 'border-red-500/50' : ''} />
          </Field>
          <Field label="Телефон" hint={errors.contact && !form.url.trim() ? errors.contact : undefined}>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (800) 000-00-00"
              className={errors.contact && !form.url.trim() ? 'border-red-500/50' : ''} />
          </Field>
          {errors.contact && form.url.trim() && form.phone.trim() === '' && (
            <p className="text-[12px] text-red-400 -mt-1">{errors.contact}</p>
          )}
          <Field label="Город">
            <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ставрополь" />
          </Field>
          <Field label="Срок доставки (дней)">
            <Input type="number" min={0} max={90} value={form.deliveryDays}
              onChange={e => set('deliveryDays', e.target.value)} placeholder="1" />
          </Field>
          <Field label="Шаблон поиска" hint="Используйте {query} для подстановки запроса">
            <Input value={form.searchTemplate} onChange={e => set('searchTemplate', e.target.value)}
              placeholder="https://gsmops.ru/search/?query={query}" />
          </Field>
          <Field label="Рейтинг (1–5)">
            <Input type="number" min={1} max={5} value={form.rating} onChange={e => set('rating', Number(e.target.value))} />
          </Field>
          <Field label="Примечание">
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[14px] outline-none resize-none" />
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px]">Отмена</button>
            <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px] disabled:opacity-60">
              {saving ? 'Сохраняем...' : initial ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupplierCard({ sup, onEdit, onDelete, onMarkChecked }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [checking, setChecking] = useState(false);

  const openSearch = () => {
    const q = searchQuery.trim() || sup.name;
    if (sup.searchTemplate) {
      window.open(sup.searchTemplate.replace('{query}', encodeURIComponent(q)), '_blank');
    } else if (sup.url) {
      window.open(`https://${sup.url.replace(/^https?:\/\//, '')}`, '_blank');
    }
  };

  const handleMarkChecked = async () => {
    setChecking(true);
    try { await onMarkChecked(sup.id); } finally { setChecking(false); }
  };

  const lastCheck = sup.lastPriceCheck ? new Date(sup.lastPriceCheck) : null;
  const daysSince = lastCheck ? Math.floor((Date.now() - lastCheck.getTime()) / 86400000) : null;
  const checkColor = daysSince == null ? 'text-[#4b5563]' : daysSince < 30 ? 'text-emerald-400' : daysSince < 90 ? 'text-amber-400' : 'text-red-400';

  return (
    <AdminCard className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-[#84CC16]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-[14.5px] font-semibold text-white">{sup.name}</p>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < sup.rating ? 'text-amber-400 fill-amber-400' : 'text-[#2d3139]'}`} />
              ))}
            </div>
            {sup.dataSource?.type && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                sup.dataSource.type === 'ssr_page'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : sup.dataSource.type === 'catalog_sync'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-white/[0.05] text-[#6b7280] border-white/[0.08]'
              }`}>
                {sup.dataSource.type === 'ssr_page' ? 'SSR синк'
                  : sup.dataSource.type === 'catalog_sync' ? 'Каталог'
                  : sup.dataSource.type}
              </span>
            )}
          </div>

          {sup.url && (
            <a href={`https://${sup.url.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-[#84CC16] transition-colors mb-1">
              <ExternalLink className="w-3 h-3" />{sup.url}
            </a>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1">
            {sup.city && <span className="text-[12px] text-[#6b7280]">{sup.city}</span>}
            {sup.phone && <span className="text-[12px] text-[#6b7280]">{sup.phone}</span>}
            {sup.deliveryDays != null && sup.deliveryDays > 0 && (
              <span className="text-[12px] text-[#6b7280]">Доставка: {sup.deliveryDays} дн.</span>
            )}
          </div>

          <div className={`text-[12px] mb-2 ${checkColor}`}>
            {lastCheck
              ? `Проверено: ${lastCheck.toLocaleDateString('ru')} (${daysSince} дн. назад)`
              : 'Не проверялось'}
          </div>

          {sup.searchTemplate && (
            <p className="text-[11px] text-[#4b5563] mb-2 truncate">
              Шаблон: {sup.searchTemplate}
            </p>
          )}

          {/* Quick search */}
          {(sup.searchTemplate || sup.url) && (
            <div className="flex gap-2 mb-2">
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Найти у ${sup.name}...`}
                className="flex-1 text-[12px] h-8"
                onKeyDown={e => e.key === 'Enter' && openSearch()}
              />
              <button type="button" onClick={openSearch}
                className="h-8 px-3 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20 text-[#84CC16] text-[12px] font-medium hover:bg-[#84CC16]/20 transition-colors flex items-center gap-1.5 shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />Открыть
              </button>
            </div>
          )}

          {sup.note && <p className="text-[12px] text-[#4b5563]">{sup.note}</p>}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button type="button" onClick={onEdit}
            className="p-1.5 rounded-lg text-[#4b5563] hover:text-white hover:bg-white/[0.06] transition-colors" title="Редактировать">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(sup.id)}
            className="p-1.5 rounded-lg text-[#4b5563] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors" title="Удалить">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.05] flex justify-end">
        <button type="button" onClick={handleMarkChecked} disabled={checking}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-white/[0.08] text-[12px] text-[#9ca3af] hover:text-emerald-400 hover:border-emerald-400/30 transition-colors disabled:opacity-50">
          <Check className="w-3 h-3" />{checking ? 'Отмечаем...' : 'Отметить проверенным'}
        </button>
      </div>
    </AdminCard>
  );
}

function LibertiMapCard() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [building, setBuilding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchLibertiMapStatus();
      setStatus(data);
      if (data.running !== building) setBuilding(!!data.running);
    } catch {}
  }, [building]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!building) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [building, load]);

  const handleBuild = async (brands = null) => {
    setBuilding(true);
    try {
      await triggerLibertiMapBuild(brands);
      const hint = brands ? `(${brands.join(', ')}) ~30–60 с` : 'все бренды ~5 мин';
      toast(`Построение карты запущено ${hint}`, 'info');
    } catch (e) {
      toast(e.message, 'error');
      setBuilding(false);
    }
  };

  const stats = status?.stats;
  const log = status?.log ?? [];
  const lastUpdated = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleString('ru-RU')
    : null;

  return (
    <AdminCard className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-[15px] font-semibold text-white">Карта моделей Liberti</h3>
          <p className="text-[13px] text-[#9ca3af] mt-0.5">
            URL-адреса моделей для точного резолва страниц. Нужна для моделей с числовыми ID (Galaxy S26+).
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleBuild(['apple', 'samsung'])}
            disabled={building}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold bg-white/[0.06] border border-white/[0.08] text-white disabled:opacity-50 transition-opacity"
          >
            Samsung + Apple
          </button>
          <button
            onClick={() => handleBuild()}
            disabled={building}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#84CC16] text-[#0a0b0e] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {building ? 'Обновляется...' : 'Все бренды'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">Моделей</div>
          <div className="text-[14px] font-medium text-white">{stats?.count ?? '—'}</div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">Брендов</div>
          <div className="text-[14px] font-medium text-white">{stats?.brands?.length ?? '—'}</div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">Обновлено</div>
          <div className="text-[12px] font-medium text-white">{lastUpdated ?? 'Никогда'}</div>
        </div>
      </div>

      {building && log.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-2">Лог</div>
          <div className="text-[12px] text-[#9ca3af] font-mono space-y-0.5 max-h-28 overflow-auto">
            {log.slice(-15).map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      )}

      {stats?.brands?.length > 0 && (
        <div className="text-[12px] text-[#4b5563] border-t border-white/[0.04] pt-3">
          Бренды: <span className="text-[#6b7280]">{stats.brands.join(', ')}</span>
        </div>
      )}

      {!stats?.count && !building && (
        <div className="text-[12px] text-amber-400/80 border-t border-white/[0.04] pt-3">
          Карта пуста — нажмите «Samsung + Apple» для первого запуска
        </div>
      )}
    </AdminCard>
  );
}

function StockSyncTab() {
  const toast = useToast();
  const [log, setLog] = useState(null);
  const [stockCount, setStockCount] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchSupplierSyncStatus();
      setLog(data.log);
      setStockCount(data.stockCount);
    } catch (e) {
      toast(e.message, 'error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerSupplierSync();
      toast('Синхронизация запущена. Это займёт 1–3 минуты.', 'info');
      // Poll every 10s
      const poll = setInterval(async () => {
        try {
          const data = await fetchSupplierSyncStatus();
          setLog(data.log);
          setStockCount(data.stockCount);
          if (data.log?.status !== 'running') {
            clearInterval(poll);
            setSyncing(false);
            if (data.log?.status === 'ok') toast(`Синхронизировано ${data.stockCount} товаров`, 'success');
            else toast(data.log?.error || 'Ошибка синхронизации', 'error');
          }
        } catch {}
      }, 10000);
    } catch (e) {
      toast(e.message, 'error');
      setSyncing(false);
    }
  };

  const isRunning = syncing || log?.status === 'running';
  const lastSync = log?.lastSync ? new Date(log.lastSync).toLocaleString('ru-RU') : null;

  return (
    <div className="space-y-4">
      <AdminCard className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Синхронизация склада Green Spark</h3>
            <p className="text-[13px] text-[#9ca3af] mt-0.5">
              Загружает актуальный ассортимент поставщика (Ставрополь) для отображения наличия на /prise.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={isRunning}
            className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#84CC16] text-[#0a0b0e] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isRunning ? 'Синхронизация...' : 'Запустить синк'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">Статус</div>
            <div className={`text-[14px] font-medium ${
              log?.status === 'ok' ? 'text-[#84CC16]' :
              log?.status === 'running' ? 'text-yellow-400' :
              log?.status === 'error' ? 'text-red-400' : 'text-[#9ca3af]'
            }`}>
              {log?.status === 'ok' ? 'Успешно' :
               log?.status === 'running' ? 'Выполняется...' :
               log?.status === 'error' ? 'Ошибка' :
               log?.status === 'never' ? 'Не запускался' : (log?.status ?? '—')}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">Товаров в кэше</div>
            <div className="text-[14px] font-medium text-white">{stockCount ?? '—'}</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1">Последний синк</div>
            <div className="text-[14px] font-medium text-white">{lastSync ?? '—'}</div>
          </div>
          {log?.error && (
            <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-4">
              <div className="text-[11px] text-red-400 uppercase tracking-wider mb-1">Ошибка</div>
              <div className="text-[13px] text-red-300 font-mono break-all">{log.error}</div>
            </div>
          )}
        </div>

        <div className="text-[12px] text-[#4b5563] border-t border-white/[0.04] pt-4">
          Источник: <span className="text-[#6b7280]">green-spark.ru</span> · Категория: Комплектующие для ремонта ·
          Обновление: вручную или по расписанию
        </div>
      </AdminCard>

      <LibertiMapCard />
    </div>
  );
}

function SuppliersTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name, refCount }

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchAdminSuppliers()); } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async data => {
    setSaving(true);
    try {
      if (editItem) await updateAdminSupplier(editItem.id, data);
      else await createAdminSupplier(data);
      setModal(false); setEditItem(null);
      toast(editItem ? 'Поставщик обновлён' : 'Поставщик добавлен');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleMarkChecked = async (supId) => {
    try {
      await updateAdminSupplier(supId, { lastPriceCheck: new Date().toISOString() });
      toast('Отмечено как проверенное');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDeleteRequest = async (id) => {
    const sup = items.find(s => s.id === id);
    try {
      const all = await fetchAdminServices();
      const refCount = all.filter(s => s.supplierId === id).length;
      if (refCount > 0) {
        setDeleteConfirm({ id, name: sup?.name ?? id, refCount });
      } else {
        setDeleteConfirm({ id, name: sup?.name ?? id, refCount: 0 });
      }
    } catch {
      setDeleteConfirm({ id, name: sup?.name ?? id, refCount: 0 });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAdminSupplier(deleteConfirm.id);
      toast('Поставщик удалён');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const existingNames = items.map(s => s.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#6b7280]">
          Поставщики запчастей. Настройте шаблон поиска для быстрого поиска деталей прямо из таблицы услуг.
        </p>
        <button type="button" onClick={() => { setEditItem(null); setModal(true); }}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#84CC16] text-[#0a0b0e] font-semibold text-[13px] hover:bg-[#a3e635] transition-colors shrink-0">
          <Plus className="w-4 h-4" />Добавить
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
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
            <SupplierCard key={sup.id} sup={sup}
              onEdit={() => { setEditItem(sup); setModal(true); }}
              onDelete={handleDeleteRequest}
              onMarkChecked={handleMarkChecked}
            />
          ))}
        </div>
      )}

      {/* Template hint */}
      <AdminCard className="p-4 bg-[#0c0d10]/40">
        <p className="text-[12px] font-medium text-[#6b7280] mb-1.5">Как настроить шаблон поиска</p>
        <p className="text-[12px] text-[#4b5563] leading-relaxed">
          В поле «Шаблон поиска» вставьте URL страницы поиска поставщика, заменив поисковый запрос на <code className="text-[#84CC16] bg-[#84CC16]/10 px-1 rounded">{'{}query'}</code>.
          Пример: <code className="text-[#9ca3af]">https://gsmops.ru/search/?query=&#123;query&#125;</code>
        </p>
      </AdminCard>

      <ConfirmModal
        open={!!deleteConfirm}
        title={`Удалить поставщика «${deleteConfirm?.name}»?`}
        message={deleteConfirm?.refCount > 0
          ? `У ${deleteConfirm.refCount} услуг(и) указан этот поставщик. После удаления поставщик будет убран из этих услуг автоматически.`
          : 'Это действие нельзя отменить.'}
        confirmLabel="Удалить"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {(modal || editItem) && (
        <SupplierFormModal
          initial={editItem}
          existingNames={existingNames}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ── Demand / Analytics Tab ────────────────────────────────────────────────────

function pluralCount(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} поиск`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} поиска`;
  return `${n} поисков`;
}

function DemandTab({ onCreateService }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setAnalytics(await fetchAdminSearchAnalytics()); }
    catch (e) { setError(e.message || 'Ошибка загрузки'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <AdminCard>
        <div className="flex items-center gap-2 text-amber-400 py-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          <button type="button" onClick={load} className="ml-2 text-[12px] underline">Повторить</button>
        </div>
      </AdminCard>
    );
  }

  const { gaps = [], trending = [], deviceCoverage = [], stats = {} } = analytics ?? {};

  return (
    <div className="space-y-6">
      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Уникальных запросов', value: stats.totalUnique ?? 0, icon: Search },
          { label: 'Всего поисков', value: stats.countTotal ?? 0, icon: Activity },
          { label: 'За неделю', value: stats.countWeek ?? 0, icon: TrendingUp },
          { label: 'Конверсий', value: stats.totalConversions ?? 0, icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <AdminCard key={label} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-[#84CC16]" />
              <p className="text-[10px] text-[#6b7280] uppercase tracking-wide font-mono">{label}</p>
            </div>
            <p className="text-[20px] font-bold text-white tabular-nums">{value.toLocaleString('ru')}</p>
          </AdminCard>
        ))}
      </div>

      {/* ── Gaps: queries with no matching service ── */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-[14px] font-semibold text-white">Спрос без услуг</h2>
            <span className="text-[11px] text-[#6b7280]">{gaps.length} запросов без подходящей услуги</span>
          </div>
          <button type="button" onClick={load}
            className="flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Обновить
          </button>
        </div>

        {gaps.length === 0 ? (
          <p className="text-[13px] text-[#4b5563] py-4 text-center">
            Все популярные запросы покрыты услугами 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.04] text-left">
                  <th className="pb-2 pr-4 font-medium text-[#6b7280] whitespace-nowrap">Запрос</th>
                  <th className="pb-2 pr-4 font-medium text-[#6b7280] hidden sm:table-cell">Тип детали</th>
                  <th className="pb-2 pr-4 font-medium text-[#6b7280] hidden md:table-cell">Устройство</th>
                  <th className="pb-2 pr-4 font-medium text-[#6b7280] text-right">Поисков</th>
                  <th className="pb-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {gaps.map(item => (
                  <tr key={item.q} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-amber-300 leading-snug">{item.q}</p>
                      {item.suggestedName && item.suggestedName !== item.q && (
                        <p className="text-[11px] text-[#4b5563] mt-0.5">{item.suggestedName}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell">
                      {item.partType && item.partType !== 'other' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-white/[0.05] text-[#9ca3af] font-medium">
                          {PART_TYPE_LABELS[item.partType] ?? item.partType}
                        </span>
                      ) : (
                        <span className="text-[#4b5563]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 hidden md:table-cell text-[#6b7280] whitespace-nowrap">
                      {item.deviceModel ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-white">
                      {item.count.toLocaleString('ru')}
                    </td>
                    <td className="py-2.5 text-right">
                      <button type="button"
                        onClick={() => onCreateService({
                          name: item.suggestedName || (item.q.charAt(0).toUpperCase() + item.q.slice(1)),
                          partType: item.partType || 'other',
                          brand: item.brand || null,
                          popularity: Math.min(99, Math.round(40 + item.count * 2)),
                        })}
                        className="h-7 px-2.5 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/20 text-[#84CC16] text-[11px] font-medium hover:bg-[#84CC16]/20 transition-colors flex items-center gap-1 ml-auto">
                        <Plus className="w-3 h-3" />Создать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* ── Device coverage ── */}
      {deviceCoverage.length > 0 && (
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <h2 className="text-[14px] font-semibold text-white">Устройства с малым каталогом</h2>
            <span className="text-[11px] text-[#6b7280]">много запросов — мало услуг</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {deviceCoverage.slice(0, 12).map(item => (
              <div key={item.device}
                className="rounded-xl border border-white/[0.06] bg-[#0c0d10]/50 p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[13.5px] font-semibold text-white leading-snug">{item.device}</p>
                  {item.brand && (
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#6b7280]">
                      {item.brand}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-2 text-[12px]">
                  <span className="text-amber-400 font-medium">{pluralCount(item.queryCount)}</span>
                  <span className="text-[#4b5563]">·</span>
                  <span className="text-[#9ca3af]">{item.serviceCount} {item.serviceCount === 1 ? 'услуга' : item.serviceCount < 5 ? 'услуги' : 'услуг'}</span>
                </div>
                {item.missing.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-[#4b5563] font-mono uppercase tracking-wide">Нет услуг:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.missing.map(pt => (
                        <button key={pt} type="button"
                          onClick={() => onCreateService({
                            name: `${PART_TYPE_LABELS[pt] ?? pt} ${item.device}`,
                            partType: pt,
                            brand: item.brand || null,
                            popularity: Math.min(95, Math.round(item.queryCount / (item.missing.length || 1))),
                          })}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5" />{PART_TYPE_LABELS[pt] ?? pt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-[14px] font-semibold text-white">Растущие запросы</h2>
            <span className="text-[11px] text-[#6b7280]">активны за последние 7 дней</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {trending.slice(0, 20).map(item => (
              <div key={item.q}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c0d10]/40 border border-white/[0.04]">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{item.q}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.partType && item.partType !== 'other' && (
                      <span className="text-[10px] text-[#6b7280]">{PART_TYPE_LABELS[item.partType] ?? item.partType}</span>
                    )}
                    {item.deviceModel && (
                      <span className="text-[10px] text-[#4b5563]">{item.deviceModel}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[12px] font-bold text-emerald-400 tabular-nums">
                  {item.count}×
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {gaps.length === 0 && deviceCoverage.length === 0 && trending.length === 0 && (
        <AdminCard>
          <div className="py-10 text-center text-[#6b7280]">
            <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Данных пока нет. Как только клиенты начнут искать услуги, здесь появится аналитика.</p>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

// ── Calculator feature toggle ─────────────────────────────────────────────────

function CalculatorToggleCard({ settings, onSave, saving }) {
  const enabled = settings?.modelCalculatorEnabled ?? false;
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onSave({ ...settings, modelCalculatorEnabled: !enabled });
    } finally {
      setToggling(false);
    }
  };

  return (
    <AdminCard className="p-4 mb-1">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[14px] font-semibold text-white">Рассчитать по модели</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-[var(--bg-elevated)] text-[#6b7280] border-white/[0.08]'
              }`}>
                {enabled ? 'Видно клиентам' : 'Скрыто от клиентов'}
              </span>
            </div>
            <p className="text-[12px] text-[#6b7280]">
              {enabled
                ? 'На /prise показываются обе вкладки. Клиент может рассчитать стоимость по модели.'
                : 'На /prise показывается только «Каталог услуг». Синк поставщиков и внутренняя работа продолжаются.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling || saving || !settings}
          className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            enabled
              ? 'bg-white/[0.06] border border-white/[0.1] text-[#9ca3af] hover:text-red-400 hover:border-red-400/30'
              : 'bg-[#84CC16] text-[#0a0b0e] hover:bg-[#a3e635]'
          }`}
        >
          {toggling ? 'Сохраняем...' : enabled ? 'Скрыть от клиентов' : 'Включить для клиентов'}
        </button>
      </div>
    </AdminCard>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RepairPricePage() {
  const { settings, setSettings, save, reset, saving, saved, saveError } = useRepairSettings();
  const [tab, setTab] = useState('services');
  const [suppliers, setSuppliers] = useState([]);
  // Cross-tab: "create service" pre-fill coming from DemandTab
  const [pendingCreate, setPendingCreate] = useState(null);

  useEffect(() => {
    fetchAdminSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  const categorySettings = useMemo(
    () => settings?.categorySettings ?? createDefaultCategorySettings(),
    [settings],
  );

  const updateCategory = useCallback((pt, field, value) => {
    setSettings(prev => ({
      ...prev,
      categorySettings: {
        ...(prev?.categorySettings ?? createDefaultCategorySettings()),
        [pt]: {
          ...(prev?.categorySettings?.[pt] ?? createDefaultCategorySettings()[pt] ?? {}),
          [field]: value,
        },
      },
    }));
  }, [setSettings]);

  // Called from DemandTab when user clicks "Создать" on a gap/device
  const handleCreateFromDemand = useCallback((prefill) => {
    setPendingCreate(prefill);
    setTab('services');
  }, []);

  const tabs = [
    { id: 'services',   label: 'Услуги' },
    { id: 'markup',     label: 'Наценки' },
    { id: 'suppliers',  label: 'Поставщики' },
    { id: 'stock',      label: 'Склад GS' },
    { id: 'demand',     label: 'Аналитика' },
  ];

  if (!settings) {
    return (
      <>
        <PageHeader title="Прайс и услуги" description="Загрузка настроек..." />
        <AdminCard><div className="h-40 animate-pulse bg-white/[0.03] rounded-xl" /></AdminCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Прайс и услуги"
        description="Управление каталогом услуг, закупочными ценами и наценками."
      />

      <CalculatorToggleCard settings={settings} onSave={save} saving={saving} />

      <AdminTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'services' && (
        <ServicesTab
          suppliers={suppliers}
          categorySettings={categorySettings}
          pendingCreate={pendingCreate}
          onPendingConsumed={() => setPendingCreate(null)}
        />
      )}

      {tab === 'markup' && (
        <MarkupTab
          settings={settings}
          onUpdateCategory={updateCategory}
          onSave={() => save()}
          onReset={reset}
          saving={saving}
          saved={saved}
          saveError={saveError}
        />
      )}

      {tab === 'suppliers' && <SuppliersTab />}

      {tab === 'stock' && <StockSyncTab />}

      {tab === 'demand' && (
        <DemandTab onCreateService={handleCreateFromDemand} />
      )}
    </>
  );
}
