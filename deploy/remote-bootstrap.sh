#!/usr/bin/env bash
# Однократная подготовка сервера + обновление приложения.
# Вызывается из scripts/deploy.mjs
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/proshivka}"
DOMAIN="${DOMAIN:-proshivka.online}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Packages"
apt-get update -y
apt-get install -y curl ca-certificates gnupg nginx certbot python3-certbot-nginx ufw

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
  echo "==> Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> App directory ${APP_DIR}"
mkdir -p "${APP_DIR}"
# Сохраняем боевые данные при обновлении
if [[ -d "${APP_DIR}/server/cms" ]]; then
  mkdir -p /var/tmp/proshivka-preserve
  cp -a "${APP_DIR}/server/cms" /var/tmp/proshivka-preserve/ 2>/dev/null || true
  cp -a "${APP_DIR}/server/crm" /var/tmp/proshivka-preserve/ 2>/dev/null || true
  [[ -f "${APP_DIR}/.env" ]] && cp -a "${APP_DIR}/.env" /var/tmp/proshivka-preserve/.env || true
fi

# Распаковка релиза (tar уже положен в /tmp/proshivka-release.tar.gz)
if [[ -f /tmp/proshivka-release.tar.gz ]]; then
  echo "==> Extract release"
  rm -rf "${APP_DIR}.new"
  mkdir -p "${APP_DIR}.new"
  tar -xzf /tmp/proshivka-release.tar.gz -C "${APP_DIR}.new"
  # Перенос сохранённых данных поверх релиза
  if [[ -d /var/tmp/proshivka-preserve/cms ]]; then
    mkdir -p "${APP_DIR}.new/server"
    rm -rf "${APP_DIR}.new/server/cms"
    cp -a /var/tmp/proshivka-preserve/cms "${APP_DIR}.new/server/cms"
  fi
  if [[ -d /var/tmp/proshivka-preserve/crm ]]; then
    mkdir -p "${APP_DIR}.new/server"
    rm -rf "${APP_DIR}.new/server/crm"
    cp -a /var/tmp/proshivka-preserve/crm "${APP_DIR}.new/server/crm"
  fi
  if [[ -f /var/tmp/proshivka-preserve/.env ]]; then
    cp -a /var/tmp/proshivka-preserve/.env "${APP_DIR}.new/.env"
  fi
  # Атомарная подмена
  if [[ -d "${APP_DIR}" ]]; then
    rm -rf "${APP_DIR}.old"
    mv "${APP_DIR}" "${APP_DIR}.old" || true
  fi
  mv "${APP_DIR}.new" "${APP_DIR}"
  rm -rf "${APP_DIR}.old" /var/tmp/proshivka-preserve /tmp/proshivka-release.tar.gz
fi

cd "${APP_DIR}"

if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
  printf '%s\n' \
    '# Пароль админки /admin/login' \
    "ADMIN_PASSWORD=${ADMIN_PASSWORD}" \
    "VITE_ADMIN_PASSWORD=${ADMIN_PASSWORD}" \
    > .env
  echo "==> .env: ADMIN_PASSWORD из деплоя"
elif [[ ! -f .env ]]; then
  cat > .env <<EOF
# Пароль админки /admin/login
ADMIN_PASSWORD=admin
VITE_ADMIN_PASSWORD=admin
EOF
  echo "==> Created default .env (смените ADMIN_PASSWORD!)"
fi

echo "==> npm install + build"
if ! npm ci; then
  echo "==> npm ci не удался — fallback: npm install"
  npm install
fi
npm run build

echo "==> Permissions"
id www-data >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin www-data
chown -R www-data:www-data "${APP_DIR}"
chmod -R u+rwX,go+rX "${APP_DIR}"
# запись в CMS/CRM
chmod -R u+rwX "${APP_DIR}/server"

echo "==> systemd"
cp -f "${APP_DIR}/deploy/proshivka.service" /etc/systemd/system/proshivka.service
systemctl daemon-reload
systemctl enable proshivka
systemctl restart proshivka

echo "==> reverse proxy"
# На этом VPS часто уже стоит Remnawave + Caddy на :80/:443 — nginx конфликтует.
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'caddy-remnawave' \
  && [[ -f /opt/remnanode/Caddyfile ]]; then
  echo "==> Caddy (remnawave) — HTTP reverse_proxy на ${DOMAIN}"
  systemctl disable --now nginx 2>/dev/null || true
  python3 "${APP_DIR}/deploy/patch-caddy.py" || true
  # подставляем домен из env, если не proshivka.online
  if [[ "${DOMAIN}" != "proshivka.online" ]]; then
    sed -i "s/proshivka\\.online/${DOMAIN}/g" /opt/remnanode/Caddyfile || true
  fi
  docker restart caddy-remnawave
  echo "==> HTTPS: порт 443 занят Remnawave. Для SSL поставьте Cloudflare (прокси) или отдельный IP."
elif command -v nginx >/dev/null 2>&1 && ! ss -tlnp | grep -qE ':80 .*caddy'; then
  echo "==> nginx"
  cp -f "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/proshivka.conf
  sed -i "s/proshivka\\.online/${DOMAIN}/g" /etc/nginx/sites-available/proshivka.conf || true
  ln -sfn /etc/nginx/sites-available/proshivka.conf /etc/nginx/sites-enabled/proshivka.conf
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
  if [[ "${SKIP_SSL:-0}" != "1" ]]; then
    echo "==> certbot (${DOMAIN})"
    certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect \
      || echo "==> SSL пока не выпущен (проверьте DNS)."
  fi
else
  echo "==> Не удалось настроить прокси автоматически. Приложение слушает 127.0.0.1:5174"
fi

echo "==> firewall"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

systemctl --no-pager --full status proshivka | head -n 20
echo "==> Done. Site: http://${DOMAIN}/"
