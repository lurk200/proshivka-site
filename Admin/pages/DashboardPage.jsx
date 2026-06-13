import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, Calculator, ClipboardList, Clock, FileText,
  FolderOpen, Globe, Image, Layers, Lightbulb, Megaphone, Navigation,
  Scale, Send, Sparkles, Terminal, Wrench, LayoutTemplate, RefreshCw,
  MapPin, TrendingUp, Package, Activity, BarChart2, Star,
} from 'lucide-react';
import { useCms } from '../../src/context/CmsContext';
import { PAGE_KEYS } from '../../src/data/cmsStore';
import { PageHeader, AdminCard, StatCard, Badge } from '../components/ui';
import CmsBackupPanel from '../components/CmsBackupPanel';
import { useChangeHistory } from '../hooks/useChangeHistory';
import { fetchOrdersAdmin } from '../../src/api/ordersApi';

function adminHeaders() {
  return { 'X-Admin-Password': sessionStorage.getItem('proshivka-admin-api-key') || '' };
}

// ─── Quick Links ──────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { to: '/admin/analytics', label: 'Аналитика сайта', icon: BarChart2, group: 'Статистика' },
  { to: '/admin/seo', label: 'SEO', icon: Globe, group: 'Продвижение' },
  { to: '/admin/company', label: 'Компания', icon: Building2, group: 'Контент' },
  { to: '/admin/main/banners', label: 'Баннеры главной', icon: Image, group: 'Главная' },
  { to: '/admin/main/about', label: 'О нас и карта', icon: MapPin, group: 'Главная' },
  { to: '/admin/orders', label: 'Заказы', icon: ClipboardList, group: 'Сайт' },
  { to: '/admin/send-repair', label: 'Отправить в ремонт', icon: Send, group: 'Сайт' },
  { to: '/admin/repair-price', label: 'Калькулятор цен', icon: Calculator, group: 'Сайт' },
  { to: '/admin/works', label: 'Наши работы', icon: Layers, group: 'Сайт' },
  { to: '/admin/software-repair/hero', label: 'Hero прог. ремонта', icon: Sparkles, group: 'Прог. ремонт' },
  { to: '/admin/software-repair/services', label: 'Услуги', icon: Wrench, group: 'Прог. ремонт' },
  { to: '/admin/software-repair/cases', label: 'Кейсы', icon: FolderOpen, group: 'Прог. ремонт' },
  { to: '/admin/software-repair/cta', label: 'CTA', icon: Megaphone, group: 'Прог. ремонт' },
  { to: '/admin/service-pages', label: 'Аппаратные услуги', icon: FileText, group: 'Сайт' },
  { to: '/admin/navigation', label: 'Меню и футер', icon: Navigation, group: 'Сайт' },
  { to: '/admin/legal', label: 'Документы', icon: Scale, group: 'Сайт' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatRelative(isoStr) {
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} дн. назад`;
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(isoStr));
  } catch {
    return '';
  }
}

function StatusDot({ status }) {
  const colors = {
    accepted: 'bg-blue-400',
    diagnostics: 'bg-violet-400',
    in_progress: 'bg-amber-400',
    waiting_parts: 'bg-orange-400',
    ready: 'bg-[#84CC16]',
    completed: 'bg-[#6b7280]',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status] ?? 'bg-[#6b7280]'}`} />
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { content } = useCms();
  const { getHistory } = useChangeHistory();

  const [activeOrders, setActiveOrders] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [analyticsSnap, setAnalyticsSnap] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);

  const softwarePage = content[PAGE_KEYS.SOFTWARE_REPAIR] ?? {};
  const servicesCount = softwarePage.services?.featured?.length ?? 0;
  const casesCount = softwarePage.portfolio?.length ?? 0;
  const worksCount = content.works?.items?.filter(w => w.published !== false).length ?? 0;
  const seoCount = Object.keys(content.siteSeo?.pages ?? {}).length;
  const bannersCount = content.mainHome?.banners?.length ?? 0;
  const siteUrl = content.siteSeo?.global?.siteUrl;

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchOrdersAdmin();
      const orders = data.orders ?? [];
      const active = orders.filter(o => o.status !== 'completed');
      setActiveOrders(active.length);
      setRecentOrders(active.slice(0, 5));
    } catch {
      setActiveOrders(null);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    setHistory(getHistory(8));
    fetch('/api/admin/analytics', { headers: adminHeaders() })
      .then(r => r.json())
      .then(d => setAnalyticsSnap(d))
      .catch(() => {});
    fetch('/api/admin/reviews/stats', { headers: adminHeaders() })
      .then(r => r.json())
      .then(d => setReviewStats(d))
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        title="Обзор"
        description="Центр управления сайтом. Изменения CMS сохраняются в браузере и мгновенно отображаются на публичных страницах."
        actions={
          siteUrl ? (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px] hover:text-white hover:border-white/[0.2] transition-colors"
            >
              <Terminal className="w-4 h-4" />
              {siteUrl}
            </a>
          ) : null
        }
      />

      <CmsBackupPanel />

      {/* ── KPI Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={ClipboardList}
          label="Заказов в работе"
          value={ordersLoading ? '…' : (activeOrders ?? '—')}
          sub="Активные ремонты"
          accent={activeOrders > 0}
          onClick={() => {}}
        />
        <StatCard
          icon={Layers}
          label="Работ опубликовано"
          value={worksCount}
          sub="В портфолио"
        />
        <StatCard
          icon={Globe}
          label="Страниц SEO"
          value={seoCount}
          sub="С мета-тегами"
        />
        <StatCard
          icon={Image}
          label="Баннеров услуг"
          value={bannersCount}
          sub="На главной"
        />
      </div>

      {/* ── Analytics widget ─────────────────────────────────────── */}
      <AdminCard className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#84CC16]/15 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-[#84CC16]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Аналитика сайта</p>
              {analyticsSnap ? (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[12px] text-[#9ca3af]">
                    Сегодня: <span className="text-white font-medium">{analyticsSnap.todayViews ?? 0}</span> просм.
                  </span>
                  <span className="text-[12px] text-[#9ca3af]">
                    За месяц: <span className="text-white font-medium">{(analyticsSnap.monthViews ?? 0).toLocaleString('ru')}</span>
                  </span>
                  {(analyticsSnap.onlineNow ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-[12px] text-[#84CC16]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#84CC16] animate-ping opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84CC16]" />
                      </span>
                      {analyticsSnap.onlineNow} онлайн
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[#4b5563] mt-0.5">Загрузка статистики…</p>
              )}
            </div>
          </div>
          <Link
            to="/admin/analytics"
            className="flex items-center gap-1.5 text-[12px] text-[#84CC16] hover:underline shrink-0"
          >
            Открыть <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </AdminCard>

      {/* ── Reviews widget ───────────────────────────────────────── */}
      <AdminCard className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Отзывы клиентов</p>
              {reviewStats ? (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[12px] text-[#9ca3af]">
                    Всего: <span className="text-white font-medium">{reviewStats.total}</span>
                  </span>
                  {reviewStats.total > 0 && (
                    <span className="text-[12px] text-[#9ca3af]">
                      Средняя: <span className="text-amber-400 font-medium">{reviewStats.average} ★</span>
                    </span>
                  )}
                  {reviewStats.problematic > 0 && (
                    <span className="text-[12px] text-red-400 font-medium">
                      {reviewStats.problematic} проблемных
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[#4b5563] mt-0.5">Загрузка…</p>
              )}
            </div>
          </div>
          <Link
            to="/admin/reviews"
            className="flex items-center gap-1.5 text-[12px] text-[#84CC16] hover:underline shrink-0"
          >
            Открыть <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </AdminCard>

      {/* ── Secondary Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#14161a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
          <Wrench className="w-4 h-4 text-[#6b7280] shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-[18px] font-bold text-white leading-none">{servicesCount}</p>
            <p className="text-[11px] text-[#6b7280] mt-0.5">Услуг прог. ремонта</p>
          </div>
        </div>
        <div className="bg-[#14161a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
          <FolderOpen className="w-4 h-4 text-[#6b7280] shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-[18px] font-bold text-white leading-none">{casesCount}</p>
            <p className="text-[11px] text-[#6b7280] mt-0.5">Кейсов</p>
          </div>
        </div>
        <div className="bg-[#14161a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
          <Activity className="w-4 h-4 text-[#6b7280] shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-[18px] font-bold text-white leading-none">{history.length}</p>
            <p className="text-[11px] text-[#6b7280] mt-0.5">Изменений CMS</p>
          </div>
        </div>
      </div>

      {/* ── Bottom row: Active orders + Change history ─────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Active orders */}
        <AdminCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#84CC16]" strokeWidth={1.75} />
              Активные заказы
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadOrders}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Обновить"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                to="/admin/orders"
                className="text-[12px] text-[#84CC16] hover:underline flex items-center gap-1"
              >
                Все заказы <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {recentOrders.length > 0 ? (
            <ul className="space-y-2">
              {recentOrders.map(o => (
                <li key={o.id}>
                  <Link
                    to="/admin/orders"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04] transition-colors"
                  >
                    <StatusDot status={o.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-mono font-semibold text-white">{o.orderNumber}</p>
                      <p className="text-[11px] text-[#6b7280] truncate">{o.device}</p>
                    </div>
                    {o.clientName && (
                      <p className="text-[11px] text-[#6b7280] truncate max-w-[100px]">{o.clientName}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Package className="w-8 h-8 text-[#4b5563] mb-2" />
              <p className="text-[14px] text-[#6b7280]">
                {ordersLoading ? 'Загрузка…' : 'Нет активных заказов'}
              </p>
              {!ordersLoading && (
                <Link to="/admin/orders" className="mt-3 text-[12px] text-[#84CC16] hover:underline">
                  Создать заказ
                </Link>
              )}
            </div>
          )}
        </AdminCard>

        {/* Change history */}
        <AdminCard className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#84CC16]" strokeWidth={1.75} />
              История изменений CMS
            </h2>
          </div>

          {history.length > 0 ? (
            <ul className="space-y-1.5">
              {history.map(entry => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#84CC16] shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white truncate">{entry.label}</p>
                  </div>
                  <p className="text-[11px] text-[#4b5563] shrink-0">{formatRelative(entry.at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-8 h-8 text-[#4b5563] mb-2" />
              <p className="text-[14px] text-[#6b7280]">История появится после первого сохранения</p>
              <p className="text-[12px] text-[#4b5563] mt-1">
                Каждое сохранение раздела записывается здесь
              </p>
            </div>
          )}
        </AdminCard>
      </div>

      {/* ── Quick Links ───────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#4b5563]">Быстрый переход</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {QUICK_LINKS.map(({ to, label, icon: Icon, group }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#14161a] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 group-hover:bg-[#84CC16]/10 transition-colors">
              <Icon className="w-4 h-4 text-[#6b7280] group-hover:text-[#84CC16] transition-colors" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <span className="text-[13.5px] text-white block truncate leading-tight">{label}</span>
              <span className="text-[10px] font-mono text-[#4b5563] uppercase">{group}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#2d3139] ml-auto shrink-0 group-hover:text-[#84CC16] transition-colors" />
          </Link>
        ))}
      </div>
    </>
  );
}
