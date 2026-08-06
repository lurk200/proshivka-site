import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Calculator,
  ChevronDown,
  ExternalLink,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ADMIN_NAVIGATION } from '../navigation';

const PREVIEW_LINKS = [
  { href: '/', label: 'Главная сайта', icon: ExternalLink },
  { href: '/programmnyj-remont', label: 'Программный ремонт', icon: Terminal },
  { href: '/prise', label: 'Прайс и услуги', icon: Calculator },
];

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

function NavGroup({ title, items, collapsed, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <div className="mb-1">
        <div className="mx-3 my-2 border-t border-white/[0.05]" />
        <div className="flex flex-col items-center gap-0.5">
          {items.map(({ path, label, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end} className={iconLinkClass} title={label}>
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
        onClick={() => setOpen(value => !value)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#4b5563] hover:text-[#6b7280] transition-colors"
      >
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} strokeWidth={2.5} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map(({ path, label, icon: Icon, badge, end }) => (
            <NavLink key={path} to={path} end={end} className={navLinkClass}>
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1 min-w-0 truncate">{label}</span>
              {badge != null && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#84CC16]/15 text-[#84CC16] font-semibold font-mono">{badge}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ collapsed, onCollapse, onClose }) {
  const { logout } = useAdminAuth();
  const overview = ADMIN_NAVIGATION[0].items;

  return (
    <>
      <div className={`h-14 flex items-center shrink-0 border-b border-white/[0.06] px-3 gap-2 ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? (
          <Link to="/admin" title="Обзор">
            <div className="w-8 h-8 rounded-lg bg-[#84CC16] flex items-center justify-center"><Zap className="w-4 h-4 text-[#0a0b0e]" strokeWidth={2.5} /></div>
          </Link>
        ) : (
          <>
            <Link to="/admin" className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#84CC16] flex items-center justify-center shrink-0"><Zap className="w-3.5 h-3.5 text-[#0a0b0e]" strokeWidth={2.5} /></div>
              <div className="min-w-0"><p className="text-[13.5px] font-bold text-white leading-tight tracking-tight">ПРОШИВКА</p><p className="text-[9px] font-mono text-[#4b5563] uppercase tracking-[0.12em]">Админ-панель</p></div>
            </Link>
            {onCollapse && <button type="button" onClick={onCollapse} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0" title="Свернуть меню"><PanelLeftClose className="w-4 h-4" /></button>}
            {onClose && <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0" aria-label="Закрыть меню"><X className="w-4 h-4" /></button>}
          </>
        )}
      </div>

      {collapsed && onCollapse && <div className="flex justify-center py-2 border-b border-white/[0.06]"><button type="button" onClick={onCollapse} className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors" title="Развернуть меню"><PanelLeft className="w-4 h-4" /></button></div>}

      <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Разделы админ-панели">
        <div className="space-y-0.5 mb-1">
          {overview.map(({ path, label, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end} className={collapsed ? iconLinkClass : navLinkClass} title={collapsed ? label : undefined}>
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>
        {ADMIN_NAVIGATION.slice(1).map(group => <NavGroup key={group.id} title={group.title} items={group.items} collapsed={collapsed} defaultOpen={group.defaultOpen ?? false} />)}
      </nav>

      <div className="border-t border-white/[0.06] py-2 px-2 shrink-0">
        {!collapsed && <div className="mb-1 space-y-0.5">{PREVIEW_LINKS.map(({ href, label, icon: Icon }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.03] transition-colors"><Icon className="w-3.5 h-3.5 shrink-0" /><span className="flex-1 truncate">{label}</span><ExternalLink className="w-3 h-3 opacity-50" /></a>)}</div>}
        <button type="button" onClick={logout} title={collapsed ? 'Выйти' : undefined} className={`w-full flex items-center px-3 py-2.5 rounded-xl text-[13.5px] text-[#9ca3af] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors ${collapsed ? 'justify-center' : 'gap-3'}`}><LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />{!collapsed && 'Выйти'}</button>
      </div>
    </>
  );
}

export default function Sidebar({ open, collapsed, onCollapse, onClose }) {
  return (
    <>
      <aside className={`fixed top-0 left-0 z-40 h-screen hidden lg:flex flex-col bg-[#0c0d10] border-r border-white/[0.06] transition-[width] duration-300 ease-in-out overflow-hidden ${collapsed ? 'w-[64px]' : 'w-[260px]'}`}><SidebarContent collapsed={collapsed} onCollapse={onCollapse} /></aside>
      <aside className={`fixed top-0 left-0 z-40 h-screen w-[260px] flex flex-col lg:hidden bg-[#0c0d10] border-r border-white/[0.06] transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}><SidebarContent collapsed={false} onClose={onClose} /></aside>
    </>
  );
}
