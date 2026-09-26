import IMask from 'imask'

// Маски на IMask (ТЗ §2): «0» — цифра, {7} — фиксированный символ, который входит в значение.
export const MASK_PATTERNS = {
  series: '0000',
  number: '000000',
  divisionCode: '000-000',
  oms: '0000 0000 0000 0000',
  phone: '+{7} (000) 000-00-00',
} as const

const format = (pattern: string) => (value: string) => IMask.pipe(value, { mask: pattern })

/** Форматирование для показа: MASKS.phone('+79001234567') → «+7 (900) 123-45-67». */
export const MASKS = {
  series: format(MASK_PATTERNS.series),
  number: format(MASK_PATTERNS.number),
  divisionCode: format(MASK_PATTERNS.divisionCode),
  oms: format(MASK_PATTERNS.oms),
  phone: format(MASK_PATTERNS.phone),
}

export const countDigits = (value: string): number => value.replace(/\D/g, '').length
