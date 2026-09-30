#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
logs=$(docker compose --profile tunnel logs --no-color --tail=200 tunnel)
url=$(printf '%s\n' "$logs" | grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)
if [ -z "$url" ]; then
    echo 'HTTPS-адрес ещё не получен. Запустите docker compose --profile tunnel up --build и повторите через несколько секунд; проверьте логи tunnel.' >&2
    exit 1
fi
printf '%s\n' "$url"
