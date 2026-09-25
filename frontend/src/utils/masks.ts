// Простые маски ввода. Когда подключим react-imask (ТЗ §2), заменить на него.

const onlyDigits = (value: string): string => value.replace(/\D/g, '')

/** Заполняет шаблон, где «0» — цифра: applyPattern('7700', '000-000') → «770-0». */
const applyPattern = (value: string, pattern: string): string => {
  const digits = onlyDigits(value)
  let result = ''
  let index = 0
  for (const char of pattern) {
    if (index >= digits.length) break
    if (char === '0') {
      result += digits[index]
      index += 1
    } else {
      result += char
    }
  }
  return result
}

export const MASKS = {
  series: (value: string) => onlyDigits(value).slice(0, 4),
  number: (value: string) => onlyDigits(value).slice(0, 6),
  divisionCode: (value: string) => applyPattern(value, '000-000'),
  oms: (value: string) => applyPattern(value, '0000 0000 0000 0000'),
  phone: (value: string) => {
    const digits = onlyDigits(value).replace(/^[78]/, '')
    return digits ? applyPattern(digits, '+7 (000) 000-00-00') : ''
  },
}

export const countDigits = (value: string): number => onlyDigits(value).length
