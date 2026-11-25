import { Link } from 'react-router-dom'
import { useCms } from '../context/CmsContext.jsx'

export default function Footer() {
  const { company } = useCms()

  return (
    <footer className="border-t border-[var(--color-line)] bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-[1.05rem] font-extrabold tracking-tight">
            <span className="text-[var(--color-accent)]">ПРО</span>ШИВКА
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            {company.city} · {company.schedule}
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-[13px] font-semibold text-[var(--color-ink-soft)]">
          <Link to="/" className="hover:text-[var(--color-accent)]">
            Главная
          </Link>
          <Link to="/services" className="hover:text-[var(--color-accent)]">
            Услуги
          </Link>
          <Link to="/works" className="hover:text-[var(--color-accent)]">
            Работы
          </Link>
          <Link to="/contacts" className="hover:text-[var(--color-accent)]">
            Контакты
          </Link>
          <a href={company.phoneHref} className="hover:text-[var(--color-accent)]">
            {company.phone}
          </a>
        </nav>
      </div>
    </footer>
  )
}
