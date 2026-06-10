# ПРОШИВКА — proshivka.online

Сайт сервисного центра: каталог услуг, прайс на ремонт, приём заказов, отслеживание статуса и админ-панель.

**Стек:** React 19, Vite 8, Tailwind CSS 4, React Router 7.

## Локальная разработка

```bash
npm install
npm run dev
```

Сайт: [http://127.0.0.1:5173](http://127.0.0.1:5173)  
Админка: [http://127.0.0.1:5173/admin/login](http://127.0.0.1:5173/admin/login)

Скопируйте `.env.example` в `.env` и задайте `VITE_ADMIN_PASSWORD` для продакшена.

## Сборка

```bash
npm run build
npm run preview
```

Статика попадает в `dist/`. API заказов и прайса работает через Vite-плагины в dev/preview; для продакшена нужен Node-сервер или прокси к тем же эндпоинтам.

## Деплой на сервер (proshivka.online)

1. Клонировать репозиторий на сервер.
2. `npm ci && npm run build`
3. Раздавать `dist/` через nginx (или аналог) с fallback на `index.html` для SPA.
4. Настроить SSL для домена `proshivka.online`.
5. Задать переменные окружения и обеспечить запись JSON-файлов в `server/` (заказы, уведомления, прайс).

Подробнее об админке — [Admin/README.md](Admin/README.md).
