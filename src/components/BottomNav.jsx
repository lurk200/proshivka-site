import { NavLink } from 'react-router-dom'
import { Calculator, Home, Images, MapPin, Wrench } from 'lucide-react'

const item =
  'flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[9px] font-bold transition sm:text-[10px]'

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-line)] bg-white/90 px-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
      aria-label="Мобильная навигация"
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-0.5">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${item} ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`
          }
        >
          <Home className="h-5 w-5" strokeWidth={2} />
          Главная
        </NavLink>
        <NavLink
          to="/services"
          className={({ isActive }) =>
            `${item} ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`
          }
        >
          <Wrench className="h-5 w-5" strokeWidth={2} />
          Услуги
        </NavLink>
        <NavLink
          to="/calc"
          className={({ isActive }) =>
            `${item} ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`
          }
        >
          <Calculator className="h-5 w-5" strokeWidth={2} />
          Расчёт
        </NavLink>
        <NavLink
          to="/works"
          className={({ isActive }) =>
            `${item} ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`
          }
        >
          <Images className="h-5 w-5" strokeWidth={2} />
          Работы
        </NavLink>
        <NavLink
          to="/contacts"
          className={({ isActive }) =>
            `${item} ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`
          }
        >
          <MapPin className="h-5 w-5" strokeWidth={2} />
          Контакты
        </NavLink>
      </div>
    </nav>
  )
}
