import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { workGallery } from '../data/defaults.js'

/**
 * Короткая витрина работ на главной: горизонтальная карусель.
 * Полный список — на /works.
 */
export default function WorksCarousel({ limit = 8 }) {
  const { works } = useCms()
  const list = works.slice(0, limit)
  const scrollerRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  function updateArrows() {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < max - 8)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateArrows()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateArrows)
    }
  }, [list.length])

  function scrollByCard(dir) {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector('[data-work-card]')
    const step = card ? card.getBoundingClientRect().width + 12 : el.clientWidth * 0.7
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  if (!list.length) return null

  return (
    <section className="pt-8 sm:pt-10" id="works" aria-label="Наши работы">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Галерея
            </p>
            <h2 className="font-display mt-1 text-[1.45rem] font-bold tracking-tight text-[var(--color-ink)] sm:text-[1.7rem]">
              Наши работы
            </h2>
            <p className="mt-1.5 max-w-xl text-[14px] text-[var(--color-muted)] sm:text-[15px]">
              Короткий обзор — все кейсы в разделе «Работы»
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                aria-label="Назад"
                disabled={!canPrev}
                onClick={() => scrollByCard(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-card transition enabled:hover:border-[var(--color-accent)]/40 disabled:opacity-35"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Вперёд"
                disabled={!canNext}
                onClick={() => scrollByCard(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-card transition enabled:hover:border-[var(--color-accent)]/40 disabled:opacity-35"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/works"
              className="inline-flex shrink-0 items-center gap-1 text-[14px] font-bold text-[var(--color-accent)] hover:underline"
            >
              Все
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 sm:px-6 md:mx-auto md:max-w-6xl [&::-webkit-scrollbar]:hidden"
      >
        {list.map((work, i) => {
          const photos = workGallery(work).length
          return (
            <motion.div
              key={work.id}
              data-work-card
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ delay: Math.min(i, 4) * 0.04, duration: 0.35 }}
              className="w-[68vw] max-w-[260px] shrink-0 snap-start sm:w-[240px] sm:max-w-none md:w-[220px]"
            >
              <Link
                to={`/works/${work.id}`}
                className="group block overflow-hidden rounded-[20px] bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-line)]">
                  <img
                    src={work.image}
                    alt={work.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  {work.category ? (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-ink)] shadow-sm">
                      {work.category}
                    </span>
                  ) : null}
                  {photos > 1 ? (
                    <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white">
                      {photos} фото
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="truncate text-[11px] font-semibold text-[var(--color-muted)]">
                    {work.model}
                  </p>
                  <h3 className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug text-[var(--color-ink)]">
                    {work.title}
                  </h3>
                  <p className="mt-2 text-[12px] font-bold text-[var(--color-accent)]">{work.status}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}

        <div className="w-[68vw] max-w-[260px] shrink-0 snap-start sm:w-[240px] md:w-[220px]">
          <Link
            to="/works"
            className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-[var(--color-line)] bg-white/70 px-4 text-center shadow-card transition hover:border-[var(--color-accent)]/40 hover:bg-white"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <ArrowRight className="h-5 w-5" />
            </span>
            <span className="font-display text-[15px] font-bold text-[var(--color-ink)]">Все работы</span>
            <span className="text-[12px] text-[var(--color-muted)]">Открыть галерею</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
