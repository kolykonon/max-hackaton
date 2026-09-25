// Бизнес-логика из ТЗ §5 для моков. На бэке она своя, с тестами, — здесь только чтобы фронт вёл себя правдоподобно.

import type { DonationType } from '@/content/types'
import { addDays, startOfDay } from '@/utils/format'

import type { Eligibility, Progress } from '../types'
import { toISO, type MockDonation } from './db'

const LEVELS = [
  { code: 'future', name: 'Будущий донор', threshold: 0 },
  { code: 'newbie', name: 'Новичок', threshold: 1 },
  { code: 'active', name: 'Активный донор', threshold: 5 },
  { code: 'experienced', name: 'Опытный донор', threshold: 10 },
  { code: 'mentor', name: 'Наставник', threshold: 20 },
  { code: 'legend', name: 'Легенда донорства', threshold: 40 },
]

const last = (donations: MockDonation[], type: DonationType): Date | null => {
  const dates = donations.filter((d) => d.type === type).map((d) => new Date(d.date).getTime())
  return dates.length ? new Date(Math.max(...dates)) : null
}

const maxDate = (...dates: (Date | null)[]): Date =>
  new Date(Math.max(...dates.filter((d): d is Date => d !== null).map((d) => d.getTime())))

/** §5.1: next_whole = max(today, last_whole + 60, last_plasma + 30); next_plasma = max(today, last_plasma + 14, last_whole + 30). */
export const getNextAllowed = (donations: MockDonation[]): Record<DonationType, Date> => {
  const today = startOfDay(new Date())
  const lastWhole = last(donations, 'whole_blood')
  const lastPlasma = last(donations, 'plasma')
  return {
    whole_blood: maxDate(today, lastWhole && addDays(lastWhole, 60), lastPlasma && addDays(lastPlasma, 30)),
    plasma: maxDate(today, lastPlasma && addDays(lastPlasma, 14), lastWhole && addDays(lastWhole, 30)),
  }
}

export const getEligibility = (donations: MockDonation[]): Eligibility => {
  const today = startOfDay(new Date()).getTime()
  const next = getNextAllowed(donations)
  return {
    next_allowed: { whole_blood: toISO(next.whole_blood), plasma: toISO(next.plasma) },
    interval_active: { whole_blood: next.whole_blood.getTime() > today, plasma: next.plasma.getTime() > today },
  }
}

const isAchieved = (x: number, y: number) => x >= 40 || y >= 60 || (x >= 25 && x + y >= 40) || x + y >= 60

/** §5.3: срок до звания — минимум из четырёх путей, считаем от ближайшей разрешённой даты. */
const getEtaDate = (x: number, y: number, next: Record<DonationType, Date>): Date => {
  const candidates: Date[] = []
  if (x < 40) candidates.push(addDays(next.whole_blood, 60 * (40 - x - 1)))
  if (y < 60) candidates.push(addDays(next.plasma, 14 * (60 - y - 1)))
  if (x + y < 60) candidates.push(addDays(next.plasma, 14 * (60 - x - y - 1)))

  // Чередование: кровь → плазма через 30 → кровь через 30, пока X < 25, потом плазма раз в 14 до X+Y = 40
  let date = next.whole_blood
  let whole = x
  let plasma = y
  let nextIsWhole = true
  while (!(whole >= 25 && whole + plasma >= 40)) {
    if (whole < 25) {
      if (nextIsWhole) whole += 1
      else plasma += 1
      nextIsWhole = !nextIsWhole
      if (!(whole >= 25 && whole + plasma >= 40)) date = addDays(date, 30)
    } else {
      plasma += 1
      if (whole + plasma < 40) date = addDays(date, 14)
    }
  }
  candidates.push(date)

  return new Date(Math.min(...candidates.map((d) => d.getTime())))
}

export const getProgress = (donations: MockDonation[]): Progress => {
  const x = donations.filter((d) => d.type === 'whole_blood').length
  const y = donations.length - x
  const total = x + y
  const levelIndex = LEVELS.reduce((index, level, i) => (total >= level.threshold ? i : index), 0)
  const level = LEVELS[levelIndex]
  const nextLevel = LEVELS[levelIndex + 1]
  const achieved = isAchieved(x, y)

  let eta: Progress['honorary']['eta'] = null
  if (!achieved) {
    const today = startOfDay(new Date())
    const etaDate = getEtaDate(x, y, getNextAllowed(donations))
    const totalMonths = (etaDate.getFullYear() - today.getFullYear()) * 12 + etaDate.getMonth() - today.getMonth()
    eta = { date: toISO(etaDate), years: Math.floor(totalMonths / 12), months: totalMonths % 12 }
  }

  return {
    total,
    level: {
      code: level.code,
      name: level.name,
      threshold: level.threshold,
      next: nextLevel ? { name: nextLevel.name, threshold: nextLevel.threshold, remaining: nextLevel.threshold - total } : null,
      is_max: !nextLevel,
    },
    honorary: {
      whole: { count: x, goal: 40 },
      plasma: { count: y, goal: 60 },
      mixed: { count: total, goal: x >= 25 ? 40 : 60, whole_needed_for_40: Math.max(0, 25 - x) },
      achieved,
      eta,
    },
  }
}
