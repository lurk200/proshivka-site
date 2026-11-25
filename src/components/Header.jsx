import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Phone, X } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'

const NAV = [
  { to: '/', label: 'Главная', end: true },
  { to: '/services', label: 'Услуги', mobileLabel: 'Услуги' },
  { to: '/calc', label: 'Расчёт', mobileLabel: 'Расчёт стоимости' },
  { to: '/works', label: 'Работы', mobileLabel: 'Примеры работ' },
  { to: '/contacts', label: 'Контакты', mobileLabel: 'Контакты' },
]

function navActive(pathname, to, end) {
  if (end || to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function desktopNavClass(active) {
  return `rounded-xl px-3.5 py-1.5 text-[13px] transition ${
    active
      ? 'bg-[#ECFCCB] font-semibold text-[#365314]'
      : 'font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
  }`
}

function mobileNavClass(active) {
  return `block rounded-xl px-3.5 py-2.5 text-sm transition ${
    active
      ? 'bg-[#ECFCCB] font-semibold text-[#365314]'
      : 'font-medium text-slate-700 hover:bg-slate-50'
  }`
}

export default function Header() {
  const { company } = useCms()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const statusActive = pathname === '/status-zakaza' || pathname.startsWith('/status-zakaza')

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const brand = company.name || 'ПРОШИВКА'
  const tagline = company.tagline || 'Ремонт смартфонов и электроники'
  const phone = company.phone || '+7 (988) 087-43-12'
  const phoneHref = company.phoneHref || 'tel:+79880874312'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="min-w-0 shrink-0" aria-label={brand}>
          <div className="font-display text-base leading-none font-extrabold tracking-tight sm:text-[1.15rem]">
            <span className="text-[#52A800]">ПРО</span>
            <span className="text-slate-900">ШИВКА</span>
          </div>
          <div className="mt-1 hidden text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:block">
            {tagline}
          </div>
        </Link>

        <div className="flex items-center gap-2 lg:gap-4">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Меню">
            {NAV.map((item) => {
              const active = navActive(pathname, item.to, item.end)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={desktopNavClass(active)}
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="hidden h-5 w-px bg-slate-200 md:block" />

          <Link
            to="/status-zakaza"
            className={`hidden items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition sm:inline-flex ${
              statusActive
                ? 'border-[#A3E635] bg-[#ECFCCB] text-[#365314]'
                : 'border-slate-200/90 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#52A800]" />
            <span>Статус заказа</span>
          </Link>

          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white tabular-nums shadow-sm transition hover:bg-slate-800 sm:px-4"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-[#84CC16]" strokeWidth={2.2} />
            <span>{phone}</span>
          </a>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label={open ? 'Закрыть меню' : 'Меню'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="space-y-1.5 border-t border-slate-100 bg-white px-4 py-3 shadow-lg md:hidden">
          {NAV.map((item) => {
            const active = navActive(pathname, item.to, item.end)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavClass(active)}
                onClick={() => setOpen(false)}
              >
                {item.mobileLabel || item.label}
              </NavLink>
            )
          })}
          <div className="border-t border-slate-100 pt-2">
            <Link
              to="/status-zakaza"
              onClick={() => setOpen(false)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                statusActive
                  ? 'bg-[#ECFCCB] text-[#365314]'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200/70'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#52A800]" />
              <span>Проверить статус заказа</span>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
