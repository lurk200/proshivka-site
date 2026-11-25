import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calculator, MessageCircle, Phone, Star } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'

export default function Hero() {
  const { company, hero, trust } = useCms()
  const trustItems = (trust || []).filter(
    (item) => String(item.label || '').trim() || String(item.value || '').trim(),
  )

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[28px] bg-[var(--color-ink)] shadow-float sm:rounded-[32px]"
        >
          <img
            src={hero.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-ink)]/88 to-[var(--color-ink)]/35" />
          <div className="absolute -right-10 top-0 h-56 w-56 rounded-full bg-[var(--color-accent)]/25 blur-3xl" />

          <div className="relative grid gap-5 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:p-10">
            <div>
              <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur sm:mb-4 sm:text-[12px]">
                <Star className="h-3.5 w-3.5 shrink-0 fill-[var(--color-accent-bright)] text-[var(--color-accent-bright)]" />
                <span className="truncate">
                  {company.rating} · {company.reviewsCount} отзывов · {company.city}
                </span>
              </div>

              <p className="font-display mb-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-bright)] sm:mb-2 sm:text-[13px]">
                {company.name}
              </p>
              <h1 className="font-display max-w-xl text-[clamp(1.75rem,7vw,3.35rem)] font-extrabold leading-[1.05] tracking-tight text-white text-balance">
                {hero.headline}
              </h1>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/75 sm:mt-4 sm:text-[16px]">
                {hero.text}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  to="/calc"
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent-bright)] px-4 py-2.5 text-[13px] font-bold text-[var(--color-ink)] transition hover:brightness-110 sm:col-auto sm:px-5 sm:py-3 sm:text-[14px]"
                >
                  <Calculator className="h-4 w-4" strokeWidth={2.25} />
                  Рассчитать ремонт
                </Link>
                <a
                  href={company.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2.5 text-[13px] font-bold text-white backdrop-blur transition hover:bg-white/16 sm:px-5 sm:py-3 sm:text-[14px]"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
                  Написать
                </a>
                <a
                  href={company.phoneHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2.5 text-[13px] font-bold text-white backdrop-blur transition hover:bg-white/16 sm:px-5 sm:py-3 sm:text-[14px]"
                >
                  <Phone className="h-4 w-4" strokeWidth={2.25} />
                  Позвонить
                </a>
              </div>

              {trustItems.length ? (
                <div className="mt-4 rounded-2xl border border-white/12 bg-white/10 px-3 py-2.5 backdrop-blur-md lg:hidden">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {trustItems.map((item, idx) => (
                      <div key={`${item.label}-${idx}`} className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">
                          {item.label}
                        </p>
                        <p className="font-display text-[13px] font-bold leading-tight text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {trustItems.length ? (
              <div className="hidden grid-cols-2 gap-3 lg:grid">
                {trustItems.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="rounded-2xl border border-white/12 bg-white/10 px-3.5 py-3 backdrop-blur-md"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-[18px] font-bold text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
