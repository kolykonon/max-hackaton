import type { PersonalDataFields as PersonalData } from '@/api/types'
import { countDigits, MASKS } from '@/utils/masks'

export type FieldKey = keyof PersonalData
export type FieldErrors = Partial<Record<FieldKey, string>>

interface FieldConfig {
  label: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  placeholder?: string
  mask?: (value: string) => string
  /** Возвращает текст ошибки или null. Правила и тексты — из confirming.md. */
  validate?: (value: string) => string | null
  optional?: boolean
}

const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё]+(-[A-Za-zА-Яа-яЁё]+)*$/

const required = (message: string) => (value: string) => (value.trim() ? null : message)

export const FIELDS: Record<FieldKey, FieldConfig> = {
  last_name: {
    label: 'Фамилия',
    validate: (value) => (NAME_PATTERN.test(value.trim()) ? null : 'Введите фамилию'),
  },
  first_name: {
    label: 'Имя',
    validate: (value) => (NAME_PATTERN.test(value.trim()) ? null : 'Введите имя'),
  },
  middle_name: { label: 'Отчество', optional: true },
  passport_series: {
    label: 'Серия',
    inputMode: 'numeric',
    placeholder: '0000',
    mask: MASKS.series,
    validate: (value) => (countDigits(value) === 4 ? null : 'Серия — 4 цифры'),
  },
  passport_number: {
    label: 'Номер',
    inputMode: 'numeric',
    placeholder: '000000',
    mask: MASKS.number,
    validate: (value) => (countDigits(value) === 6 ? null : 'Номер — 6 цифр'),
  },
  passport_issued_by: { label: 'Кем выдан', validate: required('Укажите, кем выдан паспорт') },
  passport_division_code: {
    label: 'Код подразделения',
    inputMode: 'numeric',
    placeholder: '000-000',
    mask: MASKS.divisionCode,
    validate: (value) => (countDigits(value) === 6 ? null : 'Код подразделения — 6 цифр'),
  },
  oms_number: {
    label: 'Номер полиса',
    inputMode: 'numeric',
    placeholder: '0000 0000 0000 0000',
    mask: MASKS.oms,
    validate: (value) => (countDigits(value) === 16 ? null : 'Номер полиса — 16 цифр'),
  },
  phone: {
    label: 'Телефон',
    inputMode: 'tel',
    placeholder: '+7 (000) 000-00-00',
    mask: MASKS.phone,
    validate: (value) => (countDigits(value) === 11 ? null : 'Введите номер телефона полностью'),
  },
  email: {
    label: 'Эл. почта',
    inputMode: 'email',
    placeholder: 'mail@example.ru',
    validate: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Проверьте адрес почты'),
  },
}

export const FIELD_ORDER: FieldKey[] = [
  'last_name',
  'first_name',
  'middle_name',
  'passport_series',
  'passport_number',
  'passport_issued_by',
  'passport_division_code',
  'oms_number',
  'phone',
  'email',
]

export const validateAll = (data: PersonalData): FieldErrors =>
  FIELD_ORDER.reduce<FieldErrors>((errors, key) => {
    const error = FIELDS[key].validate?.(data[key])
    if (error) errors[key] = error
    return errors
  }, {})

export const isComplete = (data: PersonalData): boolean =>
  FIELD_ORDER.every((key) => FIELDS[key].optional || data[key].trim())
