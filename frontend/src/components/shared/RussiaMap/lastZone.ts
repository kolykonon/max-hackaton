// Последний регион, выбранный на экране «Карта». Им же открывается превью на главной
const KEY = 'kaplya:map-zone'
export const DEFAULT_ZONE = 'RU-MOW'

export const getLastZone = (): string | null => {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export const setLastZone = (code: string): void => {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    // приватный режим — просто не запоминаем
  }
}

/** Москва маленькая — показываем её вместе с областью. */
export const zoneFitCodes = (code: string): string[] => (code === 'RU-MOW' ? ['RU-MOW', 'RU-MOS'] : [code])
