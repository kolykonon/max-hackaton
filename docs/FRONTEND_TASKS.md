# Фронт: что сделать под новые фичи бэкенда

Бэкенд готов, типы: `cd frontend && npm run gen:api` (openapi.json уже обновлён).
Все ручки — под `/api/v1`, авторизация как обычно.

## 0. Новые start_param (кнопки бота открывают приложение с ними)

`getStartParam()` уже есть. Нужно добавить роутинг:

| start_param | Куда вести |
|---|---|
| `book` | начало записи (выбор вида и региона) |
| `rest_<donation_id>` | экран «После донации» по этой донации (п. 2) |
| `grp_<code>` | экран группы (п. 3) |

`appointment` и `ref_<code>` — как раньше. Для `grp_<code>` бэк засчитывает нового пользователя как реферала создателя группы — делать ничего не нужно.

## 1. Проактивные пуши — регион донора

Пуши шлёт сам бот (раз в день в 10:00 МСК). От фронта нужен только регион.

- `GET /me` → новое поле `region: {id, name} | null`.
- `PUT /me/region` `{region_id}` → `Me`. 404 — нет такого региона.
- При первой записи регион проставляется автоматически, если пустой.

Что сделать:
- В кабинете (блок личных данных или отдельная строка) — «Мой регион» с выбором из `GET /regions`. Если `region == null` — подсказка «Укажите регион, чтобы узнавать, когда в нём не хватает вашей группы крови». Можно предзаполнить через `GET /regions/locate`.
- Демо-меню (DemoMenuSheet) — три кнопки, чтобы показать пуши на защите:
  - `POST /demo/pushes/interval_open` — «Интервал прошёл»;
  - `POST /demo/pushes/deficit` — «Не хватает группы»;
  - `POST /demo/pushes/rest_day` — «Напомнить про день отдыха» (404 `donation_not_found`, если ещё нет засчитанной донации из приложения — показать тост).

## 2. После донации (ст. 186 ТК РФ)

Как это работает в боте (фронт не трогает): через 3 часа после времени записи бот спрашивает «Сдали кровь?». «Да» засчитывает донацию и присылает список справок и кнопки «Заявление PDF / DOCX», «Заполнить в приложении», «Я уже взял(а) день отдыха». Напоминания о неиспользованном дне: через 14 дней, за 30 и за 7 дней до конца года.
В демо `POST /demo/appointments/{id}/complete` теперь сразу присылает это сообщение. Новая демо-кнопка: `POST /demo/appointments/{id}/ask-donated` — прислать вопрос «Сдали кровь?» сейчас.

Ручки:
- `GET /me/after-donation` → `{after_donation: AfterDonation | null}` — последняя (не демо) донация за год.
- `GET /me/donations/{id}/after` → `AfterDonation` (для `rest_<id>`).
- `AfterDonation`: `donated_on`, `center_name`, `documents: string[]` (готовые строки — выводить списком), `rest_day: {deadline, days_left, used, used_at}`.
- `PUT /me/donations/{id}/rest-day` `{used: bool}` → `AfterDonation`.
- `POST /me/donations/{id}/leave-application?format=pdf|docx` с телом `LeaveApplicationInput` → файл (blob, `Content-Disposition: attachment`).
- `POST /me/donations/{id}/leave-application/send?format=pdf|docx` с тем же телом → 204, бот присылает файл в чат. 502 `bot_send_failed` — тост «Не удалось отправить».
- `LeaveApplicationInput` (всё необязательно, не сохраняется на бэке): `employer_name`, `head_position` (дательный падеж: «Генеральному директору»), `head_name` («Петрову П. П.»), `employee_position`, `rest_date`, `attach_to_vacation`. ФИО бэк берёт из личных данных. Пустые поля в документе — линии для заполнения от руки.
- 422 `validation_error` с `fields.rest_date` — дата не после дня донации или позже `deadline`.

Что сделать:
- Карточка на главной / в кабинете, если `after_donation != null && !rest_day.used`: «Вам положен день отдыха до {deadline}» → открывает экран.
- Экран «После донации»:
  1. Что взять в центре — `documents`.
  2. Форма заявления (поля выше, `rest_date` — календарь от `donated_on + 1` до `deadline`, переключатель «Присоединить к отпуску» скрывает дату).
  3. Кнопки «Прислать в чат» (основная, в MAX надёжнее) и «Скачать PDF/DOCX» (вне MAX или на ПК).
  4. Переключатель / кнопка «Я уже использовал(а) день отдыха».
- Предзаполнение полей работодателя можно держать в `localStorage` (бэк их не хранит намеренно).

## 3. Групповая донация

- `POST /groups` `{center_id, date, donation_type}` → `Group` (201). 422 — дата вне окна 2 месяцев.
- `GET /groups/{code}` → `Group`; 404 `group_not_found`.
- `POST /groups/{code}/join` → `Group`; 409 `group_closed` — дата прошла.
- Создателю бот пишет, когда участник **записался** (`POST /appointments` на центр, день и вид группы), а не когда вступил. Повторный `POST /groups` с теми же центром, датой и видом возвращает ту же группу.
- `GET /groups/my` → `Group[]` (предстоящие, где я участник).
- `Group`: `center {id,name,address,region_id}`, `date`, `donation_type`, `owner_name`, `members[] {name, photo_url, is_owner, is_booked, booked_time}`, `members_count`, `is_member`, `is_owner`, `is_booked`, `is_past`, `free_slots`, `link`, `share_text`.

Что сделать:
- Кнопка «Позвать друзей/коллег» на экране подтверждения записи (BookingConfirmedPage) и на карточке активной записи: `POST /groups` с центром, датой и видом донации этой записи → `shareContent({text: group.share_text, link: group.link})` (уже есть в `bridge/max.ts`, внутри MAX это `shareMaxContent`).
- Экран группы (`grp_<code>`): центр, дата, аватарки участников с галочкой «записан», `free_slots`.
  - не участник → «Присоединиться» (`/join`);
  - участник и `!is_booked` → «Записаться на это время» — сразу на шаг выбора времени: `GET /booking/slots?center_id&donation_type&date` (регион — `center.region_id`, в store записи положить тип/регион/дату/центр);
  - `is_booked` → «Вы записаны» + «Позвать ещё» (share).
- Блок «Мои группы» в кабинете (`GET /groups/my`) — по желанию.

## 4. Карточка «Я сдал кровь» / «Мой уровень»

- `GET /me/share-card?kind=donation|level` → `{title, subtitle, total, level, patients_helped_max, last_donation_on, text, link}`.
- `shareMaxContent` принимает только `{text, link}`, картинку туда не передать. Карточку рисуем на фронте (для превью перед отправкой), а в чат уходят `text` и `link`. `link` — реферальная ссылка пользователя.

Что сделать:
- Кнопка «Поделиться» на LevelCard (`kind=level`) и после засчитанной донации / на экране «После донации» (`kind=donation`).
- BottomSheet с превью карточки (title, subtitle, уровень, «помогли до N людям», если `> 0`) и кнопкой «Отправить в чат» → `shareContent({text, link})`.

## 5. «Вклад» в кабинете

- `GET /me/impact` → `{whole_count, plasma_count, whole_liters, plasma_liters_max, total_liters_max, patients_helped_max, sources[]}`.
- Правила (есть источники в `sources`):
  - кровь: 0,45 л за донацию, «до 3 человек» за донацию;
  - плазма: «до 0,75 л» за донацию. **Людей по плазме не считаем** — источника нет.

Что поменять:
- `content/impact.ts` и `ImpactCard` сейчас считают `whole×3 + plasma×1` — убрать плазму из числа людей, брать `patients_helped_max` с бэка (или `whole×3`).
- Литры: «Вы сдали {whole_liters} л крови» и, если есть плазма, «и до {plasma_liters_max} л плазмы». Писать «до», потому что для плазмы это верхняя граница.
- Пояснение (`IMPACT_EXPLANATION`) оставить про кровь: «Из одной донации крови получают эритроциты, плазму и тромбоциты — она может помочь до трёх людям». Внизу мелко «Источники» — ссылки из `sources` через `openLink`.
