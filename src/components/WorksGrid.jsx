import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { workGallery } from '../data/defaults.js'

export default function WorksGrid({
  items,
  title = 'Наши работы',
  subtitle = 'Живая галерея ремонтов — как витрина, только про сервис',
  showAllLink = true,
  limit,
}) {
  const { works } = useCms()
  const source = items ?? works
  const list = typeof limit === 'number' ? source.slice(0, limit) : source

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10" id="works">
      {title ? (
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Галерея
            </p>
            <h2 className="font-display mt-1 text-[1.45rem] font-bold tracking-tight text-[var(--color-ink)] sm:text-[1.7rem]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1.5 max-w-xl text-[14px] text-[var(--color-muted)] sm:text-[15px]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {showAllLink ? (
            <Link
              to="/works"
              className="inline-flex shrink-0 items-center gap-1 text-[14px] font-bold text-[var(--color-accent)] hover:underline"
            >
              Все
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 md:gap-4">
        {list.map((work, i) => {
          const photos = workGallery(work).length
          return (
          <motion.li
            key={work.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
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
              <div className="p-3 sm:p-3.5">
                <p className="truncate text-[11px] font-semibold text-[var(--color-muted)]">
                  {work.model}
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug text-[var(--color-ink)] sm:text-[15px]">
                  {work.title}
                </h3>
                {work.description ? (
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[var(--color-muted)]">
                    {work.description}
                  </p>
                ) : null}
                <p className="mt-2 text-[12px] font-bold text-[var(--color-accent)]">{work.status}</p>
              </div>
            </Link>
          </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
