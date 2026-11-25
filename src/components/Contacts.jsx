import { Link } from 'react-router-dom'
import { ArrowRight, Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { isUsableMessengerUrl } from '../data/defaults.js'

/** Компактный блок контактов на главной → ведёт на /contacts */
export default function Contacts() {
  const { company } = useCms()

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      aria-labelledby="home-contacts-heading"
    >
      <div className="overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-white shadow-card">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Контакты
            </p>
            <h2
              id="home-contacts-heading"
              className="font-display mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--color-ink)] sm:text-[1.75rem]"
            >
              Приезжайте или напишите
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)] sm:text-[15px]">
              Подскажем по ремонту за минуту. Можно сразу с фото устройства.
            </p>

            <ul className="mt-6 space-y-3 text-[14px] text-[var(--color-ink-soft)]">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <span>
                  {company.city}, {company.address}
                </span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <span>{company.schedule}</span>
              </li>
              <li>
                <a
                  href={company.phoneHref}
                  className="inline-flex items-center gap-3 font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                >
                  <Phone className="h-4 w-4 text-[var(--color-accent)]" />
                  {company.phone}
                </a>
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {isUsableMessengerUrl(company.whatsapp) ? (
                <a
                  href={company.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-[14px] font-bold text-white hover:brightness-110"
                >
                  <MessageCircle className="h-4 w-4" />
                  Написать
                </a>
              ) : null}
              <Link
                to="/contacts"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-5 py-3 text-[14px] font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]/40"
              >
                Все контакты
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative min-h-[200px] bg-[linear-gradient(145deg,#dbe7f5,#e8f6d0)] lg:min-h-full">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.18)_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative flex h-full flex-col justify-center gap-3 p-6 sm:p-8">
              <div className="rounded-2xl bg-white/90 p-4 shadow-card backdrop-blur">
                <p className="font-display text-[18px] font-bold text-[var(--color-ink)]">
                  {company.name}
                </p>
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">{company.tagline}</p>
                <p className="mt-3 text-[14px] font-semibold text-[var(--color-ink-soft)]">
                  {company.address}
                </p>
              </div>
              <Link
                to="/contacts"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--color-ink-soft)]"
              >
                Карта и мессенджеры
                <ArrowRight className="h-4 w-4 text-[var(--color-accent-bright)]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
