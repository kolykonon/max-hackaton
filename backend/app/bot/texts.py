"""Тексты бота. Копируются дословно из docs/**.

TODO: заменить заглушки на реальные тексты из:
  - docs/0.bot/start_message.md
  - docs/appointment_confirmed.md
  - docs/main_screen.md (напоминание)
"""

# docs/0.bot/start_message.md
START_MESSAGE = (
    "Привет! Это «Капля» — сервис донорства крови.\n\n"
    "Открой приложение, чтобы записаться на донацию."
)
START_BUTTON = "Открыть приложение"

# Ответ на любой другой текст
FALLBACK_MESSAGE = (
    "Я понимаю только команду /start.\n\n"
    "Открой приложение, чтобы записаться на донацию."
)

# docs/appointment_confirmed.md
CONFIRMED_MESSAGE = "Вы записаны на донацию ✅"
CONFIRMED_BUTTON = "Открыть запись"

# docs/main_screen.md — напоминание за 24 часа
REMINDER_MESSAGE = "Напоминаем: завтра у вас донация."
REMINDER_BUTTON = "Открыть запись"
