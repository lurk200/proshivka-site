import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity, BarChart2, ExternalLink, Globe, MousePointer2,
  RefreshCw, TrendingUp, Users, Zap, Search, Smartphone, Wrench,
  Thermometer, Target, MapPin, Cpu, AlertCircle, Trash2,
} from 'lucide-react';
import { PageHeader, AdminCard } from '../components/ui';

function adminHeaders() {
  return { 'X-Admin-Password': sessionStorage.getItem('proshivka-admin-api-key') || '' };
}

async function fetchAnalytics() {
  const res = await fetch('/api/admin/analytics', { headers: adminHeaders() });
  if (!res.ok) throw new Error('Ошибка загрузки');
  return res.json();
}

async function fetchSearchDemand() {
  const res = await fetch('/api/admin/analytics/search-demand?limit=100', { headers: adminHeaders() });
  if (!res.ok) throw new Error('Ошибка загрузки поисковой аналитики');
  return res.json();
}

// ── Reusable components ───────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent, small }) {
  return (
    <AdminCard className={small ? 'py-3' : 'py-4'}>
      <div className="flex items-center gap-3">
        <div className={`${small ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-[#84CC16]/15' : 'bg-white/[0.04]'}`}>
          <Icon className={`${small ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${accent ? 'text-[#84CC16]' : 'text-[#6b7280]'}`} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className={`${small ? 'text-lg' : 'text-xl'} font-semibold leading-none ${accent ? 'text-[#84CC16]' : 'text-white'}`}>{value}</p>
          <p className="text-[11px] text-[#6b7280] mt-1 truncate">{label}</p>
          {sub && <p className="text-[10px] text-[#4b5563] truncate">{sub}</p>}
        </div>
      </div>
    </AdminCard>
  );
}

function MiniBarChart({ data, height = 48 }) {
  if (!data?.length) return <p className="text-[12px] text-[#6b7280]">Нет данных</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div
            className="w-full rounded-sm bg-[#84CC16]/50 group-hover:bg-[#84CC16] transition-colors"
            style={{ height: `${Math.max(2, (d.count / max) * (height - 14))}px` }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-[#1a1c22] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap z-10 pointer-events-none">
            {d.date?.slice(5) ?? ''}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedList({ items, keyProp, countProp, secondProp, secondLabel, emptyText }) {
  if (!items?.length) return <p className="text-[12px] text-[#6b7280]">{emptyText || 'Нет данных'}</p>;
  const max = items[0]?.[countProp] || 1;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item[keyProp] ?? i} className="flex items-center gap-2">
          <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded-full bg-[#84CC16]/50" style={{ width: `${(item[countProp] / max) * 100}%` }} />
          </div>
          <span className="text-[12.5px] text-[#d1d5db] flex-1 min-w-0 truncate">{item[keyProp]}</span>
          <span className="text-[11px] text-[#6b7280] tabular-nums shrink-0">{item[countProp]}</span>
          {secondProp && item[secondProp] != null && (
            <span className="text-[10px] text-[#84CC16] tabular-nums shrink-0 ml-1" title={secondLabel}>
              {item[secondProp]}{secondLabel?.includes('%') ? '%' : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Badge({ text, color = 'gray' }) {
  const cls = {
    green: 'bg-[#84CC16]/15 text-[#84CC16]',
    gray: 'bg-white/[0.06] text-[#6b7280]',
    amber: 'bg-amber-500/15 text-amber-400',
    blue: 'bg-blue-500/15 text-blue-400',
  }[color] || 'bg-white/[0.06] text-[#6b7280]';
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${cls}`}>{text}</span>;
}

function OnlinePulse({ count }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full rounded-full ${count > 0 ? 'bg-[#84CC16] animate-ping opacity-75' : 'bg-[#4b5563]'}`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${count > 0 ? 'bg-[#84CC16]' : 'bg-[#4b5563]'}`} />
      </span>
      <span className={`text-[13px] font-semibold ${count > 0 ? 'text-[#84CC16]' : 'text-[#6b7280]'}`}>
        {count} {count === 1 ? 'посетитель' : count >= 2 && count <= 4 ? 'посетителя' : 'посетителей'} онлайн
      </span>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Обзор', icon: Activity },
  { id: 'search', label: 'Поисковые запросы', icon: Search },
  { id: 'devices', label: 'Устройства', icon: Smartphone },
  { id: 'services', label: 'Услуги', icon: Wrench },
  { id: 'funnel', label: 'Воронка', icon: TrendingUp },
  { id: 'clicks', label: 'Клики', icon: MousePointer2 },
  { id: 'sources', label: 'Источники', icon: Globe },
  { id: 'stavropol', label: 'Ставрополь', icon: MapPin },
  { id: 'performance', label: 'Производительность', icon: Cpu },
];

function TabBar({ active, onChange }) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex gap-1 min-w-max pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors ${
              active === id
                ? 'bg-[#84CC16]/15 text-[#84CC16] border border-[#84CC16]/25'
                : 'text-[#6b7280] hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ data }) {
  return (
    <>
      <div className="mb-5"><OnlinePulse count={data.onlineNow ?? 0} /></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard icon={Globe} label="Просмотров всего" value={(data.totalPageviews ?? 0).toLocaleString('ru')} />
        <KpiCard icon={Users} label="Сессий всего" value={(data.totalSessions ?? 0).toLocaleString('ru')} />
        <KpiCard icon={Activity} label="Сегодня" value={(data.todayViews ?? 0).toLocaleString('ru')} accent />
        <KpiCard icon={TrendingUp} label="За неделю" value={(data.weekViews ?? 0).toLocaleString('ru')} />
        <KpiCard icon={BarChart2} label="За месяц" value={(data.monthViews ?? 0).toLocaleString('ru')} />
        <KpiCard icon={Target} label="Конверсий (30д)" value={data.totalConversions ?? 0} sub={`${data.conversionRate ?? 0}% от просмотров`} accent={data.totalConversions > 0} />
      </div>

      <AdminCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-white">Просмотры за 30 дней</h3>
        </div>
        <MiniBarChart data={data.daily} height={64} />
        <div className="flex justify-between text-[10px] text-[#4b5563] mt-1">
          <span>{data.daily?.[0]?.date?.slice(5) ?? ''}</span>
          <span>{data.daily?.[data.daily.length - 1]?.date?.slice(5) ?? ''}</span>
        </div>
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Популярные страницы</h3>
          </div>
          <RankedList items={data.popularPages} keyProp="path" countProp="count" />
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Топ поисковых запросов</h3>
          </div>
          <RankedList
            items={data.topSearches}
            keyProp="q"
            countProp="count"
            secondProp="conversions"
            secondLabel="конв."
            emptyText="Нет данных о поисках"
          />
        </AdminCard>
      </div>
    </>
  );
}

// ── Tab: Search demand ────────────────────────────────────────────────────────

function SearchTab({ demand }) {
  const [filter, setFilter] = useState('');
  if (!demand) return <p className="text-[12px] text-[#6b7280]">Нет данных</p>;

  const { items = [], stats } = demand;
  const filtered = filter
    ? items.filter(d => d.q.includes(filter.toLowerCase()))
    : items;

  return (
    <>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <KpiCard icon={Search} label="Уникальных запросов" value={stats.totalUnique} small />
          <KpiCard icon={Activity} label="Всего поисков" value={stats.countTotal} small />
          <KpiCard icon={TrendingUp} label="Поисков за неделю" value={stats.countWeek} small />
          <KpiCard icon={Target} label="Конверсий" value={stats.totalConversions} sub={`${stats.avgConvRate}% в среднем`} accent small />
        </div>
      )}

      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-white">Поисковые запросы</h3>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Фильтр…"
            className="h-7 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-white placeholder:text-[#4b5563] outline-none focus:border-white/[0.18] w-40"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-[12px] text-[#6b7280]">Запросов не найдено</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-[#4b5563]">Запрос</th>
                  <th className="text-right py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-[#4b5563] w-16">Поисков</th>
                  <th className="text-right py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-[#4b5563] w-16">Конв.</th>
                  <th className="text-right py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-[#4b5563] w-16">Конв.%</th>
                  <th className="text-left py-2 pl-2 font-mono text-[10px] uppercase tracking-wider text-[#4b5563]">Устройство</th>
                  <th className="text-left py-2 pl-2 font-mono text-[10px] uppercase tracking-wider text-[#4b5563]">Категория</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((d, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#d1d5db] max-w-[180px] truncate">{d.q}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-white">{d.count}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-[#84CC16]">{d.conversions || 0}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      <span className={d.conversionRate > 0 ? 'text-[#84CC16]' : 'text-[#4b5563]'}>
                        {d.conversionRate}%
                      </span>
                    </td>
                    <td className="py-1.5 pl-2 text-[#6b7280]">{d.model || '—'}</td>
                    <td className="py-1.5 pl-2 text-[#6b7280]">{d.category || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}

// ── Tab: Devices + Fault categories ──────────────────────────────────────────

function DevicesTab({ data }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">Топ моделей устройств</h3>
        </div>
        {data.topModels?.length ? (
          <div className="space-y-2">
            {data.topModels.map((m, i) => {
              const max = data.topModels[0].searches || 1;
              return (
                <div key={m.model} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-[#84CC16]/50" style={{ width: `${(m.searches / max) * 100}%` }} />
                  </div>
                  <span className="text-[12.5px] text-[#d1d5db] flex-1 min-w-0 truncate">{m.model}</span>
                  <span className="text-[11px] text-[#6b7280] tabular-nums">{m.searches}</span>
                  {m.convRate > 0 && <Badge text={`${m.convRate}%`} color="green" />}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[#6b7280]">Данные появятся после поисковых запросов с названием устройства</p>
        )}
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">Топ категорий неисправностей</h3>
        </div>
        {data.topFaultCategories?.length ? (
          <div className="space-y-2">
            {data.topFaultCategories.map((c, i) => {
              const max = data.topFaultCategories[0].searches || 1;
              return (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-[#84CC16]/50" style={{ width: `${(c.searches / max) * 100}%` }} />
                  </div>
                  <span className="text-[12.5px] text-[#d1d5db] flex-1 min-w-0 truncate">{c.category}</span>
                  <span className="text-[11px] text-[#6b7280] tabular-nums">{c.searches}</span>
                  {c.convRate > 0 && <Badge text={`${c.convRate}%`} color="green" />}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[#6b7280]">Данные появятся после поисковых запросов</p>
        )}
      </AdminCard>
    </div>
  );
}

// ── Tab: Services heatmap ─────────────────────────────────────────────────────

function ServicesTab({ data }) {
  const heatmap = data.serviceHeatmap ?? [];
  return (
    <AdminCard>
      <div className="flex items-center gap-2 mb-4">
        <Thermometer className="w-4 h-4 text-[#84CC16]" />
        <h3 className="text-[14px] font-semibold text-white">Тепловая карта услуг</h3>
        <span className="text-[10px] text-[#4b5563]">кликов «Записаться» за 30 дней</span>
      </div>
      {heatmap.length === 0 ? (
        <p className="text-[12px] text-[#6b7280]">
          Нет данных. Клики «Записаться» в каталоге услуг появятся здесь.
        </p>
      ) : (
        <div className="space-y-2">
          {heatmap.map((item, i) => {
            const max = heatmap[0].clicks || 1;
            const pct = Math.round((item.clicks / max) * 100);
            const color = pct > 70 ? '#84CC16' : pct > 40 ? '#a3e635' : pct > 20 ? '#bef264' : '#84CC16';
            return (
              <div key={item.service} className="flex items-center gap-2">
                <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.6 + pct * 0.004 }} />
                </div>
                <span className="text-[12.5px] text-[#d1d5db] flex-[2] min-w-0 truncate">{item.service}</span>
                <span className="text-[11px] font-semibold text-white tabular-nums shrink-0">{item.clicks}</span>
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}

// ── Tab: Funnel ───────────────────────────────────────────────────────────────

const STEP_LABELS = {
  '/': 'Главная страница',
  '/prise': 'Калькулятор цен',
  '/otpravit-v-remont': 'Страница «Отправить в ремонт»',
  'service_cta': 'Клик «Записаться» (услуга)',
  'contact_click': 'Контакт (звонок / мессенджер)',
};

function FunnelTab({ data }) {
  const extended = data.extendedFunnel ?? [];
  const basic = data.funnel ?? [];

  const renderFunnel = (steps) => {
    if (!steps.length) return <p className="text-[12px] text-[#6b7280]">Нет данных</p>;
    const max = steps[0]?.count || 1;
    return (
      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = max > 0 ? Math.round((step.count / max) * 100) : 0;
          const drop = i > 0 && steps[i - 1]?.count > 0
            ? Math.round((1 - step.count / steps[i - 1].count) * 100)
            : null;
          const label = step.step || STEP_LABELS[step.path] || step.path;
          return (
            <div key={step.path || step.step}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12.5px] text-[#d1d5db]">
                  <span className="text-[#4b5563] mr-1.5">{i + 1}.</span>
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {drop !== null && <span className="text-[10px] text-red-400">−{drop}%</span>}
                  <span className="text-[12px] text-white tabular-nums">{step.count.toLocaleString('ru')}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-[#84CC16]" style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">Расширенная воронка</h3>
          <span className="text-[10px] text-[#4b5563]">30 дней</span>
        </div>
        {renderFunnel(extended)}
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#6b7280]" />
          <h3 className="text-[14px] font-semibold text-white">Базовая воронка (страницы)</h3>
        </div>
        {renderFunnel(basic)}
      </AdminCard>
    </div>
  );
}

// ── Tab: Clicks ───────────────────────────────────────────────────────────────

const TARGET_LABELS = {
  phone: 'Звонок',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  viber: 'Viber',
  vk: 'VKontakte',
  service_cta: 'Записаться (услуга)',
  send_repair_cta: 'Отправить в ремонт',
  map_click: 'Яндекс Карты',
  map_route: 'Построить маршрут',
  ask_master: 'Спросить мастера',
};

function ClicksTab({ data }) {
  const breakdown = data.ctaBreakdown ?? [];
  const topClicks = data.topClicks ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <MousePointer2 className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">По типу действия</h3>
        </div>
        {breakdown.length === 0 ? (
          <p className="text-[12px] text-[#6b7280]">Нет данных о кликах</p>
        ) : (
          <div className="space-y-2">
            {breakdown.map((item, i) => {
              const max = breakdown[0].count || 1;
              const label = TARGET_LABELS[item.target] || item.target;
              const isConv = ['phone', 'whatsapp', 'telegram', 'service_cta', 'send_repair_cta'].includes(item.target);
              return (
                <div key={item.target} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-[#84CC16]/50" style={{ width: `${(item.count / max) * 100}%` }} />
                  </div>
                  <span className="text-[12.5px] text-[#d1d5db] flex-1 min-w-0 truncate">{label}</span>
                  <span className="text-[11px] text-[#6b7280] tabular-nums">{item.count}</span>
                  {isConv && <Badge text="конв." color="green" />}
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <MousePointer2 className="w-4 h-4 text-[#6b7280]" />
          <h3 className="text-[14px] font-semibold text-white">Детализация кликов</h3>
        </div>
        <RankedList
          items={topClicks}
          keyProp="target"
          countProp="count"
          emptyText="Нет данных о кликах"
        />
      </AdminCard>
    </div>
  );
}

// ── Tab: Traffic sources ──────────────────────────────────────────────────────

function SourcesTab({ data }) {
  const sources = data.trafficSources ?? [];
  const referrers = data.topReferrers ?? [];
  const utm = data.utmSources ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">Классифицированные источники</h3>
        </div>
        <RankedList items={sources} keyProp="source" countProp="count" emptyText="Нет данных" />
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">Переходы с сайтов</h3>
        </div>
        <RankedList items={referrers} keyProp="referrer" countProp="count" emptyText="Нет переходов с внешних сайтов" />
      </AdminCard>

      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-[#84CC16]" />
          <h3 className="text-[14px] font-semibold text-white">UTM-источники</h3>
        </div>
        <RankedList items={utm} keyProp="source" countProp="count" emptyText="Нет UTM-параметров" />
        {!utm.length && (
          <p className="text-[11px] text-[#4b5563] mt-2">
            Добавляйте ?utm_source= к ссылкам в рекламе
          </p>
        )}
      </AdminCard>
    </div>
  );
}

// ── Tab: Stavropol local block ────────────────────────────────────────────────

function StavropolTab({ data }) {
  const st = data.stavropol ?? {};
  const brands = st.popularBrands ?? [];
  const repairs = st.popularRepairs ?? [];
  const topLocal = st.topLocal ?? [];

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#84CC16]" />
        <p className="text-[13px] text-[#9ca3af]">
          Спрос в Ставрополе — на основе поисковых запросов в каталоге
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-5">
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Популярные бренды</h3>
          </div>
          {brands.length ? (
            <div className="space-y-2">
              {brands.map((b, i) => {
                const max = brands[0].searches || 1;
                return (
                  <div key={b.brand} className="flex items-center gap-2">
                    <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-[#84CC16]/50" style={{ width: `${(b.searches / max) * 100}%` }} />
                    </div>
                    <span className="text-[12.5px] text-[#d1d5db] flex-1">{b.brand}</span>
                    <span className="text-[11px] text-[#6b7280] tabular-nums">{b.searches}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-[#6b7280]">Данные появятся после поисковых запросов</p>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Популярные ремонты</h3>
          </div>
          {repairs.length ? (
            <div className="space-y-2">
              {repairs.map((r, i) => {
                const max = repairs[0].searches || 1;
                return (
                  <div key={r.type} className="flex items-center gap-2">
                    <span className="text-[11px] text-[#4b5563] w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-[#84CC16]/50" style={{ width: `${(r.searches / max) * 100}%` }} />
                    </div>
                    <span className="text-[12.5px] text-[#d1d5db] flex-1">{r.type}</span>
                    <span className="text-[11px] text-[#6b7280] tabular-nums">{r.searches}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-[#6b7280]">Данные появятся после поисковых запросов</p>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Топ-запросы с устройством</h3>
          </div>
          {topLocal.length ? (
            <div className="space-y-2">
              {topLocal.map((d, i) => (
                <div key={d.q} className="flex items-start justify-between gap-2 py-1">
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-[#d1d5db] truncate">{d.q}</p>
                    <div className="flex gap-1 mt-0.5">
                      {d.model && <Badge text={d.model} color="blue" />}
                      {d.category && d.category !== 'Прочее' && <Badge text={d.category} color="gray" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#6b7280] tabular-nums shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#6b7280]">Нет данных</p>
          )}
        </AdminCard>
      </div>
    </>
  );
}

// ── Tab: Performance ──────────────────────────────────────────────────────────

function PerformanceTab({ data, onCleanup }) {
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  const perf = data.performance;

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch('/api/admin/analytics/cleanup', {
        method: 'POST',
        headers: adminHeaders(),
      });
      const result = await res.json();
      setCleanResult(result);
      if (onCleanup) onCleanup();
    } catch {
      setCleanResult({ error: 'Ошибка очистки' });
    } finally {
      setCleaning(false);
    }
  };

  if (!perf) return <p className="text-[12px] text-[#6b7280]">Нет данных о производительности</p>;

  const files = [
    { name: 'Просмотры страниц', ...perf.pageviews, unit: 'событий' },
    { name: 'Сессии', ...perf.sessions, unit: 'сессий', hideOld: true },
    { name: 'Клики и CTA', ...perf.clicks, unit: 'кликов' },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {files.map(f => {
          const pct = Math.round((f.count / f.max) * 100);
          const statusColor = pct > 80 ? 'text-red-400' : pct > 60 ? 'text-amber-400' : 'text-[#84CC16]';
          return (
            <AdminCard key={f.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-medium text-white">{f.name}</p>
                <span className={`text-[11px] font-mono ${statusColor}`}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-[#84CC16]'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <span className="text-[#6b7280]">Записей:</span>
                <span className="text-white tabular-nums text-right">{f.count.toLocaleString('ru')}</span>
                <span className="text-[#6b7280]">Макс.:</span>
                <span className="text-[#4b5563] tabular-nums text-right">{f.max.toLocaleString('ru')}</span>
                <span className="text-[#6b7280]">Размер:</span>
                <span className="text-[#4b5563] tabular-nums text-right">{f.sizeKb} КБ</span>
                {!f.hideOld && f.oldCount > 0 && (
                  <>
                    <span className="text-[#6b7280]">Старых (&gt;90д):</span>
                    <span className="text-amber-400 tabular-nums text-right">{f.oldCount}</span>
                  </>
                )}
              </div>
            </AdminCard>
          );
        })}
      </div>

      {perf.oldestEvent && (
        <p className="text-[11px] text-[#4b5563] mb-4">
          Самое старое событие: {new Date(perf.oldestEvent).toLocaleDateString('ru-RU')}
        </p>
      )}

      <AdminCard>
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-[14px] font-semibold text-white">Очистка старых данных</h3>
        </div>
        <p className="text-[12.5px] text-[#9ca3af] mb-4">
          Удалить события старше 90 дней из файлов просмотров и кликов. Сессии не затрагиваются.
        </p>

        {cleanResult && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-[12px] ${cleanResult.error ? 'bg-red-500/10 text-red-400' : 'bg-[#84CC16]/10 text-[#84CC16]'}`}>
            {cleanResult.error
              ? cleanResult.error
              : `Удалено: ${cleanResult.removedViews} просмотров, ${cleanResult.removedClicks} кликов`}
          </div>
        )}

        <button
          type="button"
          onClick={handleCleanup}
          disabled={cleaning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors text-[13px] font-medium disabled:opacity-50"
        >
          {cleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {cleaning ? 'Очистка…' : 'Удалить события старше 90 дней'}
        </button>
      </AdminCard>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [main, dem] = await Promise.all([fetchAnalytics(), fetchSearchDemand()]);
      setData(main);
      setDemand(dem);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader title="Аналитика сайта" description="Посещаемость, источники, конверсии." />
        <AdminCard><div className="h-40 animate-pulse bg-white/[0.03] rounded-xl" /></AdminCard>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Аналитика сайта" description="Посещаемость, источники, конверсии." />
        <AdminCard>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-400 text-[13px]">{error || 'Нет данных'}</p>
          </div>
          <button type="button" onClick={load} className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" />Повторить
          </button>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Аналитика сайта"
        description="Посещаемость, источники трафика, конверсии, поисковый спрос."
        actions={
          <button type="button" onClick={load} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-white/[0.1] text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors text-[13px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        }
      />

      <TabBar active={tab} onChange={setTab} />

      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'search' && <SearchTab demand={demand} />}
      {tab === 'devices' && <DevicesTab data={data} />}
      {tab === 'services' && <ServicesTab data={data} />}
      {tab === 'funnel' && <FunnelTab data={data} />}
      {tab === 'clicks' && <ClicksTab data={data} />}
      {tab === 'sources' && <SourcesTab data={data} />}
      {tab === 'stavropol' && <StavropolTab data={data} />}
      {tab === 'performance' && <PerformanceTab data={data} onCleanup={load} />}

      <p className="text-[11px] text-[#4b5563] mt-6">
        Данные за последние 30 дней (если не указано иное). Хранится до 10 000 просмотров, 5 000 кликов, 2 000 сессий.
        Публичные страницы сайта только (не /admin).
      </p>
    </>
  );
}
