import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Calculator,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ExternalLink,
  HardDrive,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { logoutAdmin } from '../api/cmsApi.js'
import '../crm/crm-theme.css'

const SIDEBAR_KEY = 'admin-sidebar-collapsed'

const contentLinks = [
  { to: '/admin', end: true, label: 'Обзор', icon: LayoutDashboard },
  { to: '/admin/works', label: 'Работы', icon: Images },
  { to: '/admin/services', label: 'Услуги', icon: Wrench },
  { to: '/admin/calculator', label: 'Калькулятор', icon: Calculator },
  { to: '/admin/hero', label: 'Главная', icon: Sparkles },
  { to: '/admin/company', label: 'Контакты', icon: Building2 },
  { to: '/admin/backup', label: 'Резервная копия', icon: HardDrive },
]

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const current = contentLinks.find((l) =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to),
  )

  function logout() {
    logoutAdmin()
    navigate('/admin/login')
  }

  return (
    <div className={`crm-app min-h-dvh ${collapsed ? 'is-sidebar-collapsed' : ''}`}>
      <div className="flex min-h-dvh w-full">
        <aside
          className="sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-[var(--crm-border)] bg-[var(--crm-surface)] xl:flex"
          style={{ width: 'var(--crm-sidebar-w)' }}
        >
          <div className={`flex items-center gap-2 px-3 pt-4 ${collapsed ? 'justify-center' : 'px-4'}`}>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-extrabold tracking-tight text-[var(--crm-text)]">
                  <span style={{ color: 'var(--crm-brand)' }}>ПРО</span>ШИВКА
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--crm-text-faint)]">
                  Редактор сайта
                </p>
              </div>
            ) : (
              <p className="font-display text-[14px] font-extrabold" style={{ color: 'var(--crm-brand)' }}>
                П
              </p>
            )}
            <button
              type="button"
              className="crm-btn-ghost !p-1.5"
              title={collapsed ? 'Развернуть' : 'Свернуть'}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col px-2">
            {!collapsed ? <p className="crm-nav-label">Контент сайта</p> : null}
            <nav className="space-y-0.5">
              {contentLinks.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `crm-nav-item ${isActive ? 'is-active' : ''} ${collapsed ? '!justify-center !px-2' : ''}`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span className="truncate">{label}</span> : null}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6">
              {!collapsed ? <p className="crm-nav-label">Рабочие экраны</p> : null}
              <div className="space-y-0.5">
                <a
                  href="/crm"
                  title={collapsed ? 'CRM заказы' : undefined}
                  className={`crm-nav-item ${collapsed ? '!justify-center !px-2' : ''}`}
                >
                  <ClipboardList className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span>CRM заказы</span> : null}
                </a>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  title={collapsed ? 'Сайт' : undefined}
                  className={`crm-nav-item ${collapsed ? '!justify-center !px-2' : ''}`}
                >
                  <ExternalLink className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span>Открыть сайт</span> : null}
                </a>
              </div>
            </div>

            <div className="mt-auto pb-3 pt-4">
              {!collapsed ? (
                <div className="crm-staff mb-2">
                  <span className="crm-staff-dot" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--crm-text)]">Редактор</p>
                    <p className="text-[11px] text-[var(--crm-text-muted)]">Смена открыта</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-md p-1.5 text-[var(--crm-text-faint)] hover:bg-[var(--crm-danger-bg)] hover:text-[var(--crm-danger-text)]"
                    title="Выйти"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={logout}
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--crm-radius-md)] text-[var(--crm-text-faint)] hover:bg-[var(--crm-danger-bg)] hover:text-[var(--crm-danger-text)]"
                  title="Выйти"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[var(--crm-border)] bg-[color-mix(in_srgb,var(--crm-bg)_92%,transparent)] px-3 py-2.5 backdrop-blur xl:hidden">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[13px] font-bold leading-tight text-[var(--crm-text)]">
                  <span style={{ color: 'var(--crm-brand)' }}>ПРО</span>ШИВКА
                </p>
                <p className="truncate text-[11px] font-semibold text-[var(--crm-text-muted)]">
                  {current?.label || 'Редактор'}
                </p>
              </div>
              <a
                href="/crm"
                className="inline-flex h-10 items-center rounded-[var(--crm-radius-md)] bg-[var(--crm-surface)] px-3 text-[12px] font-bold text-[var(--crm-text-secondary)] shadow-sm"
              >
                CRM
              </a>
              <button
                type="button"
                aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--crm-radius-md)] bg-[var(--crm-surface)] text-[var(--crm-text)] shadow-sm"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {menuOpen ? (
            <div className="fixed inset-0 z-40 xl:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/40"
                aria-label="Закрыть"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-[var(--crm-surface)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--crm-border)] px-4 py-3">
                  <div>
                    <p className="font-display text-[15px] font-extrabold">
                      <span style={{ color: 'var(--crm-brand)' }}>ПРО</span>ШИВКА
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--crm-text-faint)]">
                      Редактор сайта
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg p-2 text-[var(--crm-text-faint)] hover:bg-[var(--crm-hover)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                  {contentLinks.map(({ to, end, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `crm-nav-item !py-3.5 !text-[15px] ${isActive ? 'is-active' : ''}`
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {label}
                    </NavLink>
                  ))}
                </nav>
                <div className="space-y-1 border-t border-[var(--crm-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <a href="/crm" className="crm-nav-item !py-3">
                    <ClipboardList className="h-5 w-5" />
                    CRM заказы
                  </a>
                  <a href="/" target="_blank" rel="noreferrer" className="crm-nav-item !py-3">
                    <ExternalLink className="h-5 w-5" />
                    Открыть сайт
                  </a>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-[var(--crm-radius-md)] px-3 py-3 text-left text-[14px] font-semibold text-[var(--crm-danger-text)]"
                  >
                    <LogOut className="h-5 w-5" />
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <main className="mx-auto max-w-[1440px] px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
