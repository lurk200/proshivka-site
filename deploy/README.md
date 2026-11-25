# Деплой на VPS (proshivka.online)

## Один раз

1. В DNS: **A**-запись `proshivka.online` и `www` → IP сервера.
2. Секреты:

```bash
copy deploy.secrets.example deploy.secrets
```

Заполните `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`.

3. `npm install`

## Деплой / обновление

```bash
npm run deploy
```

Скрипт упакует проект, зальёт на сервер, сделает `npm ci && npm run build`, перезапустит systemd `proshivka`.  
Данные `server/cms` и `server/crm` **сохраняются**.

На этом VPS уже стоит **Remnawave + Caddy** на :80/:443.

SSL: `deploy/issue-cert.sh` — стоп Remnawave → certbot standalone → старт обратно + TLS на сайт.

## Полезное на сервере

```bash
systemctl status proshivka
journalctl -u proshivka -f
nano /var/www/proshivka/.env   # ADMIN_PASSWORD
docker restart caddy-remnawave
```

## Безопасность

- `deploy.secrets` в `.gitignore` — не коммитьте пароль.
- Смените пароль root и `ADMIN_PASSWORD` в `.env`.
- Лучше SSH-ключ вместо пароля в `deploy.secrets`.
