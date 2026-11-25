#!/usr/bin/env bash
# 1) Останавливаем Remnawave/Caddy (освобождаем :80/:443)
# 2) Выпускаем Let's Encrypt через certbot standalone
# 3) Возвращаем стек
# 4) Вешаем TLS на proshivka.online через Caddy (сертификаты с диска)
#
# Важно: :443 снова займёт Remnawave. Поэтому для HTTPS сайт идёт
# тем же путём, что и «steal»-домен: SNI → Caddy unix-socket.
# SELF_STEAL_DOMAIN переключаем на proshivka.online (камуфляж = реальный сайт).
set -euo pipefail

DOMAIN="${DOMAIN:-proshivka.online}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/remnanode}"

echo "==> [1/5] Stop Remnawave stack"
cd "${COMPOSE_DIR}"
docker compose stop 2>/dev/null || docker-compose stop 2>/dev/null || true
docker stop remnanode caddy-remnawave 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
sleep 2
fuser -k 80/tcp 2>/dev/null || true
fuser -k 443/tcp 2>/dev/null || true
sleep 1
ss -tlnp | grep -E ':80 |:443 ' || echo "ports 80/443 free"

echo "==> [2/5] certbot standalone"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y >/dev/null
apt-get install -y certbot >/dev/null

certbot certonly --standalone \
  --non-interactive --agree-tos \
  --preferred-challenges http \
  -m "${EMAIL}" \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --keep-until-expiring \
  --expand

CERT="/etc/letsencrypt/live/${DOMAIN}"
test -f "${CERT}/fullchain.pem"
test -f "${CERT}/privkey.pem"
echo "    certs: ${CERT}"

mkdir -p /etc/proshivka/tls
cp -f "${CERT}/fullchain.pem" /etc/proshivka/tls/fullchain.pem
cp -f "${CERT}/privkey.pem" /etc/proshivka/tls/privkey.pem
chmod 644 /etc/proshivka/tls/fullchain.pem /etc/proshivka/tls/privkey.pem

# renewal: копировать в /etc/proshivka/tls после renew
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/proshivka-copy.sh <<'HOOK'
#!/bin/bash
DOMAIN="proshivka.online"
cp -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" /etc/proshivka/tls/fullchain.pem
cp -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" /etc/proshivka/tls/privkey.pem
chmod 644 /etc/proshivka/tls/*
docker restart caddy-remnawave 2>/dev/null || true
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/proshivka-copy.sh

echo "==> [3/5] Write Caddyfile (HTTP + HTTPS via steal socket)"
# Бэкап
cp -a /opt/remnanode/Caddyfile /opt/remnanode/Caddyfile.bak-before-certbot

# SELF_STEAL → proshivka.online, чтобы Remnawave на :443 отдавал наш сайт
if [[ -f /opt/remnanode/docker-compose.yml ]]; then
  cp -a /opt/remnanode/docker-compose.yml /opt/remnanode/docker-compose.yml.bak-before-certbot
  sed -i 's/SELF_STEAL_DOMAIN=.*/SELF_STEAL_DOMAIN=proshivka.online/' /opt/remnanode/docker-compose.yml
  # volume с сертификатами для caddy
  if ! grep -q '/etc/proshivka/tls' /opt/remnanode/docker-compose.yml; then
    sed -i 's|          - caddy_data:/data|          - caddy_data:/data\n          - /etc/proshivka/tls:/etc/proshivka/tls:ro|' /opt/remnanode/docker-compose.yml
  fi
fi

cat > /opt/remnanode/Caddyfile <<'CADDY'
{
    admin off
    servers {
        listener_wrappers {
            proxy_protocol
            tls
        }
    }
    auto_https disable_redirects
}

# HTTP: ACME + редирект/прокси
http://proshivka.online, http://www.proshivka.online {
    bind 0.0.0.0

    handle /.well-known/acme-challenge/* {
        root * /var/www/html
        file_server
    }

    handle {
        reverse_proxy 127.0.0.1:5174
    }
}

# HTTPS через unix-socket Remnawave (SNI = SELF_STEAL_DOMAIN)
https://proshivka.online, https://www.proshivka.online {
    bind unix/{$CADDY_SOCKET_PATH}
    tls /etc/proshivka/tls/fullchain.pem /etc/proshivka/tls/privkey.pem
    reverse_proxy 127.0.0.1:5174
}

:80 {
    bind 0.0.0.0
    respond 204
}
CADDY

echo "==> [4/5] Start Remnawave stack"
cd "${COMPOSE_DIR}"
docker compose up -d 2>/dev/null || docker-compose up -d
sleep 4

echo "==> [5/5] Check"
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -10
echo "--- HTTP ---"
curl -sI "http://${DOMAIN}/" | head -10 || true
echo "--- HTTPS ---"
curl -skI "https://${DOMAIN}/" | head -15 || true
echo "--- app ---"
systemctl is-active proshivka || true
curl -sI -H "Host: ${DOMAIN}" http://127.0.0.1:5174/ | head -5 || true

echo
echo "Done."
echo "  http://${DOMAIN}/"
echo "  https://${DOMAIN}/"
echo "Certs: ${CERT}"
echo "Note: SELF_STEAL_DOMAIN now = proshivka.online (site is Remnawave camouflage)."
