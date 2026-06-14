import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, Clock, HelpCircle, MapPin, Package, Search,
  SlidersHorizontal, Sparkles, TrendingUp, X, Zap,
} from 'lucide-react';
import { fetchServices, fetchPopularSearches } from '../api/repairPriceApi';
import { getSessionId, trackServiceCta } from '../../hooks/useAnalytics';
import { withWhatsappText } from '../../utils/contactActions';
import { brandFromModel } from '../utils/brandFromModel';

// ── Metadata ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '', label: 'Все услуги' },
  { id: 'replace', label: 'Замена' },
  { id: 'repair', label: 'Ремонт' },
  { id: 'diagnostic', label: 'Диагностика' },
];

const DEVICE_TYPES = [
  { id: '', label: 'Все' },
  { id: 'smartphone', label: 'Смартфон' },
  { id: 'tablet', label: 'Планшет' },
  { id: 'laptop', label: 'Ноутбук' },
];

const PART_TYPES = [
  { id: '', label: 'Все детали' },
  { id: 'display', label: 'Дисплей / экран' },
  { id: 'battery', label: 'Аккумулятор' },
  { id: 'port', label: 'Разъём зарядки' },
  { id: 'camera', label: 'Камера' },
  { id: 'speaker', label: 'Динамик / микрофон' },
  { id: 'button', label: 'Кнопки' },
  { id: 'cover', label: 'Корпус / крышка' },
  { id: 'keyboard', label: 'Клавиатура' },
  { id: 'other', label: 'Прочее' },
];

const SORT_OPTIONS = [
  { id: 'popularity', label: 'По популярности' },
  { id: 'price_asc', label: 'Сначала дешевле' },
  { id: 'price_desc', label: 'Сначала дороже' },
];

// Service groups for grouped view
const PART_GROUPS = [
  { key: 'screen',    label: 'Экран и стекло',    types: new Set(['display', 'glass']) },
  { key: 'battery',   label: 'Аккумулятор',        types: new Set(['battery']) },
  { key: 'charging',  label: 'Зарядка',            types: new Set(['port']) },
  { key: 'housing',   label: 'Корпус',             types: new Set(['back-glass', 'housing', 'cover']) },
  { key: 'camera',    label: 'Камера',             types: new Set(['camera', 'camera-glass']) },
  { key: 'audio',     label: 'Аудио',              types: new Set(['speaker', 'ear-speaker', 'microphone']) },
  { key: 'biometric', label: 'Биометрия',          types: new Set(['face-id']) },
  { key: 'controls',  label: 'Шлейфы и кнопки',   types: new Set(['button', 'flex', 'vibration']) },
  { key: 'other',     label: 'Прочее',             types: new Set(['keyboard', 'water', 'diagnostic', 'other']) },
];

const DEFAULT_POPULAR_CHIPS = [
  'Замена дисплея', 'Аккумулятор', 'Разъём зарядки',
  'Камера', 'Диагностика', 'Корпус', 'Чистка',
];


// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(svc) {
  // clientPrice from computeSimplePrice (purchase price → markup → labor)
  if (svc.clientPrice != null) return `${Number(svc.clientPrice).toLocaleString('ru')} ₽`;
  if (svc.price != null) return `${Number(svc.price).toLocaleString('ru')} ₽`;
  if (svc.priceFrom != null && svc.priceTo != null)
    return `${Number(svc.priceFrom).toLocaleString('ru')} – ${Number(svc.priceTo).toLocaleString('ru')} ₽`;
  if (svc.priceFrom != null) return `от ${Number(svc.priceFrom).toLocaleString('ru')} ₽`;
  if (svc.priceTo != null) return `до ${Number(svc.priceTo).toLocaleString('ru')} ₽`;
  return 'Цена по запросу';
}

function devLabel(id) { return DEVICE_TYPES.find(d => d.id === id)?.label ?? id; }
function partLabel(id) { return PART_TYPES.find(p => p.id === id)?.label ?? id; }

// ── Availability badge ────────────────────────────────────────────────────────

function AvailabilityBadge({ status }) {
  if (status === 'in_stock') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-2.5 h-2.5" />В наличии
      </span>
    );
  }
  if (status === 'order') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Package className="w-2.5 h-2.5" />Под заказ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
      <HelpCircle className="w-2.5 h-2.5" />Уточняйте наличие
    </span>
  );
}

// ── Chip group ────────────────────────────────────────────────────────────────

function ChipGroup({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id === value ? '' : opt.id)}
          className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap ${
            value === opt.id
              ? 'bg-[#84CC16] text-[#0a0b0e]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-medium)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Popular search chips ──────────────────────────────────────────────────────

function PopularChips({ chips, onSelect }) {
  if (!chips.length) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3 h-3 text-[var(--text-muted)]" />
        <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Популярные запросы</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => onSelect(chip)}
            className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-[#84CC16]/30 hover:text-[#84CC16] transition-colors whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({ svc, phone, contacts, selectedModel }) {
  const price = formatPrice(svc);
  const isPriceComputed = svc.clientPrice != null;

  // Build CTA href: WhatsApp with pre-fill if model known, else phone/contact
  const whatsappContact = contacts?.find(c => c.type === 'whatsapp');
  let ctaHref;
  let ctaLabel = 'Записаться';

  if (selectedModel && whatsappContact?.url) {
    const msg = `Здравствуйте! Хочу записаться на «${svc.name}»${selectedModel ? ` для ${selectedModel}` : ''}. Ориентировочная цена: ${price}.`;
    ctaHref = withWhatsappText(whatsappContact.url, msg);
    ctaLabel = 'Записаться';
  } else if (phone) {
    ctaHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  } else {
    ctaHref = '/otpravit-v-remont';
  }

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] hover:border-[var(--border-accent-hover)] hover:bg-[var(--bg-elevated)] transition-all duration-200 overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-[#84CC16]/40 via-[#84CC16] to-[#84CC16]/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            {devLabel(svc.deviceType)}
          </span>
          {svc.brand && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {svc.brand}
            </span>
          )}
          {svc.inStockStavropol && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84CC16]/10 text-[#84CC16] border border-[#84CC16]/20">
              <MapPin className="w-2.5 h-2.5" />В наличии
            </span>
          )}
          {!svc.inStockStavropol && svc.deliveryDays > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              <Clock className="w-2.5 h-2.5" />{svc.deliveryDays} дн.
            </span>
          )}
          {svc.hasExpress && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap className="w-2.5 h-2.5" />Экспресс
            </span>
          )}
          <AvailabilityBadge status={svc.availability} />
        </div>

        {/* Title */}
        <h3 className="text-[14.5px] font-semibold text-[var(--text-primary)] leading-snug">{svc.name}</h3>

        {/* Description */}
        {svc.description && (
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{svc.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-end justify-between gap-3">
          <div>
            <p className={`text-[19px] font-bold leading-none ${isPriceComputed ? 'text-[#84CC16]' : 'text-[var(--text-primary)]'}`}>
              {price}
            </p>
            {isPriceComputed && (svc.priceFrom != null || svc.priceTo != null) && (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                диапазон {svc.priceFrom != null ? `от ${svc.priceFrom.toLocaleString('ru')}` : ''}{svc.priceTo != null ? ` до ${svc.priceTo.toLocaleString('ru')}` : ''} ₽
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] shrink-0">
            <Clock className="w-3.5 h-3.5" />{svc.duration}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-[var(--border-subtle)] px-4 py-3">
        <a
          href={ctaHref}
          target={ctaHref.startsWith('https://') ? '_blank' : undefined}
          rel={ctaHref.startsWith('https://') ? 'noopener noreferrer' : undefined}
          onClick={() => trackServiceCta(svc.name)}
          className="flex items-center justify-center gap-2 w-full text-[13px] font-semibold text-[#84CC16] hover:text-[var(--text-primary)] transition-colors"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] p-4 animate-pulse">
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-16 rounded-full bg-[var(--bg-elevated)]" />
        <div className="h-5 w-14 rounded-full bg-[var(--bg-elevated)]" />
      </div>
      <div className="h-4 w-3/4 rounded bg-[var(--bg-elevated)] mb-2" />
      <div className="h-3 w-full rounded bg-[var(--bg-elevated)] mb-1" />
      <div className="h-3 w-2/3 rounded bg-[var(--bg-elevated)] mb-4" />
      <div className="h-6 w-28 rounded bg-[var(--bg-elevated)]" />
    </div>
  );
}

// ── Group section header ──────────────────────────────────────────────────────

function GroupSection({ label, items, phone, contacts, selectedModel }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{label}</h2>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        <span className="text-[11px] text-[var(--text-muted)]">{items.length}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(svc => (
          <ServiceCard key={svc.id} svc={svc} phone={phone} contacts={contacts} selectedModel={selectedModel} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ServiceCatalog({ phone, contacts, selectedModel, onClearModel }) {
  const [category, setCategory] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [partType, setPartType] = useState('');
  const [sort, setSort] = useState('popularity');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [popularChips, setPopularChips] = useState(DEFAULT_POPULAR_CHIPS);

  // Brand filter derived from selected model
  const modelBrand = useMemo(() => brandFromModel(selectedModel), [selectedModel]);

  useEffect(() => {
    fetchPopularSearches(10).then(data => {
      if (data.length >= 3) setPopularChips(data.map(d => d.q ?? d.query ?? String(d)));
    }).catch(() => {});
  }, []);

  const debounceRef = useRef(null);
  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 280);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServices({
        category: category || undefined,
        deviceType: deviceType || undefined,
        partType: partType || undefined,
        brand: modelBrand || undefined,
        search: debouncedSearch || undefined,
        sort,
        sessionId: debouncedSearch ? getSessionId() : undefined,
      });
      setItems(data);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [category, deviceType, partType, modelBrand, debouncedSearch, sort]);

  useEffect(() => { load(); }, [load]);

  const activeFiltersCount = [category, deviceType, partType].filter(Boolean).length + (onlyInStock ? 1 : 0);

  const availablePartTypes = useMemo(() => {
    if (deviceType === 'laptop') return PART_TYPES.filter(p => !['camera', 'speaker', 'button', 'cover'].includes(p.id));
    if (deviceType === 'smartphone') return PART_TYPES.filter(p => p.id !== 'keyboard');
    return PART_TYPES;
  }, [deviceType]);

  const handleChipClick = (term) => {
    handleSearch(term);
    setShowFilters(false);
  };

  const resetAll = () => {
    setCategory('');
    setDeviceType('');
    setPartType('');
    setOnlyInStock(false);
    handleSearch('');
  };

  // Grouped view: only when no search and no partType filter
  const displayItems = useMemo(
    () => onlyInStock ? items.filter(s => s.inStockStavropol) : items,
    [items, onlyInStock],
  );

  const grouped = useMemo(() => {
    if (debouncedSearch || partType) return null;
    const groups = PART_GROUPS
      .map(g => ({ ...g, groupItems: displayItems.filter(s => g.types.has(s.partType)) }))
      .filter(g => g.groupItems.length > 0);
    // Only use grouped if we have 2+ distinct groups (otherwise flat makes more sense)
    return groups.length >= 2 ? groups : null;
  }, [displayItems, debouncedSearch, partType]);

  return (
    <div>
      {/* Model filter badge */}
      {selectedModel && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-2xl bg-[#84CC16]/[0.08] border border-[#84CC16]/20">
          <span className="text-[12px] text-[#84CC16] font-medium flex-1 truncate">
            Услуги для: <span className="font-bold">{selectedModel}</span>
            {modelBrand && <span className="text-[#84CC16]/60 ml-1">({modelBrand})</span>}
          </span>
          <button
            type="button"
            onClick={onClearModel}
            className="flex items-center gap-1 text-[12px] text-[#84CC16]/70 hover:text-[#84CC16] transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />Сброс
          </button>
        </div>
      )}

      {/* Popular chips */}
      {!debouncedSearch && !activeFiltersCount && !selectedModel && (
        <PopularChips chips={popularChips} onSelect={handleChipClick} />
      )}

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Поиск: дисплей, аккумулятор, корпус…"
            className="w-full h-[42px] pl-9 pr-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-medium)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#84CC16]/40 transition-colors"
          />
          {search && (
            <button type="button" onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className={`relative flex items-center gap-2 h-[42px] px-3.5 rounded-xl border text-[13px] font-medium transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'border-[#84CC16]/40 bg-[#84CC16]/10 text-[#84CC16]'
              : 'border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Фильтры</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#84CC16] text-[#0a0b0e] text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="hidden sm:block h-[42px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-medium)] text-[13px] text-[var(--text-secondary)] outline-none focus:border-[#84CC16]/40 transition-colors"
        >
          {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-elevated)] space-y-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Тип услуги</p>
            <ChipGroup options={CATEGORIES} value={category} onChange={setCategory} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Устройство</p>
            <ChipGroup options={DEVICE_TYPES} value={deviceType} onChange={v => { setDeviceType(v); setPartType(''); }} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Деталь / компонент</p>
            <ChipGroup options={availablePartTypes} value={partType} onChange={setPartType} />
          </div>
          <div className="sm:hidden">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Сортировка</p>
            <ChipGroup options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>
          {activeFiltersCount > 0 && (
            <button type="button" onClick={() => { setCategory(''); setDeviceType(''); setPartType(''); }}
              className="text-[12px] text-[var(--text-muted)] hover:text-[#84CC16] transition-colors">
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {/* Quick device chips + in-stock filter */}
      {!showFilters && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <ChipGroup
            options={[
              { id: '', label: 'Все' },
              { id: 'smartphone', label: 'Смартфоны' },
              { id: 'tablet', label: 'Планшеты' },
              { id: 'laptop', label: 'Ноутбуки' },
            ]}
            value={deviceType}
            onChange={v => { setDeviceType(v); setPartType(''); }}
          />
          <button
            type="button"
            onClick={() => setOnlyInStock(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap ${
              onlyInStock
                ? 'bg-[#84CC16] text-[#0a0b0e]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-medium)]'
            }`}
          >
            <MapPin className="w-3 h-3 shrink-0" />В наличии
          </button>
        </div>
      )}

      {/* Count line */}
      {!loading && !error && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12.5px] text-[var(--text-muted)]">
            {displayItems.length > 0
              ? `Найдено: ${displayItems.length} ${displayItems.length === 1 ? 'услуга' : displayItems.length < 5 ? 'услуги' : 'услуг'}`
              : 'Ничего не найдено'}
          </p>
          {debouncedSearch && (
            <p className="text-[12px] text-[var(--text-muted)]">
              «<span className="text-[#84CC16]">{debouncedSearch}</span>»
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="py-10 text-center text-[14px] text-[var(--text-secondary)]">
          <p>Не удалось загрузить каталог</p>
          <button type="button" onClick={load} className="mt-2 text-[#84CC16] hover:underline text-[13px]">Повторить</button>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="py-12 text-center">
          <Sparkles className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[14px] text-[var(--text-secondary)]">
            {onlyInStock
              ? 'Нет услуг с запчастями в наличии в Ставрополе'
              : selectedModel
              ? `Для «${selectedModel}» услуги не найдены${debouncedSearch ? ` по запросу «${debouncedSearch}»` : ''}`
              : debouncedSearch ? `По запросу «${debouncedSearch}» ничего не найдено` : 'Услуги не найдены'}
          </p>
          {(debouncedSearch || activeFiltersCount > 0 || selectedModel) && (
            <button type="button" onClick={() => { resetAll(); if (selectedModel) onClearModel?.(); }} className="mt-2 text-[13px] text-[#84CC16] hover:underline">
              Сбросить
            </button>
          )}
        </div>
      ) : grouped ? (
        /* Grouped view: section headers by part type */
        <div>
          {grouped.map(g => (
            <GroupSection
              key={g.key}
              label={g.label}
              items={g.groupItems}
              phone={phone}
              contacts={contacts}
              selectedModel={selectedModel}
            />
          ))}
        </div>
      ) : (
        /* Flat grid view */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map(svc => (
            <ServiceCard key={svc.id} svc={svc} phone={phone} contacts={contacts} selectedModel={selectedModel} />
          ))}
        </div>
      )}
    </div>
  );
}
