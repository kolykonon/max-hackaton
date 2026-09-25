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

/** «Октябрь 2026» */
export const formatMonthYear = (date: Date): string =>
  `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`

/** «14 октября, вторник» */
export const formatDayMonthWeekday = (date: Date): string =>
  `${formatDayMonth(date)}, ${WEEKDAYS_FULL[date.getDay()]}`

/** «14 октября, вт, 09:30» — короткий вариант для карточек */
export const formatDateTimeShort = (date: Date, time: string): string =>
  `${formatDayMonth(date)}, ${WEEKDAYS_SHORT[date.getDay()]}, ${time}`

/** «14 октября, вторник, 09:30» — полный вариант */
export const formatDateTimeFull = (date: Date, time: string): string =>
  `${formatDayMonthWeekday(date)}, ${time}`

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
