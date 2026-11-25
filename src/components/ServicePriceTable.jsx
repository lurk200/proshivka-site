import { MessageCircle } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { formatPriceItem } from '../utils/price.js'

/**
 * Прайс конкретной услуги.
 * Структура price.items готова под будущий калькулятор в админке
 * (после выбора услуги → уточнение модели / позиции).
 */
export default function ServicePriceTable({ service }) {
  const { company } = useCms()
  const price = service.price
  const items = price?.items ?? []

  if (!items.length) return null

  return (
    <section
      id="price"
      className="mt-8 scroll-mt-24 rounded-[28px] border border-[var(--color-line)] bg-white p-5 shadow-card sm:p-7"
      aria-labelledby="service-price-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Прайс
          </p>
          <h2
            id="service-price-heading"
            className="font-display mt-1 text-[1.35rem] font-bold tracking-tight text-[var(--color-ink)] sm:text-[1.5rem]"
          >
            Стоимость: {service.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--color-muted)] sm:text-[14px]">
            {price.note ||
              'Ориентир по популярным работам. Точная цена зависит от модели и состояния — скажем после короткой диагностики.'}
          </p>
        </div>
        <a
          href={company.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-4 py-2.5 text-[13px] font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
        >
          <MessageCircle className="h-4 w-4" />
          Уточнить по модели
        </a>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-line)]">
        <ul className="m-0 divide-y divide-[var(--color-line)] list-none p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 bg-white px-4 py-3.5 transition hover:bg-[var(--color-canvas)] sm:px-5"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--color-ink)] sm:text-[15px]">
                  {item.title}
                </p>
                {item.note ? (
                  <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">{item.note}</p>
                ) : null}
              </div>
              <p className="shrink-0 font-display text-[15px] font-bold tabular-nums text-[var(--color-ink)] sm:text-[16px]">
                {formatPriceItem(item)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-muted)]">
        Диагностика обычно бесплатна при согласии на ремонт. Цены «от» — старт для типовых
        случаев; для редких моделей рассчитаем отдельно.
      </p>
    </section>
  )
}
