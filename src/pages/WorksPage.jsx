import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import WorkGallery from '../components/WorkGallery.jsx'
import WorksGrid from '../components/WorksGrid.jsx'
import { useCms } from '../context/CmsContext.jsx'
import { workGallery } from '../data/defaults.js'

function waWorkHref(base, work) {
  if (!base) return '#'
  const bits = [work?.title, work?.model, work?.category].filter(Boolean).join(' · ')
  const text = bits
    ? `Здравствуйте! Интересует похожий ремонт: ${bits}`
    : 'Здравствуйте! Хочу узнать про ремонт по вашим работам.'
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}text=${encodeURIComponent(text)}`
}

export default function WorksPage() {
  const { id } = useParams()
  const { works, company } = useCms()
  const categories = useMemo(
    () => ['Все', ...new Set(works.map((w) => w.category).filter(Boolean))],
    [works],
  )
  const [filter, setFilter] = useState('Все')
  const selected = id ? works.find((w) => w.id === id) : null

  const filtered =
    filter === 'Все' ? works : works.filter((w) => w.category === filter)

  if (selected) {
    const photos = workGallery(selected)
    const highlights = Array.isArray(selected.highlights) ? selected.highlights.filter(Boolean) : []

    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/works"
          className="mb-5 inline-flex items-center gap-2 text-[14px] font-bold text-[var(--color-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Все работы
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:items-start">
          <WorkGallery work={selected} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {selected.category ? (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[12px] font-bold text-[var(--color-accent)]">
                  {selected.category}
                </span>
              ) : null}
              {photos.length > 1 ? (
                <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[var(--color-muted)] shadow-card">
                  Фотоотчёт · {photos.length}
                </span>
              ) : null}
            </div>

            <h1 className="font-display mt-3 text-[clamp(1.65rem,4vw,2.5rem)] font-extrabold tracking-tight text-[var(--color-ink)]">
              {selected.title}
            </h1>
            {selected.model ? (
              <p className="mt-2 text-[16px] font-semibold text-[var(--color-ink-soft)]">
                {selected.model}
              </p>
            ) : null}
            {selected.status ? (
              <p className="mt-3 text-[15px] font-bold text-[var(--color-accent)]">{selected.status}</p>
            ) : null}

            {selected.description ? (
              <div className="mt-6">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  Описание
                </h2>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                  {selected.description}
                </p>
              </div>
            ) : (
              <p className="mt-6 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                Пример выполненной работы. Напишите нам — подскажем, подойдёт ли такой же ремонт
                вашему устройству и сколько займёт по времени.
              </p>
            )}

            {highlights.length ? (
              <div className="mt-7 rounded-[20px] bg-white p-4 shadow-card sm:p-5">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  Что сделали
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {highlights.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 text-[14px] leading-snug text-[var(--color-ink-soft)]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {company.whatsapp ? (
              <a
                href={waWorkHref(company.whatsapp, selected)}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3.5 text-[15px] font-bold text-white shadow-card transition hover:brightness-105 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                Хочу такой же ремонт
              </a>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 sm:pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="font-display text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold tracking-tight text-[var(--color-ink)]">
          Наши работы
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-[var(--color-muted)]">
          Фото-кейсы ремонта с описанием. Выберите категорию или откройте карточку.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                filter === cat
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-white text-[var(--color-ink-soft)] shadow-card hover:text-[var(--color-ink)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <WorksGrid items={filtered} title="" subtitle="" showAllLink={false} />
    </div>
  )
}
