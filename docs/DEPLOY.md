# Серверное развёртывание

Для жюри используйте [быстрый запуск](../README.md). Этот документ — отдельная
серверная конфигурация со своим доменом и паролем БД.

Нужны Docker/Compose v2.24.4+, DNS на сервер и входящие порты 80/TCP, 443/TCP+UDP.
Caddy берёт конфигурацию из `frontend/Caddyfile` в образе, работает без root,
внутри слушает 8080/8443. Корневой `Caddyfile` — прежняя конфигурация, новый Compose
её не монтирует. Frontend и API работают с одного origin.

## Настройка

Скопируйте `.env.example` в `.env` и задайте:

| Переменная | Серверное значение |
|---|---|
| `MAX_BOT_TOKEN` | Собственный токен |
| `MAX_BOT_USERNAME` | Можно оставить пустым, определяется через `/me` |
| `DOMAIN` | Ваш домен, например `kaplya.example.ru` |
| `WEB_HTTP_PORT`, `WEB_HTTPS_PORT` | `80`, `443` |
| `POSTGRES_PASSWORD` | Собственный случайный пароль, например результат `openssl rand -hex 24` |
| `POSTGRES_HOST_AUTH_METHOD` | `scram-sha-256`, также принудительно задан в prod override |
| `AUTH_DEV_MODE`, `DEMO_MODE` | `false` |
| `VITE_DEV_USER_ID` | Пусто, затем обязательно пересобрать web |
| `VITE_USE_MOCKS` | `false` |
| `MAX_MODE` | `webhook` |
| `MAX_WEBHOOK_URL` | `https://<ваш домен>/api/v1/webhook/max` |
| `MAX_WEBHOOK_SECRET` | Собственный случайный секрет для проверки заголовка MAX |

Храните токен, пароль и webhook-секрет вне Git. Переключение `trust` на пароль
не изменяет `pg_hba.conf` уже созданного тома: серверу нужна новая база с SCRAM
и восстановлением дампа либо отдельная настройка аутентификации администратором.
Старое монтирование `/var/lib/postgresql` заменено на `/var/lib/postgresql/data`;
перед обновлением старого стенда сохраните дамп, не удаляйте прежние тома.

## Запуск

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d --build postgres backend web
```

В этом режиме webhook обслуживает backend; второй сервер и polling-контейнер
`bot` не нужны. Если bot запускался раньше, остановите его: `docker compose stop bot`.
Настройте HTTPS-адрес мини-приложения у организаторов/в кабинете MAX. Подпишите бота
на webhook методом `POST /subscriptions` с `url` и `secret` из `.env` либо
скриптом `backend/scripts/subscribe_webhook.py` в окружении разработчика с `uv`.
Скрипты разработчика и uv в конечный Python-образ не включаются.

Для временного демонстрационного сервера можно оставить `MAX_MODE=polling` и
запустить все четыре сервиса. Уберите webhook-подписки в кабинете MAX заранее;
один токен обслуживается одним polling-процессом. [MAX рекомендует webhook для
production](https://dev.max.ru/docs-api/methods/GET/updates).

```bash
curl -fsS https://kaplya.example.ru/api/v1/health
docker compose -f compose.yaml -f compose.prod.yaml ps
```

Вне MAX при `AUTH_DEV_MODE=false` запрос профиля возвращает 401. Это ожидаемо.
Healthcheck доступен отдельно, без авторизации. Изменения `VITE_*` требуют сборки,
изменения `.env` — пересоздания контейнеров командой `up -d`, не `restart`.

## Данные, обновление, остановка

Backend применяет миграции и идемпотентный сид до готовности API. На сервере
запускайте только одну реплику backend, поскольку в ней живёт планировщик.
После обновления кода повторите команду запуска с `--build`.

Бэкап (подставьте имена БД/пользователя из своей конфигурации):

```bash
docker compose exec -T postgres pg_dump -U postgres kaplya > kaplya-backup.sql
```

Дамп содержит пользовательские данные: храните его отдельно и защищённо.
Восстановление в подготовленную пустую базу:
`docker compose exec -T postgres psql -U postgres kaplya < kaplya-backup.sql`.

Остановка с сохранением данных:
`docker compose -f compose.yaml -f compose.prod.yaml down`.
`down --volumes` удаляет БД и данные сертификатов — для рабочего сервера не применять.
Логи ограничены пятью файлами по 10 МБ на сервис.
