# ТЗ: «Капля» — бот + мини-приложение в MAX

На всё 5 дней. Тексты и поведение экранов — в `docs/screens/**`, макеты — в `docs/mockups/max-ui-ios/*.png`. Здесь — как делаем и кто что делает.

| Кто | Роль | Зона |
|-----|------|------|
| Коля | BE1 | Каркас бэка, авторизация, профиль и кабинет, демо-данные, деплой, README |
| Миша | BE2 | Регионы, центры, слоты, запись, карта-светофор, бот |
| Гоша | FE1 | Каркас фронта, онбординг, личные данные, кабинет, модалки |
| Андрей | FE2 | Главная, мастер записи (шаги 1–5), карты |

## 1. Скоуп

**Делаем:** бот (`/start`, ответ на любой текст, подтверждение записи, напоминание за день), онбординг с согласием, главная (есть запись / нет записи), запись шаги 1–5 + «Вы записаны», перенос и отмена, карта-светофор, личный кабинет, все модалки, экраны «Рефералы», «Звание почётного донора» и «Согласие на обработку ПД» (для этих трёх макетов нет, делаем в общем стиле).

**Не делаем:** реальные Госуслуги/ЕСИА, реальные данные Службы крови, лимит донаций в год по полу, админку, другие языки.

**Все данные демо.** Метка «Демо-данные» стоит везде, где она есть в md. Иллюстрации пока заглушки нужного размера.

## 2. Стек и структура

- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic, pydantic-settings, httpx, shapely, pytest, uv.
- **Frontend:** React 18 + TS + Vite, `@maxhub/max-ui`, react-router, TanStack Query, zustand, react-hook-form + react-imask, d3-geo + topojson-client, MSW, openapi-typescript.
- **MAX:** MAX Bridge (`<script src="https://st.max.ru/js/max-web-app.js">` → `window.WebApp`), MAX Bot API.
- **Инфра:** docker compose: `postgres` (17, без `latest`), `backend`, `bot` (тот же образ, другая команда), `web` (Caddy: HTTPS + статика + `/api/*` → backend).

Бот работает через long polling, напоминания отправляет цикл в процессе `bot` раз в 5 минут. Статический контент (льготы, противопоказания, виды донации, согласие) лежит на фронте в `src/content`.

```
backend/
  app/
    main.py
    core/        config.py, db.py, auth.py
    api/v1/      me.py, regions.py, map.py, booking.py, appointments.py, demo.py
    models/  schemas/
    services/    eligibility.py, progress.py, booking.py, demo_profile.py
    integrations/max_api.py
    bot/         worker.py, handlers.py, texts.py, reminders.py
    seeds/       regions.json, centers.json, seed.py, slots.py
  migrations/  tests/  Dockerfile  pyproject.toml  uv.lock
frontend/
  public/geo/    russia.topo.json, moscow.topo.json
  src/
    app/  api/ (client, hooks, mocks, types.gen.ts)  bridge/max.ts
    components/  content/  screens/  store/booking.ts  utils/format.ts
  Dockerfile  package.json  package-lock.json
data/  scripts/  docs/
compose.yaml  Caddyfile  .env.example  .dockerignore  README.md
```

Текущие `src/max_hackaton` и `src/frontend` переносим в эту структуру. Это первый коммит Коли.

## 3. Авторизация

- Фронт в каждом запросе шлёт заголовок `X-Max-Init-Data: <window.WebApp.initData>`.
- Бэк проверяет подпись ([док](https://dev.max.ru/docs/webapps/validation)): убрать `hash`, отсортировать пары по ключу, склеить `key=value` через `\n`; `secret = HMAC_SHA256("WebAppData", BOT_TOKEN)`; `hex(HMAC_SHA256(secret, строка)) == hash`; `auth_date` не старше суток. Ошибка → `401`.
- Из `user` делаем upsert в `users`. При первом входе создаём демо-профиль (§5.4) и обрабатываем `start_param` вида `ref_<code>`.
- Локально при `AUTH_DEV_MODE=true` принимаем `X-Dev-User-Id: <int>` вместо initData.

## 4. Модель данных

Перечисления:
- `donation_type`: `whole_blood` | `plasma`
- `blood_group`: `1+ 1- 2+ 2- 3+ 3- 4+ 4-` (1 = O(I), 2 = A(II), 3 = B(III), 4 = AB(IV))
- `stock_status`: `urgent` | `low` | `enough` (нет строки — «нет данных»)
- `appointment_status`: `active` | `cancelled` | `rescheduled` | `completed`

| Таблица | Поля |
|---------|------|
| `users` | id, max_user_id (unique), first_name, last_name, username, photo_url, onboarding_completed_at, consent_at, blood_group, kell, phenotype, donor_code, referral_code (unique), referred_by_user_id, created_at |
| `personal_data` | user_id (PK), last_name, first_name, middle_name, passport_series, passport_number, passport_issued_by, passport_division_code, oms_number, phone, email, is_demo, updated_at. **Не логировать** |
| `regions` | id, code (`RU-MOW`), name, timezone. 89 субъектов |
| `region_blood_status` | region_id, blood_group, status, updated_at |
| `centers` | id, region_id, name, address, lat, lon, photo_url |
| `center_blood_status` | center_id, blood_group, status |
| `slots` | id, center_id, donation_type, starts_at, is_blocked |
| `appointments` | id, user_id, slot_id, center_id, donation_type, starts_at, status, rescheduled_from_id, reminder_sent_at, created_at, cancelled_at. Уникальные индексы на `slot_id` и `user_id` `WHERE status='active'` |
| `donations` | id, user_id, donation_type, donated_on, center_name, is_demo |

Слот свободен, если `is_blocked = false`, на него нет `active`-записи и `starts_at > now()`.

## 5. Бизнес-логика (бэк, с unit-тестами)

### 5.1 Интервалы
```
next_whole  = max(today, last_whole + 60, last_plasma + 30)
next_plasma = max(today, last_plasma + 14, last_whole + 30)
```
Если донаций какого-то вида нет, слагаемое пропускаем. `next == today` — интервал прошёл, подпись «можно сдать с …» не показываем.

### 5.2 Уровни (по N = кровь + плазма)
0 — Будущий донор, 1 — Новичок, 5 — Активный донор, 10 — Опытный донор, 20 — Наставник, 40 — Легенда донорства.

### 5.3 Почётный донор (X — кровь, Y — плазма)
- Кровь: X из 40. Плазма: Y из 60. Смешанные: X+Y из 40, если X ≥ 25, иначе из 60.
- Звание набрано: `X ≥ 40` или `Y ≥ 60` или `(X ≥ 25 и X+Y ≥ 40)` или `X+Y ≥ 60`.
- Срок до звания — минимум из четырёх вариантов, считаем от ближайшей разрешённой даты:
  - только кровь раз в 60 дней до X = 40;
  - только плазма раз в 14 дней до Y = 60;
  - пока X < 25, чередуем кровь → плазма через 30 дней → кровь через 30 дней, потом плазма раз в 14 дней до X+Y = 40;
  - плазма раз в 14 дней до X+Y = 60.

  Бэк отдаёт `{date, years, months}`. Это наше допущение — пишем его в README в «Ограничения».

### 5.4 Демо-профиль при первом входе
- Личные данные: Иванов Иван Иванович, 4510 123456, ГУ МВД России по г. Москве, 770-001, ОМС 1234 5678 9012 3456, +7 (900) 123-45-67, ivanov@mail.ru.
- Кровь: `2+`, `K-`, `CcDee`, случайный код донора из 20 цифр.
- Донации: 10 крови + 2 плазмы за ~3 года. Даты считаются от сегодня, последняя — кровь 45 дней назад.

### 5.5 Запись
- У пользователя одна активная запись.
- При создании проверяем: слот существует, он в будущем и свободен; вид донации совпадает; дата ≥ `next_<type>`; личные данные заполнены.
- Гонку за слот ловит уникальный индекс → `409 slot_taken`.
- Перенос делаем в одной транзакции: старая запись → `rescheduled`, новая → `active`.
- После записи или переноса бот шлёт подтверждение через `BackgroundTasks`. Если отправка упала, запись всё равно создаётся, ошибку пишем в лог.
- Окно записи — 2 месяца от сегодня. День доступен, если в регионе есть свободный слот этого вида и день ≥ `next_<type>`.
- Центры на дату показываем только со свободными слотами. Сортировка: сначала `urgent` для группы пользователя, дальше по расстоянию, без геопозиции — по алфавиту. При переносе текущий центр идёт первым.
- Слоты идут шагом 15 минут. Утро — до 12:00, день — 12:00–17:00, вечер — после 17:00, по местному времени региона.

## 6. API `/api/v1`

Даты передаём как `YYYY-MM-DD`, время — в ISO и рядом `local_time: "09:30"`. Ошибки в формате `{"error": {"code", "message", "fields"}}`, `fields` — только для 422 с формой. Типы на фронте генерируем из `/api/openapi.json`.

**До 14:00 первого дня** Коля и Миша коммитят схемы и заглушки всех эндпоинтов. Дальше контракт меняем только после договорённости в чате.

### Профиль — Коля
| Метод | Путь | Ответ |
|-------|------|-------|
| GET | `/me` | `{id, first_name, last_name, photo_url, onboarding_completed, blood: {group, kell, phenotype, donor_code}, referrals_count}` |
| POST | `/me/onboarding` | `{consent: true}` → 204 |
| GET | `/me/personal-data` | `{last_name, first_name, middle_name, passport_series, passport_number, passport_issued_by, passport_division_code, oms_number, phone, email, is_demo, missing_fields}` |
| PUT | `/me/personal-data` | то же тело → 200 / 422 с `fields` (правила и тексты ошибок — из `confirming.md`) |
| GET | `/me/eligibility` | `{next_allowed: {whole_blood, plasma}, interval_active: {whole_blood, plasma}}` |
| GET | `/me/progress` | `{total, level: {code, name, threshold, next: {name, threshold, remaining} \| null, is_max}, honorary: {whole: {count, goal}, plasma: {count, goal}, mixed: {count, goal, whole_needed_for_40}, achieved, eta: {date, years, months} \| null}}` |
| GET | `/me/donations` | `{total, years: [{year, count, items: [{id, donation_type, donated_on, center_name}]}]}` — от новых к старым |
| GET | `/me/referrals` | `{count, link}` (ссылка вида `https://max.ru/<bot>?startapp=ref_<code>`) |

### Регионы, карта, запись — Миша
| Метод | Путь | Ответ |
|-------|------|-------|
| GET | `/regions` | `[{id, code, name, has_centers}]` по алфавиту |
| GET | `/regions/locate?lat&lon` | `{region \| null}` |
| GET | `/map/status` | `{updated_at, regions: [{code, statuses: {"1+": "urgent", …}, worst}]}` |
| GET | `/booking/dates?region_id&donation_type` | `{from, to, earliest_allowed, first_available, days: [{date, available}]}` |
| GET | `/booking/centers?region_id&donation_type&date&lat&lon&pin_center_id` | `[{id, name, address, lat, lon, photo_url, free_slots, distance_km, group_status}]` |
| GET | `/booking/slots?center_id&donation_type&date` | `{center, date, groups: [{period, slots: [{id, local_time, is_free}]}]}` — пустые группы не отдаём |
| GET | `/appointments/current` | `{appointment: {id, donation_type, starts_at, local_date, local_time, center: {id, name, address, region_id}} \| null}` |
| POST | `/appointments` | `{slot_id}` → 201. Ошибки: `409 slot_taken`, `409 active_exists`, `422 interval_not_passed`, `422 personal_data_incomplete`, `404 slot_not_found` |
| POST | `/appointments/{id}/reschedule` | `{slot_id}` → 201, ошибки те же |
| POST | `/appointments/{id}/cancel` | 200 |

### Демо и служебное — Коля
Демо-эндпоинты работают только при `DEMO_MODE=true`.
- `POST /demo/reset` — вернуть профиль к демо-состоянию и отменить записи.
- `POST /demo/appointments/{id}/remind` — отправить напоминание сразу.
- `POST /demo/appointments/{id}/complete` — засчитать донацию.
- `GET /health`.

## 7. Бот — Миша

Клиент MAX Bot API — `integrations/max_api.py` ([док](https://dev.max.ru/docs-api)). Тексты лежат в `bot/texts.py`, копируем их дословно из md.

| Событие | Что делает бот |
|---------|----------------|
| `bot_started` или `/start` | Приветствие + кнопка «Открыть приложение» (`0.bot/start_message.md`) |
| Любой другой текст | Ответ-заглушка + та же кнопка |
| Запись создана или перенесена | «Вы записаны на донацию ✅ …» + «Открыть запись» (`appointment_confirmed.md`) |
| За 24 ч до записи | Напоминание + «Открыть запись» (`main_screen.md`) |

- Кнопки — inline-клавиатура, тип `open_app`.
- Напоминания: активные записи с `reminder_sent_at IS NULL` и `starts_at` в ближайшие 24 ч → отправить → проставить `reminder_sent_at`.

## 8. Фронт: общее — делает Гоша в первый день

- Старт приложения: спиннер → `GET /me` → онбординг или `/home`. При `start_param = appointment` открываем `/home`.
- API-клиент добавляет initData (или `VITE_DEV_USER_ID`) и разбирает `error.code`. На каждый эндпоинт — свой хук TanStack Query. MSW-моки на весь §6, включаются через `VITE_USE_MOCKS=true`.
- `bridge/max.ts`: initData, startParam, BackButton (системный «Назад» = «←»), `openLink` для yadonor.ru, haptic при выборе, `shareMaxContent` для рефералов. Вне MAX — заглушки.
- Общие компоненты (сначала ищем в max-ui): BottomSheet, StepHeader, StickyFooter, SegmentedControl, DemoBadge, Skeleton, ErrorState, EmptyState, Toast, ConfirmDialog, TabBar, DonationIcon, ProgressBar.
- `utils/format.ts`: форматы дат («14 октября, вт, 09:30») и склонения.
- **Каждый экран реализует все строки из таблицы «Состояния» в своём md.**

## 9. Задачи

### Коля (BE1)
1. Перенос структуры, каркас, Alembic, единый формат ошибок, `/health`. Починить compose и Dockerfile: сейчас volume монтируется в `/app`, а WORKDIR — `/src/max_hackaton`.
2. Авторизация (§3) с тестом.
3. Таблицы `users`, `personal_data`, `donations`.
4. Все эндпоинты профиля. `services/eligibility.py` и `services/progress.py` с тестами — `eligibility` нужен и Мише.
5. Демо-профиль, `/demo/*`, рефералы.
6. `compose.yaml`, `Caddyfile`, `.env.example`. На старте backend выполняет `alembic upgrade head` → сиды → uvicorn. Сборка — не дольше 5 минут. Деплой на VPS, домен, HTTPS, URL мини-приложения в кабинете MAX.
7. README по списку из кейса, `docs/openapi.json`.

### Миша (BE2)
1. Таблицы `regions`, `region_blood_status`, `centers`, `center_blood_status`, `slots`, `appointments`.
2. Сиды:
   - 89 субъектов (код, название, таймзона);
   - реальные центры крови с адресами и координатами во **всех** субъектах: минимум по одному, в Москве 6–8, в МО 3–4, в СПб и Татарстане по 2–3 (~110 штук, источник — yadonor.ru и сайты центров);
   - статусы светофора — детерминированные демо, ~10% регионов без данных;
   - слоты на 60 дней: пн–сб 08:00–14:00, у части центров ещё 17:00–19:00; 30–60% занято; 1–2 дня занято полностью.
   Сид идемпотентный.
3. `/regions`, `/regions/locate` (GeoJSON берёшь у Андрея), `/map/status`.
4. `/booking/*`, `/appointments/*` с тестами: двойная запись → 409, запись раньше интервала → 422, перенос атомарный.
5. Бот (§7). Проверить на реальном токене в первый день.

### Гоша (FE1)
1. Общая часть (§8), Dockerfile фронта.
2. Онбординг (макеты 01–03).
3. Модалки «Льготы», «Почему такие ограничения», «Противопоказания» (макеты 14–16).
4. Экран «Запись на донорство» (макет 05).
5. Проверка и редактирование личных данных (макеты 11, 25): маски, валидация, тексты ошибок из md.
6. Личный кабинет (макет 17) и его модалки (макеты 18–22).
7. Экраны без макетов:
   - «Рефералы» — счётчик, ссылка, «Поделиться»;
   - «Звание почётного донора» — условия, льготы, прогресс;
   - «Согласие на ПД» — текст из `docs/legal/consent.md`;
   - скрытое демо-меню (5 тапов по аватару) с тремя кнопками `/demo/*`.

### Андрей (FE2)
1. `store/booking.ts`: режим новая запись / перенос, вид, регион, дата, центр, слот. При изменении шага сбрасываем то, что от него зависит.
2. Главная (макеты 04, 23): превью светофора, варианты «есть запись» / «нет записи», перенос, отмена.
3. Шаги 1–5 (макеты 06–10) и «Вы записаны» (макет 12), включая обработку `409 slot_taken`.
4. Карта-светофор РФ (макет 13) и вкладка «Карта» на шаге 3 (макет 24). Только SVG через d3-geo; для Москвы — районы из `moscow.topo.json`.
5. Геоданные: границы субъектов РФ из OSM (`admin_level=4`, ODbL), упростить до ≤ 500 КБ topojson, свойство `code` = коду из `regions.json`. 89 субъектов. GeoJSON отдать Мише.

## 10. План

| День | Коля | Миша | Гоша | Андрей |
|------|------|------|------|--------|
| 1 | Каркас, авторизация, **заглушки API до 14:00** | Таблицы, **заглушки API до 14:00**, проверка бота, начать сбор центров | Общая часть фронта | Геоданные, store, главная на моках |
| 2 | Эндпоинты профиля, eligibility/progress | Сиды, `/regions*`, `/map/status` | Онбординг, модалки, «Запись на донорство» | Главная, шаги 1–2 |
| 3 | Донации, рефералы, демо; первый деплой | `/booking/*`, `/appointments/*`, бот `/start` | Личные данные, ЛК | Шаги 3–5, «Вы записаны», переход на реальный API |
| 4 | README, OpenAPI, фиксы | Подтверждение и напоминания, фиксы | Модалки ЛК, экраны без макетов | Карты, перенос записи |
| 5 | Фиксы до 15:00, **код-фриз в 15:00**, прогон с нуля, commit hash | Прогон бота | Прогон состояний в MAX (iOS, Android, web) | То же |

Созвоны в 10:00 и 19:00. С третьего дня мержим в `main` через PR с ревью напарника по роли.

## 11. Готово, когда

- В MAX (мобильный и веб) проходит весь сценарий: `/start` → онбординг → запись → «Вы записаны» → сообщение в чате → главная с записью → отмена. Повторный проход тоже работает.
- Напоминание приходит.
- Все состояния из md работают; после любой ошибки можно продолжить без перезапуска.
- `docker compose up -d --build` поднимает всё с нуля: миграции и сиды применяются сами.
- Секретов в репозитории нет, версии зафиксированы, `pytest` зелёный, `npm run build` без ошибок.

## 12. `.env.example`

```
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=kaplya
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
MAX_BOT_TOKEN=
MAX_API_BASE_URL=
MAX_BOT_USERNAME=
WEBAPP_URL=https://example.ru
AUTH_DEV_MODE=false
DEMO_MODE=true
CORS_ORIGINS=https://example.ru
DOMAIN=example.ru
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCKS=false
VITE_DEV_USER_ID=
```

## 13. Открыто

- Тексты экранов «Рефералы» и «Звание почётного донора» — до 4-го дня.
- Данные оператора в `docs/legal/consent.md` — до 5-го дня.
- Какой вид донации брать для подписи «Сдать кровь можно с …» на главной. Пока берём цельную кровь.
