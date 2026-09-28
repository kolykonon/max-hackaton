# Разработка MAX mini app: код локально, домен dev-max.akarmain.ru

Схема: `https://dev-max.akarmain.ru` → Traefik на сервере → порт `172.18.0.1:15180` →
обратный SSH-туннель → локальный Vite `:5173` → (`/api`) → локальный бэкенд `:8000`.
Фронт и API на одном origin, CORS не нужен. Правки кода видны сразу (HMR / `--reload`).

## Один раз

1. Postgres 15 (brew) запущен: `brew services start postgresql@15`.
2. База и роль `kaplya` / `change_me` на порту 5432 (уже созданы).
3. Зависимости и данные:
   ```bash
   cd backend && uv sync
   POSTGRES_PORT=5432 uv run alembic upgrade head
   POSTGRES_PORT=5432 uv run python -m app.seeds.seed
   cd ../frontend && npm i
   ```
4. В `.env`: `WEBAPP_URL=https://dev-max.akarmain.ru/onboarding`, `AUTH_DEV_MODE=true`, `CORS_ORIGINS=*`.
   `POSTGRES_PORT=5434` — порт Docker; для локальной базы нужен 5432 (в командах ниже переопределяется
   переменной, либо поменяйте в `.env`). `VITE_*` из корневого `.env` Vite НЕ читает — их задаём в команде.
5. В кабинете MAX для мини-приложения указан адрес `https://dev-max.akarmain.ru`.
6. На сервере уже лежит маршрут `/opt/traefik/dynamic/dev-max.akarmain.ru.yml`
   (ключ `microssh-akarmain-prod-2` в `~/.ssh/open_ssh_hosts.config`).

## Каждый раз: три терминала

```bash
# 1. Бэкенд
cd backend
POSTGRES_PORT=5432 uv run uvicorn app.main:app --reload --port 8000

# 2. Фронт (реальный бэк, без моков; в MAX id берётся из initData, VITE_DEV_USER_ID=1 — для браузера)
cd frontend
VITE_USE_MOCKS=false VITE_DEV_USER_ID=1 npm run dev

# 3. Туннель (окно держать открытым, вывода нет)
ssh -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
  -R 172.18.0.1:15180:localhost:5173 microssh-akarmain-prod-2
```

Бот (нужен только для кнопки «Открыть приложение» и ответов бота), polling:
```bash
cd backend && POSTGRES_PORT=5432 uv run python -m app.bot.worker
```
Не запускать, пока тот же токен работает на боевом сервере (конфликт получения обновлений).

## Проверка

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://dev-max.akarmain.ru/            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://dev-max.akarmain.ru/onboarding  # 200
curl -s -o /dev/null -w "%{http_code}\n" -H 'X-Dev-User-Id: 1' https://dev-max.akarmain.ru/api/v1/me   # 200
```
Swagger: `https://dev-max.akarmain.ru/api/docs`.

## Если не работает

| Симптом | Причина / что делать |
|---|---|
| 502 на любой странице | Не запущен Vite (`:5173`) или туннель. Проверьте терминалы 2 и 3. |
| `remote port forwarding failed for listen port 15180` | На сервере висит старая сессия туннеля. Подождите ~90 с или найдите её: `ssh microssh-akarmain-prod-2 'ss -ltnp \| grep 15180'` и завершите именно этот sshd (`kill <pid>`). |
| Страница открывается, `/api` даёт 401 | Вне MAX и Vite запущен без `VITE_DEV_USER_ID=1` (или бэкенд без `AUTH_DEV_MODE=true`). В MAX — не тот токен бота в `.env` или `initData` старше суток. |
| 502 только на `/api` | Не запущен бэкенд (`:8000`) или он не видит Postgres (`POSTGRES_PORT=5432`). |
| Vite: `Blocked request. This host is not allowed` | Traefik должен отправлять Host как IP (`passHostHeader: false` в файле маршрута). |
| Безопасность | Пока `AUTH_DEV_MODE=true`, любой из интернета может отправить `X-Dev-User-Id` на dev-max.akarmain.ru и войти под чужим id. Держите стенд включённым только на время отладки. |

## Остановить

```bash
pkill -f "ssh -N.*15180"; pkill -f "uvicorn app.main:app"; pkill -f vite
```
После `pkill` порт 15180 на сервере освобождается не сразу (см. таблицу).
Убрать стенд совсем: `ssh microssh-akarmain-prod-2 'rm /opt/traefik/dynamic/dev-max.akarmain.ru.yml'`.
