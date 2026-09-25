export interface DonorLevel {
  code: string
  name: string
  threshold: number
}

export const DONOR_LEVELS: DonorLevel[] = [
  { code: 'future', name: 'Будущий донор', threshold: 0 },
  { code: 'newbie', name: 'Новичок', threshold: 1 },
  { code: 'active', name: 'Активный донор', threshold: 5 },
  { code: 'experienced', name: 'Опытный донор', threshold: 10 },
  { code: 'mentor', name: 'Наставник', threshold: 20 },
  { code: 'legend', name: 'Легенда донорства', threshold: 40 },
]

/** Уровни, которые видны на шкале и в шторке (без «Будущего донора»). */
export const SCALE_LEVELS = DONOR_LEVELS.slice(1)

export const getLevelIndex = (total: number): number =>
  DONOR_LEVELS.reduce((index, level, i) => (total >= level.threshold ? i : index), 0)
