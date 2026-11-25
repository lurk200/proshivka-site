import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'

export default function ServiceStrip() {
  const { services } = useCms()
  const preview = services.slice(0, 4)

  return (
    <section className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-9" aria-label="Услуги">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Услуги
          </p>
          <h2 className="font-display mt-1 text-[1.45rem] font-bold tracking-tight text-[var(--color-ink)] sm:text-[1.7rem]">
            Что делаем чаще всего
          </h2>
        </div>
        <Link
          to="/services"
          className="inline-flex shrink-0 items-center gap-1 text-[14px] font-bold text-[var(--color-accent)] hover:underline"
        >
          Все
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {preview.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link
              to={`/services/${service.id}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[22px] shadow-card sm:aspect-[5/6]"
            >
              <img
                src={service.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${service.tone} opacity-80`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                <h3 className="font-display text-[15px] font-bold text-white sm:text-[17px]">
                  {service.title}
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-white/75 sm:text-[13px]">
                  {service.hint}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
