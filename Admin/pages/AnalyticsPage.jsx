import React, { useEffect, useState } from 'react';
import {
  Activity, BarChart2, ExternalLink, Globe, MousePointer2,
  RefreshCw, TrendingUp, Users, Zap,
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

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <AdminCard className="py-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-[#84CC16]/15' : 'bg-white/[0.04]'}`}>
          <Icon className={`w-4 h-4 ${accent ? 'text-[#84CC16]' : 'text-[#6b7280]'}`} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className={`text-xl font-semibold leading-none ${accent ? 'text-[#84CC16]' : 'text-white'}`}>{value}</p>
          <p className="text-[11px] text-[#6b7280] mt-1 truncate">{label}</p>
          {sub && <p className="text-[10px] text-[#4b5563] truncate">{sub}</p>}
        </div>
      </div>
    </AdminCard>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

function MiniBarChart({ data, height = 48 }) {
  if (!data?.length) return <p className="text-[12px] text-[#6b7280]">Нет данных</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
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

// ── Ranked list ───────────────────────────────────────────────────────────────

function RankedList({ items, keyProp, countProp, label }) {
  if (!items?.length) return <p className="text-[12px] text-[#6b7280]">Нет данных</p>;
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
        </div>
      ))}
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────

const FUNNEL_LABELS = {
  '/': 'Главная',
  '/prise': 'Калькулятор цен',
  '/otpravit-v-remont': 'Отправить в ремонт',
};

function FunnelChart({ funnel }) {
  if (!funnel?.length) return null;
  const max = funnel[0]?.count || 1;
  return (
    <div className="space-y-3">
      {funnel.map((step, i) => {
        const pct = max > 0 ? Math.round((step.count / max) * 100) : 0;
        const drop = i > 0 && funnel[i - 1]?.count > 0
          ? Math.round((1 - step.count / funnel[i - 1].count) * 100)
          : null;
        return (
          <div key={step.path}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12.5px] text-[#d1d5db]">
                <span className="text-[#4b5563] mr-1.5">{i + 1}.</span>
                {FUNNEL_LABELS[step.path] ?? step.path}
              </span>
              <div className="flex items-center gap-2">
                {drop !== null && (
                  <span className="text-[10px] text-red-400">−{drop}%</span>
                )}
                <span className="text-[12px] text-white tabular-nums">{step.count.toLocaleString('ru')}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full bg-[#84CC16]" style={{ width: `${pct}%`, opacity: 1 - i * 0.2 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Online pulse ──────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchAnalytics());
    } catch (e) {
      setError(e.message || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
          <p className="text-amber-400 text-[13px]">{error || 'Нет данных'}</p>
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
        description="Посещаемость, источники трафика, конверсии и популярный контент."
        actions={
          <button type="button" onClick={load} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-white/[0.1] text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors text-[13px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        }
      />

      {/* Online now */}
      <div className="mb-5">
        <OnlinePulse count={data.onlineNow ?? 0} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard icon={Globe} label="Просмотров всего" value={(data.totalPageviews ?? 0).toLocaleString('ru')} />
        <KpiCard icon={Users} label="Сессий всего" value={(data.totalSessions ?? 0).toLocaleString('ru')} />
        <KpiCard icon={Activity} label="Сегодня" value={(data.todayViews ?? 0).toLocaleString('ru')} accent />
        <KpiCard icon={TrendingUp} label="За неделю" value={(data.weekViews ?? 0).toLocaleString('ru')} />
        <KpiCard icon={BarChart2} label="За месяц" value={(data.monthViews ?? 0).toLocaleString('ru')} />
        <KpiCard icon={Zap} label="Онлайн сейчас" value={data.onlineNow ?? 0} accent={data.onlineNow > 0} />
      </div>

      {/* Daily chart */}
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

      {/* 2-col grid */}
      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        {/* Popular pages */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Популярные страницы</h3>
          </div>
          <RankedList items={data.popularPages} keyProp="path" countProp="count" />
        </AdminCard>

        {/* Funnel */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Воронка конверсии</h3>
            <span className="text-[10px] text-[#4b5563] ml-1">30 дней</span>
          </div>
          <FunnelChart funnel={data.funnel} />
        </AdminCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 mb-5">
        {/* Referrers */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Источники трафика</h3>
          </div>
          <RankedList items={data.topReferrers} keyProp="referrer" countProp="count" />
          {!data.topReferrers?.length && (
            <p className="text-[12px] text-[#6b7280]">Нет данных о переходах</p>
          )}
        </AdminCard>

        {/* UTM sources */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">UTM-источники</h3>
          </div>
          <RankedList items={data.utmSources} keyProp="source" countProp="count" />
          {!data.utmSources?.length && (
            <p className="text-[12px] text-[#6b7280]">Нет UTM-параметров</p>
          )}
        </AdminCard>

        {/* Top clicks */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <MousePointer2 className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-[14px] font-semibold text-white">Популярные клики</h3>
          </div>
          <RankedList items={data.topClicks} keyProp="target" countProp="count" />
          {!data.topClicks?.length && (
            <p className="text-[12px] text-[#6b7280]">Нет данных о кликах</p>
          )}
        </AdminCard>
      </div>

      <p className="text-[11px] text-[#4b5563] mt-2">
        Данные за последние 30 дней. Хранится до 10 000 просмотров и 2 000 сессий.
        Отслеживаются только публичные страницы сайта (не /admin).
      </p>
    </>
  );
}
