import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Shield,
} from 'lucide-react'
import ServicePriceTable from '../components/ServicePriceTable.jsx'
import { useCms } from '../context/CmsContext.jsx'
import { formatRub, serviceFromPrice } from '../utils/price.js'

function ServiceDetail({ service, company }) {
  const from = serviceFromPrice(service)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/services"
        className="mb-5 inline-flex items-center gap-2 text-[14px] font-bold text-[var(--color-accent)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все услуги
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[24px] bg-white shadow-card"
        >
          <div className="relative aspect-[4/5]">
            <img src={service.image} alt="" className="h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${service.tone} opacity-55`} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[12px] font-bold text-[var(--color-accent)]">
              Услуга
            </span>
            {service.timing ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[var(--color-muted)] shadow-card">
                <Clock className="h-3 w-3 text-[var(--color-accent)]" />
                {service.timing}
              </span>
            ) : null}
          </div>

          <h1 className="font-display mt-3 text-[clamp(1.65rem,4vw,2.5rem)] font-extrabold tracking-tight text-[var(--color-ink)]">
            {service.title}
          </h1>
          {service.hint ? (
            <p className="mt-2 text-[16px] font-semibold text-[var(--color-ink-soft)]">{service.hint}</p>
          ) : null}
          {from != null ? (
            <p className="mt-3 text-[15px] font-bold text-[var(--color-accent)]">от {formatRub(from)}</p>
          ) : null}

          {service.summary ? (
            <div className="mt-6">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Описание
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                {service.summary}
              </p>
            </div>
          ) : null}

          {service.points?.length ? (
            <div className="mt-7 rounded-[20px] bg-white p-4 shadow-card sm:p-5">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Когда обращаться
              </h2>
              <ul className="mt-3 space-y-2.5">
                {service.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-[14px] leading-snug text-[var(--color-ink-soft)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {service.guarantee ? (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
              <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              Гарантия: {service.guarantee}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-2.5">
            <a
              href={company.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3.5 text-[15px] font-bold text-white shadow-card transition hover:brightness-105"
            >
              <MessageCircle className="h-4 w-4" />
              Написать по услуге
            </a>
            <a
              href={company.phoneHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white px-5 py-3.5 text-[15px] font-bold text-[var(--color-ink)] shadow-card"
            >
              <Phone className="h-4 w-4" />
              Позвонить
            </a>
          </div>
        </motion.div>
      </div>

      <ServicePriceTable service={service} />
    </div>
  )
}

function ServicesList({ services }) {
  return (
    <div className="pt-4 sm:pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="font-display text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold tracking-tight text-[var(--color-ink)]">
          Услуги
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-[var(--color-muted)]">
          Направления ремонта. Откройте карточку — внутри описание, сроки и прайс.
        </p>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 md:gap-4">
          {services.map((service, i) => {
            const from = serviceFromPrice(service)
            return (
              <motion.li
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <Link
                  to={`/services/${service.id}`}
                  className="group block overflow-hidden rounded-[20px] bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-line)]">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${service.tone} opacity-35`}
                    />
                  </div>
                  <div className="p-3 sm:p-3.5">
                    {service.hint ? (
                      <p className="truncate text-[11px] font-semibold text-[var(--color-muted)]">
                        {service.hint}
                      </p>
                    ) : null}
                    <h2 className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug text-[var(--color-ink)] sm:text-[15px]">
                      {service.title}
                    </h2>
                    <p className="mt-2 text-[12px] font-bold text-[var(--color-accent)]">
                      {from != null ? `от ${formatRub(from)}` : service.timing || 'Подробнее'}
                    </p>
                  </div>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export default function ServicesPage() {
  const { id } = useParams()
  const { company, services, getService } = useCms()

  if (id) {
    const service = getService(id)
    if (!service) return <Navigate to="/services" replace />
    return <ServiceDetail service={service} company={company} />
  }

  return <ServicesList services={services} />
}
