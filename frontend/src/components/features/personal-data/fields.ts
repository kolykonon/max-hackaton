import type { PersonalData, PersonalDataFieldName, PersonalDataInput } from '@/api/types'
import { countDigits, MASK_PATTERNS, MASKS } from '@/utils/masks'

export type FieldKey = PersonalDataFieldName

/** Значения формы: всегда строки, с маской для показа. */
export type PersonalDataValues = Record<FieldKey, string>
export type FieldErrors = Partial<Record<FieldKey, string>>

interface FieldConfig {
  label: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  placeholder?: string
  /** Шаблон IMask. */
  mask?: string
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
    mask: MASK_PATTERNS.series,
    validate: (value) => (countDigits(value) === 4 ? null : 'Серия — 4 цифры'),
  },
  passport_number: {
    label: 'Номер',
    inputMode: 'numeric',
    placeholder: '000000',
    mask: MASK_PATTERNS.number,
    validate: (value) => (countDigits(value) === 6 ? null : 'Номер — 6 цифр'),
  },
  passport_issued_by: { label: 'Кем выдан', validate: required('Укажите, кем выдан паспорт') },
  passport_division_code: {
    label: 'Код подразделения',
    inputMode: 'numeric',
    placeholder: '000-000',
    mask: MASK_PATTERNS.divisionCode,
    validate: (value) => (countDigits(value) === 6 ? null : 'Код подразделения — 6 цифр'),
  },
  oms_number: {
    label: 'Номер полиса',
    inputMode: 'numeric',
    placeholder: '0000 0000 0000 0000',
    mask: MASK_PATTERNS.oms,
    validate: (value) => (countDigits(value) === 16 ? null : 'Номер полиса — 16 цифр'),
  },
  phone: {
    label: 'Телефон',
    inputMode: 'tel',
    placeholder: '+7 (000) 000-00-00',
    mask: MASK_PATTERNS.phone,
    validate: (value) => (countDigits(value) === 11 ? null : 'Введите номер телефона полностью'),
  },
  email: {
    label: 'Эл. почта',
    inputMode: 'email',
    placeholder: 'mail@example.ru',
    validate: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Проверьте адрес почты'),
  },
}

/** Разделы настроек: каждый сохраняется отдельно. */
export type SectionKey = 'passport' | 'oms' | 'contacts'

export const SECTIONS: Record<SectionKey, { title: string; fields: FieldKey[] }> = {
  passport: {
    title: 'Паспорт РФ',
    fields: [
      'last_name',
      'first_name',
      'middle_name',
      'passport_series',
      'passport_number',
      'passport_issued_by',
      'passport_division_code',
    ],
  },
  oms: { title: 'Полис ОМС', fields: ['oms_number'] },
  contacts: { title: 'Контакты', fields: ['phone', 'email'] },
}

export const FIELD_ORDER: FieldKey[] = Object.values(SECTIONS).flatMap((section) => section.fields)

export const sectionOf = (key: FieldKey): SectionKey =>
  (Object.keys(SECTIONS) as SectionKey[]).find((section) => SECTIONS[section].fields.includes(key)) ?? 'passport'

/** Раздел настроек, куда вернуться из записи: /settings?section=oms&return=/booking/check */
export const settingsPath = (section: SectionKey, returnTo?: string) =>
  `/settings?${new URLSearchParams({ section, ...(returnTo && { return: returnTo }) })}`

export const validateAll = (data: PersonalDataValues, keys: FieldKey[] = FIELD_ORDER): FieldErrors =>
  keys.reduce<FieldErrors>((errors, key) => {
    const error = FIELDS[key].validate?.(data[key])
    if (error) errors[key] = error
    return errors
  }, {})

const digits = (value: string) => value.replace(/\D/g, '')

/** Ответ API → значения формы: null становится пустой строкой, номера получают маску. */
export const fromApi = (data: PersonalData): PersonalDataValues => {
  const values = Object.fromEntries(FIELD_ORDER.map((key) => [key, data[key] ?? ''])) as PersonalDataValues
  return {
    ...values,
    passport_division_code: MASKS.divisionCode(values.passport_division_code),
    oms_number: MASKS.oms(values.oms_number),
    phone: MASKS.phone(values.phone),
  }
}

/** Значения формы → тело PUT: без маски, только поля раздела — остальные на бэке не меняются. */
export const toApi = (values: PersonalDataValues, keys: FieldKey[] = FIELD_ORDER): PersonalDataInput => {
  const all: Required<PersonalDataInput> = {
    last_name: values.last_name.trim(),
    first_name: values.first_name.trim(),
    middle_name: values.middle_name.trim() || null,
    passport_series: digits(values.passport_series),
    passport_number: digits(values.passport_number),
    passport_issued_by: values.passport_issued_by.trim(),
    passport_division_code: MASKS.divisionCode(values.passport_division_code),
    oms_number: digits(values.oms_number),
    phone: `+7${digits(values.phone).slice(-10)}`,
    email: values.email.trim(),
  }
  return Object.fromEntries(keys.map((key) => [key, all[key]]))
}
