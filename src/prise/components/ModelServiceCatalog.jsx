import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, HelpCircle, Package, Zap } from 'lucide-react';
import { fetchServices } from '../api/repairPriceApi';
import { withWhatsappText } from '../../utils/contactActions';
import { trackServiceCta } from '../../hooks/useAnalytics';
import { brandFromModel, deviceTypeFromModel } from '../utils/brandFromModel';
import { useSupplierParts } from '../hooks/useSupplierParts';
import { computeSimplePrice, createDefaultCategorySettings } from '../../data/repairCategorySettings';

// Part groups — must match ServiceCatalog
const PART_GROUPS = [
  { key: 'screen',    label: 'Экран и стекло',  types: new Set(['display', 'glass']) },
  { key: 'battery',   label: 'Аккумулятор',      types: new Set(['battery']) },
  { key: 'charging',  label: 'Зарядка',          types: new Set(['port']) },
  { key: 'housing',   label: 'Корпус',           types: new Set(['back-glass', 'housing', 'cover']) },
  { key: 'camera',    label: 'Камера',           types: new Set(['camera', 'camera-glass']) },
  { key: 'audio',     label: 'Аудио',            types: new Set(['speaker', 'ear-speaker', 'microphone']) },
  { key: 'biometric', label: 'Биометрия',        types: new Set(['face-id']) },
  { key: 'controls',  label: 'Кнопки и шлейфы', types: new Set(['button', 'flex', 'vibration']) },
  { key: 'other',     label: 'Прочее',           types: new Set(['keyboard', 'water', 'diagnostic', 'other']) },
];

const DEFAULT_CAT = createDefaultCategorySettings();

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(svc) {
  if (svc.clientPrice != null) return `${Number(svc.clientPrice).toLocaleString('ru')} ₽`;
  if (svc.price != null) return `${Number(svc.price).toLocaleString('ru')} ₽`;
  if (svc.priceFrom != null && svc.priceTo != null)
    return `${Number(svc.priceFrom).toLocaleString('ru')} – ${Number(svc.priceTo).toLocaleString('ru')} ₽`;
  if (svc.priceFrom != null) return `от ${Number(svc.priceFrom).toLocaleString('ru')} ₽`;
  if (svc.priceTo != null) return `до ${Number(svc.priceTo).toLocaleString('ru')} ₽`;
  return 'Цена по запросу';
}

function availPriority(svc) {
  if (svc.availability === 'in_stock') return 0;
  if (svc.availability === 'order') return 1;
  if (svc.price != null || svc.priceFrom != null) return 2;
  return 3;
}

// Supplier stock sort: in_stock → low → preorder → out
function partPriority(p) {
  if (p.stockStatus === 'in_stock') return 0;
  if (p.stockStatus === 'low') return 1;
  if (p.stockStatus === 'preorder') return 2;
  return 3;
}

// ── Availability badge (generic service) ──────────────────────────────────────

function AvailabilityBadge({ status }) {
  if (status === 'in_stock') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-2.5 h-2.5" />В наличии
    </span>
  );
  if (status === 'order') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Package className="w-2.5 h-2.5" />Под заказ
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
      <HelpCircle className="w-2.5 h-2.5" />Уточняйте наличие
    </span>
  );
}

// ── Supplier stock badge ──────────────────────────────────────────────────────

function StockBadge({ status }) {
  if (status === 'in_stock') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />В наличии
    </span>
  );
  if (status === 'low') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Мало
    </span>
  );
  if (status === 'preorder') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-400">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />Под заказ
    </span>
  );
  return null;
}

// ── Supplier parts section (inside service card) ──────────────────────────────

function SupplierSection({ parts, loading }) {
  if (loading) {
    return (
      <div className="border-t border-[var(--border-subtle)] mt-2 pt-2 animate-pulse space-y-1.5">
        <div className="h-2.5 w-24 rounded bg-[var(--bg-elevated)]" />
        <div className="h-2.5 w-full rounded bg-[var(--bg-elevated)]" />
        <div className="h-2.5 w-3/4 rounded bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  // Show only parts that have some stock (not "out")
  const available = [...parts]
    .filter(p => p.stockStatus !== 'out')
    .sort((a, b) => partPriority(a) - partPriority(b));

  if (!available.length) return null;

  const shown = available.slice(0, 3);
  const extra = available.length - 3;

  return (
    <div className="border-t border-[var(--border-subtle)] mt-2 pt-2 space-y-1.5">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
        Детали у поставщика
      </p>
      {shown.map((p, i) => (
        <div key={i} className="flex items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-[var(--text-secondary)] leading-tight line-clamp-1">
              {p.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StockBadge status={p.stockStatus} />
            {p.price != null && (
              <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
                {p.price.toLocaleString('ru')} ₽
              </span>
            )}
          </div>
        </div>
      ))}
      {extra > 0 && (
        <p className="text-[10px] text-[var(--text-muted)]">+{extra} вариантов</p>
      )}
    </div>
  );
}

// ── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({ svc, modelLabel, contacts, supplierParts, partsLoading }) {
  const whatsappContact = contacts?.find(c => c.type === 'whatsapp');

  // Best in-stock supplier part (cheapest available)
  const bestPart = supplierParts?.length
    ? [...supplierParts]
        .filter(p => p.stockStatus === 'in_stock' || p.stockStatus === 'low')
        .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0] ?? null
    : null;

  // Client price from supplier part + default markup
  const supplierClientPrice = bestPart?.price
    ? computeSimplePrice(bestPart.price, svc.partType, DEFAULT_CAT)
    : null;

  // Override availability badge when supplier confirms stock
  const hasSupplierStock = !!bestPart;
  const effectiveAvail = hasSupplierStock ? 'in_stock' : svc.availability;

  // Display price: supplier-computed > admin-computed > generic range
  const priceStr = supplierClientPrice != null
    ? `${supplierClientPrice.toLocaleString('ru')} ₽`
    : formatPrice(svc);
  const hasRealPrice = supplierClientPrice != null || svc.clientPrice != null;

  let ctaHref;
  if (modelLabel && whatsappContact?.url) {
    const msg = `Здравствуйте! Хочу записаться на «${svc.name}» для ${modelLabel}. Ориентировочная цена: ${priceStr}.`;
    ctaHref = withWhatsappText(whatsappContact.url, msg);
  } else {
    ctaHref = '/otpravit-v-remont';
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] hover:border-[var(--border-accent-hover)] hover:bg-[var(--bg-elevated)] transition-all duration-200 overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-[#84CC16]/40 via-[#84CC16] to-[#84CC16]/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col flex-1 p-3.5 gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          <AvailabilityBadge status={effectiveAvail} />
          {svc.hasExpress && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap className="w-2.5 h-2.5" />Экспресс
            </span>
          )}
        </div>

        <h3 className="text-[13.5px] font-semibold text-[var(--text-primary)] leading-snug">{svc.name}</h3>

        {svc.description && (
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{svc.description}</p>
        )}

        {/* Supplier stock section — loading skeleton or parts list */}
        <SupplierSection parts={supplierParts ?? []} loading={partsLoading} />

        <div className="mt-auto pt-1.5 flex items-end justify-between gap-2">
          <p className={`text-[18px] font-bold leading-none ${hasRealPrice ? 'text-[#84CC16]' : 'text-[var(--text-primary)]'}`}>
            {priceStr}
          </p>
          {svc.duration && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] shrink-0">
              <Clock className="w-3 h-3" />{svc.duration}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] px-3.5 py-2.5">
        <a
          href={ctaHref}
          target={ctaHref.startsWith('https://') ? '_blank' : undefined}
          rel={ctaHref.startsWith('https://') ? 'noopener noreferrer' : undefined}
          onClick={() => trackServiceCta(svc.name)}
          className="flex items-center justify-center gap-2 w-full text-[12.5px] font-semibold text-[#84CC16] hover:text-[var(--text-primary)] transition-colors"
        >
          Записаться на ремонт
        </a>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="mt-10">
      <div className="h-5 w-52 rounded bg-[var(--bg-elevated)] mb-6 animate-pulse" />
      {[1, 2].map(g => (
        <div key={g} className="mb-7">
          <div className="h-4 w-28 rounded bg-[var(--bg-elevated)] mb-3 animate-pulse" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] p-3.5 animate-pulse">
                <div className="h-5 w-20 rounded-full bg-[var(--bg-elevated)] mb-2.5" />
                <div className="h-4 w-3/4 rounded bg-[var(--bg-elevated)] mb-3" />
                <div className="h-6 w-24 rounded bg-[var(--bg-elevated)]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ModelServiceCatalog({ modelLabel, contacts }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const brand = useMemo(() => brandFromModel(modelLabel), [modelLabel]);
  const deviceType = useMemo(() => deviceTypeFromModel(modelLabel), [modelLabel]);

  // Supplier stock — fetched in parallel, never blocks catalog render
  const { parts, partsLoading } = useSupplierParts(modelLabel);

  // Group supplier parts by partType for O(1) lookup per service card
  const partsByType = useMemo(() => {
    const map = new Map();
    for (const p of parts) {
      if (!p.partType) continue;
      if (!map.has(p.partType)) map.set(p.partType, []);
      map.get(p.partType).push(p);
    }
    return map;
  }, [parts]);

  useEffect(() => {
    if (!modelLabel) { setItems([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchServices({ brand: brand || undefined, deviceType })
      .then(data => {
        if (cancelled) return;
        data.sort((a, b) => availPriority(a) - availPriority(b));
        setItems(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [modelLabel, brand, deviceType]);

  const groups = useMemo(() =>
    PART_GROUPS
      .map(g => ({ ...g, groupItems: items.filter(s => g.types.has(s.partType)) }))
      .filter(g => g.groupItems.length > 0),
    [items],
  );

  if (!modelLabel) return null;
  if (loading) return <Skeleton />;
  if (groups.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
          Все виды ремонта — {modelLabel}
        </h2>
        <span className="text-[12px] text-[var(--text-muted)] shrink-0">{items.length} услуг</span>
      </div>

      {groups.map(g => (
        <div key={g.key} className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider shrink-0">
              {g.label}
            </h3>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-[11px] text-[var(--text-muted)] shrink-0">{g.groupItems.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.groupItems.map(svc => (
              <ServiceCard
                key={svc.id}
                svc={svc}
                modelLabel={modelLabel}
                contacts={contacts}
                supplierParts={partsByType.get(svc.partType) ?? []}
                partsLoading={partsLoading}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
