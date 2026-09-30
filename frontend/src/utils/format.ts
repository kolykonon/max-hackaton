const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const MONTHS_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const WEEKDAYS_FULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

/** «14 октября» */
export const formatDayMonth = (date: Date): string =>
  `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`

/** «14 октября 2027» — для сроков дальше текущего года */
export const formatDayMonthYear = (date: Date): string => `${formatDayMonth(date)} ${date.getFullYear()}`

/** «Октябрь 2026» */
export const formatMonthYear = (date: Date): string =>
  `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`

/** «14 октября, вторник» */
export const formatDayMonthWeekday = (date: Date): string =>
  `${formatDayMonth(date)}, ${WEEKDAYS_FULL[date.getDay()]}`

/** «14 октября, вт, 09:30» — короткий вариант для карточек. Без времени (цельная кровь) — только день. */
export const formatDateTimeShort = (date: Date, time?: string | null): string =>
  [formatDayMonth(date), WEEKDAYS_SHORT[date.getDay()], time].filter(Boolean).join(', ')

/** «14 октября, вторник, 09:30» — полный вариант. Без времени (цельная кровь) — только день. */
export const formatDateTimeFull = (date: Date, time?: string | null): string =>
  [formatDayMonthWeekday(date), time].filter(Boolean).join(', ')

/** Время записи показываем только у плазмы: на цельную кровь приходят в любое время работы центра. */
export const visibleTime = (appointment: { donation_type: string; local_time: string }): string | null =>
  appointment.donation_type === 'plasma' ? appointment.local_time : null

/** Склонение: plural(5, ['донация', 'донации', 'донаций']) → «донаций» */
export const plural = (count: number, forms: [string, string, string]): string => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export const DONATION_FORMS: [string, string, string] = ['донация', 'донации', 'донаций']

/** «12 донаций» */
export const formatDonations = (count: number): string => `${count} ${plural(count, DONATION_FORMS)}`

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** «2026-10-14» → локальная дата без сдвига часового пояса. */
export const parseISODate = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Локальная дата → «2026-10-14». */
export const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** «4 года 2 месяца» */
export const formatYearsMonths = (years: number, months: number): string => {
  const parts = []
  if (years > 0) parts.push(`${years} ${plural(years, ['год', 'года', 'лет'])}`)
  if (months > 0 || years === 0) parts.push(`${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}`)
  return parts.join(' ')
}
