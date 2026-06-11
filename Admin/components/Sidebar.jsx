import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Sparkles, Wrench, FolderOpen, Lightbulb,
  LogOut, ExternalLink, Megaphone, Terminal, Image, MapPin, Layers, Scale,
  FileText, Navigation, LayoutTemplate, Globe, Calculator, ClipboardList,
  Send, ChevronDown, PanelLeftClose, PanelLeft, X, Zap, Bell, BarChart2,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

// ─── Nav data ──────────────────────────────────────────────────────────────

const GENERAL_NAV = [
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Аналитика сайта', icon: BarChart2 },
  { to: '/admin/company', label: 'Компания', icon: Building2 },
];

const PROMO_NAV = [
  { to: '/admin/seo', label: 'SEO и продвижение', icon: Globe },
];

const HOME_NAV = [
  { to: '/admin/main/banners', label: 'Баннеры услуг', icon: Image },
  { to: '/admin/main/about', label: 'О нас и карта', icon: MapPin },
];

const SOFTWARE_NAV = [
  { to: '/admin/software-repair/hero', label: 'Hero', icon: Sparkles },
  { to: '/admin/software-repair/sections', label: 'Заголовки секций', icon: LayoutTemplate },
  { to: '/admin/software-repair/services', label: 'Услуги', icon: Wrench },
  { to: '/admin/software-repair/cases', label: 'Кейсы', icon: FolderOpen },
  { to: '/admin/software-repair/principles', label: 'О лаборатории', icon: Lightbulb },
  { to: '/admin/software-repair/cta', label: 'Блок CTA', icon: Megaphone },
];

const SITE_NAV = [
  { to: '/admin/send-repair', label: 'Отправить в ремонт', icon: Send },
  { to: '/admin/orders', label: 'Заказы', icon: ClipboardList },
  { to: '/admin/repair-price', label: 'Калькулятор цен', icon: Calculator },
  { to: '/admin/works', label: 'Наши работы', icon: Layers },
  { to: '/admin/service-pages', label: 'Аппаратные услуги', icon: FileText },
  { to: '/admin/service-template', label: 'Шаблон услуги', icon: LayoutTemplate },
  { to: '/admin/navigation', label: 'Меню и футер', icon: Navigation },
  { to: '/admin/legal', label: 'Документы', icon: Scale },
];

const SETTINGS_NAV = [
  { to: '/admin/settings/notifications', label: 'Уведомления', icon: Bell },
];

const PREVIEW_LINKS = [
  { href: '/', label: 'Главная сайта', icon: ExternalLink },
  { href: '/programmnyj-remont', label: 'Прог. ремонт', icon: Terminal },
  { href: '/prise', label: 'Калькулятор', icon: Calculator },
];

// ─── Styles ────────────────────────────────────────────────────────────────

const activeCls = 'bg-[#84CC16]/10 text-[#84CC16] border-[#84CC16]/20';
const idleCls = 'text-[#9ca3af] hover:text-white hover:bg-white/[0.04] border-transparent';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium border transition-colors ${
    isActive ? activeCls : idleCls
  }`;

const iconLinkClass = ({ isActive }) =>
  `flex items-center justify-center w-10 h-10 mx-auto rounded-xl border transition-colors ${
    isActive ? activeCls : idleCls
  }`;

// ─── NavGroup ─────────────────────────────────────────────────────────────

function NavGroup({ title, items, collapsed, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <div className="mb-1">
        <div className="mx-3 my-2 border-t border-white/[0.05]" />
        <div className="flex flex-col items-center gap-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={iconLinkClass} title={label}>
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#4b5563] hover:text-[#6b7280] transition-colors"
      >
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          strokeWidth={2.5}
        />
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1 min-w-0 truncate">{label}</span>
              {badge != null && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#84CC16]/15 text-[#84CC16] font-semibold font-mono">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────

function SidebarContent({ collapsed, onCollapse, onClose }) {
  const { logout } = useAdminAuth();

  return (
    <>
      {/* Header */}
      <div
        className={`h-14 flex items-center shrink-0 border-b border-white/[0.06] px-3 gap-2 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {collapsed ? (
          <Link to="/admin" title="Обзор">
            <div className="w-8 h-8 rounded-lg bg-[#84CC16] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0a0b0e]" strokeWidth={2.5} />
            </div>
          </Link>
        ) : (
          <>
            <Link to="/admin" className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#84CC16] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-[#0a0b0e]" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-white leading-tight tracking-tight">ПРОШИВКА</p>
                <p className="text-[9px] font-mono text-[#4b5563] uppercase tracking-[0.12em]">Admin Panel</p>
              </div>
            </Link>
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                title="Свернуть сайдбар"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Expand button in collapsed mode */}
      {collapsed && onCollapse && (
        <div className="flex justify-center py-2 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Развернуть сайдбар"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {/* General items (always visible) */}
        <div className="space-y-0.5 mb-1">
          {GENERAL_NAV.map(({ to, label, icon: Icon }) =>
            collapsed ? (
              <NavLink key={to} to={to} end className={iconLinkClass} title={label}>
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </NavLink>
            ) : (
              <NavLink key={to} to={to} end className={navLinkClass}>
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {label}
              </NavLink>
            )
          )}
        </div>

        <NavGroup title="Продвижение" items={PROMO_NAV} collapsed={collapsed} />
        <NavGroup title="Главная /" items={HOME_NAV} collapsed={collapsed} />
        <NavGroup title="Прог. ремонт" items={SOFTWARE_NAV} collapsed={collapsed} defaultOpen={false} />
        <NavGroup title="Сайт" items={SITE_NAV} collapsed={collapsed} />
        <NavGroup title="Настройки" items={SETTINGS_NAV} collapsed={collapsed} defaultOpen={false} />
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] py-2 px-2 shrink-0">
        {!collapsed && (
          <div className="mb-1 space-y-0.5">
            {PREVIEW_LINKS.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.03] transition-colors"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Выйти' : undefined}
          className={`w-full flex items-center px-3 py-2.5 rounded-xl text-[13.5px] text-[#9ca3af] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          {!collapsed && 'Выйти'}
        </button>
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar({ open, collapsed, onCollapse, onClose }) {
  return (
    <>
      {/* Desktop sidebar — always in DOM, width transitions */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          hidden lg:flex flex-col
          bg-[#0c0d10] border-r border-white/[0.06]
          transition-[width] duration-300 ease-in-out overflow-hidden
          ${collapsed ? 'w-[64px]' : 'w-[260px]'}
        `}
      >
        <SidebarContent collapsed={collapsed} onCollapse={onCollapse} />
      </aside>

      {/* Mobile sidebar — slide in from left */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-[260px]
          flex flex-col lg:hidden
          bg-[#0c0d10] border-r border-white/[0.06]
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent collapsed={false} onClose={onClose} />
      </aside>
    </>
  );
}
