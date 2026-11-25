import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { workGallery } from '../data/defaults.js'

/**
 * Галерея фотоотчёта: большое фото + миниатюры (как карточка лота, для ремонта).
 */
export default function WorkGallery({ work, className = '' }) {
  const images = workGallery(work)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [work?.id])

  useEffect(() => {
    if (index >= images.length) setIndex(Math.max(0, images.length - 1))
  }, [images.length, index])

  if (!images.length) {
    return (
      <div
        className={`flex aspect-[4/5] items-center justify-center rounded-[24px] bg-[var(--color-line)] text-[14px] font-semibold text-[var(--color-muted)] ${className}`}
      >
        Нет фото
      </div>
    )
  }

  const current = images[Math.min(index, images.length - 1)]
  const multi = images.length > 1

  function go(delta) {
    setIndex((i) => (i + delta + images.length) % images.length)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative overflow-hidden rounded-[24px] bg-white shadow-card">
        <img
          src={current}
          alt={work?.title || ''}
          className="aspect-[4/5] w-full object-cover"
        />
        {multi ? (
          <>
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink)] shadow-md backdrop-blur hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink)] shadow-md backdrop-blur hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {multi ? (
        <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1">
          {images.map((url, i) => (
            <li key={`${url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`box-border block h-16 w-16 rounded-xl border-2 p-0.5 transition sm:h-[4.5rem] sm:w-[4.5rem] ${
                  i === index
                    ? 'border-[var(--color-accent)]'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <span className="block h-full w-full overflow-hidden rounded-[10px]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
