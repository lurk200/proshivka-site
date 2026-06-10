# Admin — панель управления сайтом

## Вход

- URL: [http://127.0.0.1:5173/admin/login](http://127.0.0.1:5173/admin/login)
- Пароль по умолчанию: `proshivka`
- Свой пароль: переменная окружения `VITE_ADMIN_PASSWORD` в `.env`

```
VITE_ADMIN_PASSWORD=ваш_секретный_пароль
```

## Сохранение контента

Изменения CMS сохраняются на **сервер** (`server/cms/data/site-content.json`) и видны всем посетителям после нажатия «Сохранить» в админке. При первом деплое локальные правки из браузера администратора автоматически переносятся на сервер.

## Разделы

### Общие
| Путь | Содержимое |
|------|------------|
| `/admin` | Обзор |
| `/admin/company` | Шапка: название, телефон, адрес |

### Главная страница (`/`)
| Путь | Содержимое |
|------|------------|
| `/admin/main/banners` | Баннеры услуг |
| `/admin/main/about` | О нас, фото, карта |
| `/admin/works` | Наши работы (страница + публикация кейсов) |
| `/admin/main/seo` | Meta description |

### Программный ремонт (`/programmnyj-remont`)
| Путь | Содержимое |
|------|------------|
| `/admin/software-repair/hero` | Hero и meta этой страницы |
| `/admin/software-repair/sections` | Заголовки секций |
| `/admin/software-repair/services` | Услуги |
| `/admin/software-repair/cases` | Кейсы |
| `/admin/software-repair/reviews` | Отзывы |
| `/admin/software-repair/principles` | О лаборатории |
| `/admin/software-repair/cta` | Блок CTA |

### Сайт (общее)
| Путь | Содержимое |
|------|------------|
| `/admin/navigation` | Карточки в hero, ссылки футера |
| `/admin/service-pages` | Страницы услуг |
| `/admin/service-template` | Шаблон услуги (процесс, FAQ, CTA) |
| `/admin/legal` | Правовые документы |

Публичная страница работ: `/nashi-raboty`

Изменения сохраняются в `localStorage` и сразу применяются на сайте.

## Структура папки

```
Admin/
  components/   — UI и защита маршрутов
  context/      — авторизация
  layout/       — оболочка с сайдбаром
  pages/        — страницы редактирования
  routes.jsx    — маршруты /admin/*
```
