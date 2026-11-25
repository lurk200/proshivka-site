import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
} from 'lucide-react'
import { logoutAdmin } from '../api/cmsApi.js'
import { CrmProvider, useCrm } from '../context/CrmContext.jsx'
import { getStatusMeta } from './defaults.js'
import './crm-theme.css'

const SIDEBAR_KEY = 'crm-sidebar-collapsed'

const workshopLinks = [
  { to: '/crm', end: true, label: 'Доска', icon: LayoutGrid, id: 'board' },
  { to: '/crm/new', label: 'Приёмка', icon: Plus, id: 'intake' },
  { to: '/crm/search', label: 'Поиск', icon: Search, id: 'search', hint: 'Ctrl K' },
]

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

function Shell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orders, data, ready } = useCrm()
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const activeCount = useMemo(() => {
    if (!ready) return 0
    return orders.filter((o) => !getStatusMeta(data, o.type, o.status)?.isTerminal).length
  }, [orders, data, ready])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      if (location.pathname === '/crm/search') {
        document.getElementById('crm-search-input')?.focus()
        document.getElementById('crm-search-input')?.select()
      } else {
        navigate('/crm/search', { state: { focusSearch: true } })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [location.pathname, navigate])

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
                  CRM
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
            {!collapsed ? <p className="crm-nav-label">Мастерская</p> : null}
            <nav className="space-y-0.5">
              {workshopLinks.map(({ to, end, label, icon: Icon, id, hint }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) => `crm-nav-item ${isActive ? 'is-active' : ''} ${collapsed ? '!justify-center !px-2' : ''}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? (
                    <>
                      <span className="truncate">{label}</span>
                      {id === 'board' && activeCount > 0 ? (
                        <span className="crm-nav-badge">{activeCount}</span>
                      ) : null}
                      {hint && id !== 'board' ? <span className="crm-nav-hint">{hint}</span> : null}
                    </>
                  ) : null}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6">
              {!collapsed ? <p className="crm-nav-label">Управление</p> : null}
              <div className="space-y-0.5">
                <a
                  href="/admin"
                  title={collapsed ? 'Контент сайта' : undefined}
                  className={`crm-nav-item ${collapsed ? '!justify-center !px-2' : ''}`}
                >
                  <ClipboardList className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span>Контент сайта</span> : null}
                </a>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  title={collapsed ? 'Сайт' : undefined}
                  className={`crm-nav-item ${collapsed ? '!justify-center !px-2' : ''}`}
                >
                  <ExternalLink className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span>Сайт</span> : null}
                </a>
              </div>
            </div>

            <div className="mt-auto pb-3 pt-4">
              {!collapsed ? (
                <div className="crm-staff mb-2">
                  <span className="crm-staff-dot" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--crm-text)]">Приёмщик</p>
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
          <header className="sticky top-0 z-20 border-b border-[var(--crm-border)] bg-[color-mix(in_srgb,var(--crm-bg)_92%,transparent)] px-3 py-2.5 backdrop-blur xl:hidden">
            <div className="flex items-center gap-2">
              <p className="font-display text-[13px] font-bold text-[var(--crm-text)]">
                <span style={{ color: 'var(--crm-brand)' }}>ПРО</span> CRM
              </p>
              <div className="ml-auto flex gap-1 overflow-x-auto">
                {workshopLinks.map(({ to, end, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isActive
                          ? 'bg-[var(--crm-brand)] text-white'
                          : 'bg-[var(--crm-surface)] text-[var(--crm-text-muted)]'
                      }`
                    }
                  >
                    {label}
                    {to === '/crm' && activeCount > 0 ? (
                      <span className="ml-1 opacity-80">{activeCount}</span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          </header>
          <main className="p-3 sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default function CrmLayout() {
  return (
    <CrmProvider>
      <Shell />
    </CrmProvider>
  )
}
