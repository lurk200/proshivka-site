import { motion } from 'framer-motion'
import {
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
  Star,
} from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { isUsableMessengerUrl } from '../data/defaults.js'

export default function ContactsPage() {
  const { company } = useCms()
  const mapQuery = encodeURIComponent(`${company.city}, ${company.address}`)
  const mapUrl = `https://yandex.ru/maps/?text=${mapQuery}`
  const mapEmbed = `https://yandex.ru/map-widget/v1/?text=${mapQuery}&z=16`

  const channels = [
    isUsableMessengerUrl(company.whatsapp)
      ? {
          id: 'whatsapp',
          title: 'WhatsApp',
          hint: 'Быстрый ответ, можно с фото',
          href: company.whatsapp,
          external: true,
          icon: MessageCircle,
          tone: 'bg-[var(--color-accent)] text-white hover:brightness-110',
        }
      : null,
    isUsableMessengerUrl(company.telegram)
      ? {
          id: 'telegram',
          title: 'Telegram',
          hint: 'Напишите в мессенджер',
          href: company.telegram,
          external: true,
          icon: Send,
          tone: 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)]',
        }
      : null,
    {
      id: 'phone',
      title: 'Звонок',
      hint: company.phone,
      href: company.phoneHref,
      external: false,
      icon: Phone,
      tone: 'bg-white text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-accent)]/40',
    },
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-4 sm:px-6 sm:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="mb-6 sm:mb-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Контакты
          </p>
          <h1 className="font-display mt-1 text-[clamp(1.75rem,4vw,2.6rem)] font-extrabold tracking-tight text-[var(--color-ink)]">
            Как с нами связаться
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]">
            Напишите или позвоните — подскажем по ремонту. Можно сразу прислать фото
            устройства. Или приезжайте к нам в {company.city}.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink-soft)] shadow-card">
            <Star className="h-3.5 w-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
            {company.rating} · {company.reviewsCount} отзывов · {company.schedule}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {channels.map((channel, i) => {
            const Icon = channel.icon
            return (
              <motion.a
                key={channel.id}
                href={channel.href}
                target={channel.external ? '_blank' : undefined}
                rel={channel.external ? 'noreferrer' : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                className={`flex items-center gap-3 rounded-[22px] px-4 py-4 shadow-card transition active:scale-[0.98] ${channel.tone}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[16px] font-bold">{channel.title}</span>
                  <span className="mt-0.5 block truncate text-[12px] opacity-80">{channel.hint}</span>
                </span>
              </motion.a>
            )
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-5">
          <div className="rounded-[28px] border border-[var(--color-line)] bg-white p-6 shadow-card sm:p-7">
            <h2 className="font-display text-[1.25rem] font-bold tracking-tight text-[var(--color-ink)]">
              Адрес и режим
            </h2>
            <ul className="mt-5 space-y-4 text-[14px] text-[var(--color-ink-soft)] sm:text-[15px]">
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <MapPin className="h-4 w-4" strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Адрес
                  </span>
                  <span className="mt-0.5 block font-semibold text-[var(--color-ink)]">
                    {company.city}, {company.address}
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Clock className="h-4 w-4" strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Режим работы
                  </span>
                  <span className="mt-0.5 block font-semibold text-[var(--color-ink)]">
                    {company.schedule}
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Phone className="h-4 w-4" strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    Телефон
                  </span>
                  <a
                    href={company.phoneHref}
                    className="mt-0.5 block font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                  >
                    {company.phone}
                  </a>
                </span>
              </li>
            </ul>

            <div className="mt-6 rounded-2xl bg-[var(--color-canvas)] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-ink)]">Как удобнее</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-muted)]">
                Напишите в WhatsApp или Telegram — ответим быстрее, чем по звонку в пиковые часы.
                Если устройство уже с собой — просто приезжайте, диагностика на месте.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-white shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-4">
              <div>
                <p className="font-display text-[16px] font-bold text-[var(--color-ink)]">На карте</p>
                <p className="text-[12px] text-[var(--color-muted)]">
                  {company.city}, {company.address}
                </p>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[var(--color-ink-soft)]"
              >
                <Navigation className="h-3.5 w-3.5 text-[var(--color-accent-bright)]" />
                Открыть
              </a>
            </div>
            <div className="relative aspect-[16/11] bg-[var(--color-canvas)] sm:aspect-[16/10]">
              <iframe
                title={`Карта: ${company.name}`}
                src={mapEmbed}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
