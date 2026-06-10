import { HOME_WORKS } from './homeAbout';

export function createDefaultWorks() {
  const page = {
    eyebrow: 'Портфолио',
    title: 'Наши работы',
    subtitle:
      'Отчёты о выполненных восстановлениях. Новые кейсы публикуем по мере готовности — следите за обновлениями.',
  };

  return {
    seo: {
      title: 'Наши работы',
      description:
        'Реальные кейсы восстановления устройств: прошивка, разблокировка, ремонт после влаги и другие работы лаборатории ПРОШИВКА.',
    },
    page,
    /** Заголовки блока на главной (карусель). По умолчанию совпадают со страницей. */
    homeSection: { ...page },
    home: {
      showCarousel: true,
      carouselLimit: 5,
    },
    items: structuredClone(HOME_WORKS).map((item, index) => ({
      ...item,
      published: true,
      createdAt: `2026-05-${String(24 - index).padStart(2, '0')}`,
    })),
  };
}

export function normalizeWorkItem(item, fallback = {}) {
  return {
    id: item.id ?? `work-${Date.now()}`,
    title: item.title ?? '',
    summary: item.summary ?? '',
    details: item.details ?? '',
    category: item.category ?? '',
    model: item.model ?? '',
    status: item.status ?? '',
    image: item.image ?? '',
    published: item.published !== false,
    createdAt: item.createdAt ?? new Date().toISOString().slice(0, 10),
    ...fallback,
    ...item,
  };
}

/** Уникальные категории из списка работ (для фильтра на странице). */
export function getWorkCategories(works) {
  const items = works?.items ?? [];
  return [...new Set(items.map((w) => w.category?.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  );
}

export function findWorkById(works, workId) {
  if (!workId || !works?.items?.length) return null;
  return works.items.find((w) => w.id === workId) ?? null;
}

/** Опубликованные работы, новые сверху. */
export function getPublishedWorks(works) {
  if (!works?.items?.length) return [];
  return works.items
    .filter((item) => item.published !== false)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function duplicateWork(work) {
  const today = new Date().toISOString().slice(0, 10);
  return normalizeWorkItem({
    ...work,
    id: `work-${Date.now()}`,
    title: `${work.title} (копия)`,
    published: false,
    createdAt: today,
  });
}

export function createEmptyWork() {
  const today = new Date().toISOString().slice(0, 10);
  return normalizeWorkItem({
    id: `work-${Date.now()}`,
    title: 'Новая работа',
    summary: 'Краткое описание выполненного восстановления.',
    details: '',
    category: 'Категория',
    model: 'Модель устройства',
    status: 'ГОТОВО',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa8?auto=format&fit=crop&q=80&w=1200',
    published: true,
    createdAt: today,
  });
}
