# Деплой на сервер (бот в режиме long polling)

Схема: Caddy (`web`, порты 80/443, сам выпускает HTTPS-сертификат) раздаёт фронт и проксирует `/api/*` в `backend`.
`bot` — отдельный контейнер, забирает сообщения из MAX через long polling (входящий вебхук не нужен).
Postgres и бэк наружу не открыты — это делает `compose.prod.yaml`.

```
MAX (мини-приложение) ──HTTPS──▶ web (Caddy) ──/api──▶ backend ──▶ postgres
MAX API ◀──long polling── bot ──────────────────────────────────────▶ postgres
```

## 1. Что нужно заранее

- Сервер Linux, 1–2 ГБ RAM, Docker Engine и Docker Compose **v2.24+** (`docker compose version`; нужны `!reset`/`!override`).
- Домен с A-записью на IP сервера (например, `kaplya.example.ru`).
- Открыты входящие 80 и 443 (TCP) и 443 (UDP). Порты 80/443 не должны быть заняты другим nginx/Traefik
  (если заняты — см. «Если на сервере уже есть прокси»).
- Токен бота из кабинета MAX для партнёров и имя бота без `@`.

## 2. Код

```bash
git clone https://github.com/kolykonon/max-hackaton.git kaplya
cd kaplya
git checkout dev   # или main — ту ветку, которую выкатываете
```

## 3. Секреты: `.env`

```bash
cp .env.example .env
chmod 600 .env
openssl rand -hex 24   # пароль для Postgres
```

Заполнить в `.env` (всё остальное оставить как в примере):

| Переменная | Значение на сервере | Зачем |
|---|---|---|
| `COMPOSE_FILE` | `compose.yaml:compose.prod.yaml` | добавить строку: прод-надстройка применяется к любой команде `docker compose` |
| `POSTGRES_PASSWORD` | результат `openssl rand -hex 24` | пароль БД |
| `MAX_BOT_TOKEN` | токен из кабинета MAX | **секрет**, без него бэк не стартует |
| `MAX_BOT_USERNAME` | имя бота без `@` | кнопка «Открыть приложение» и реферальные ссылки `max.ru/<бот>?startapp` |
| `MAX_MODE` | `polling` | бот в polling (контейнер `bot` и так всегда polling) |
| `MAX_WEBHOOK_URL`, `MAX_WEBHOOK_SECRET` | пусто | в polling не нужны |
| `DOMAIN` | `kaplya.example.ru` | Caddy выпустит сертификат Let's Encrypt на этот домен |
| `WEB_HTTP_PORT`, `WEB_HTTPS_PORT` | **удалить строки** | нужны стандартные 80/443 |
| `CORS_ORIGINS` | `https://kaplya.example.ru` | добавить строку; фронт и API на одном домене |
| `WEBAPP_URL` | `https://kaplya.example.ru` | адрес мини-приложения |
| `AUTH_DEV_MODE` | `false` | **обязательно**: иначе любой зайдёт под чужим id через `X-Dev-User-Id` |
| `VITE_DEV_USER_ID` | пусто | зашивается во фронт при сборке — на проде не нужен |
| `VITE_USE_MOCKS` | `false` | фронт ходит в настоящий API |
| `DEMO_MODE` | `true` на показ, `false` на бою | эндпоинты `/demo/*`: сброс профиля, «засчитать донацию» |

`.env` не коммитится (есть в `.gitignore`). Держите копию токена и пароля в менеджере паролей:
если потерять `POSTGRES_PASSWORD`, к существующему тому базы не подключиться.

Сертификаты НУЦ Минцифры для запросов к API MAX лежат в `certs/` и монтируются в контейнеры сами.

## 4. Кабинет MAX

1. В настройках мини-приложения бота указать адрес `https://kaplya.example.ru`.
2. **Отключить вебхук-подписки.** Если у бота есть подписка на вебхук, MAX шлёт события туда, и polling ничего
   не получает. Проверка — после запуска (шаг 5):

   ```bash
   docker compose exec bot uv run --no-sync python -c "import asyncio; from app.integrations.max_api import MaxBotClient; print(asyncio.run(MaxBotClient().get_subscriptions()))"
   ```

   Если в ответе есть адреса, удалить каждый:

   ```bash
   docker compose exec bot uv run --no-sync python -c "import asyncio; from app.integrations.max_api import MaxBotClient; print(asyncio.run(MaxBotClient().unsubscribe_webhook('<url из ответа>')))"
   ```

3. **Один токен — один polling.** Пока сервер работает, не запускайте с тем же токеном бота локально
   (`python -m app.bot.worker`, `docker compose up` на ноутбуке): два процесса делят обновления, и часть
   сообщений уйдёт не туда. Для разработки заведите отдельного тестового бота.

## 5. Запуск

```bash
docker compose up -d --build
docker compose ps           # все четыре сервиса Up, postgres — healthy
```

При старте `backend` сам применяет миграции и сиды (сиды идемпотентны, повторный запуск ничего не дублирует).
При самом первом запуске `bot` может один раз перезапуститься, пока идут миграции, — это нормально.

## 6. Проверка

```bash
curl -fsS https://kaplya.example.ru/api/v1/health     # {"status":"ok"}
docker compose logs --tail=50 bot                     # «Бот запущен в режиме long-polling», без ошибок
docker compose logs --tail=50 web                     # certificate obtained successfully
```

Затем в MAX: написать боту `/start` → пришло приветствие с кнопкой → кнопка открывает мини-приложение,
запись и карта работают. Сайт в обычном браузере при `AUTH_DEV_MODE=false` данных не покажет — так и задумано:
вход только из MAX.

## 7. Обновление

```bash
cd kaplya
git pull
docker compose up -d --build
docker image prune -f
```

`--build` обязателен: в проде код берётся из образа, без пересборки запустится старая версия.
Откат — `git checkout <коммит>` и та же команда. Миграции при откате не отменяются: если новая версия
меняла схему БД, сначала сделайте бэкап (шаг 8).

## 8. Бэкап базы

```bash
mkdir -p ~/backups
docker compose exec -T postgres pg_dump -U postgres kaplya | gzip > ~/backups/kaplya-$(date +%F).sql.gz
```

Каждую ночь (`crontab -e`), хранить 14 дней:

```
0 3 * * * cd /home/<user>/kaplya && docker compose exec -T postgres pg_dump -U postgres kaplya | gzip > ~/backups/kaplya-$(date +\%F).sql.gz && find ~/backups -name 'kaplya-*.sql.gz' -mtime +14 -delete
```

Восстановление в пустую базу: `gunzip -c <файл> | docker compose exec -T postgres psql -U postgres kaplya`.

## Стабильность — что уже настроено

- `restart: always` / `unless-stopped`: контейнеры поднимаются после падения и после перезагрузки сервера
  (нужен `systemctl enable docker`).
- Бот переживает сбои сети: ошибка long polling → пауза 5 с → повтор; ошибка в одном сообщении не роняет цикл.
- Логи ограничены: до 5 файлов по 10 МБ на сервис (`compose.prod.yaml`).
- Сертификат Caddy продлевает сам; он хранится в томе `caddy_data` — не удаляйте тома (`down -v` сотрёт и базу!).

## Частые проблемы

| Симптом | Причина / что сделать |
|---|---|
| Бот молчит, в логах `bot` пусто | У бота есть вебхук-подписка (шаг 4.2) или с тем же токеном запущен ещё один polling (шаг 4.3). |
| В логах `MAX API ... → 401` | Неверный `MAX_BOT_TOKEN`. Исправить `.env`, `docker compose up -d`. |
| Ошибки SSL при запросах к MAX | Нет папки `certs/` рядом с `compose.yaml` — она в репозитории, проверьте `git status`. |
| Caddy не получает сертификат | DNS ещё не указывает на сервер или закрыт порт 80/443. `docker compose logs web`. |
| Мини-приложение открывает старую версию | Забыли `--build` при обновлении. |
| `backend` перезапускается по кругу | `docker compose logs backend`: обычно опечатка в `.env` или неверный `POSTGRES_PASSWORD` для уже созданной базы. |

## Если на сервере уже есть прокси (Traefik/nginx на 80/443)

Caddy тогда работает за ним по HTTP: в `.env` задать `DOMAIN=:80`, `WEB_HTTP_PORT=8080`, `WEB_HTTPS_PORT=8443`,
а в своём прокси направить домен на `http://127.0.0.1:8080` (HTTPS-сертификат выпускает ваш прокси).
