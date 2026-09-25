import { addDays, startOfDay } from '@/utils/format'

import type { BloodGroup, DonationType, StockStatus } from './types'

// Все данные демо. Когда появится API, заменить на хуки TanStack Query.

export const TODAY = startOfDay(new Date())

/** Ближайшая дата, когда можно сдать цельную кровь (интервал после прошлой донации). */
export const NEXT_ALLOWED_WHOLE = addDays(TODAY, 17)

export const DEMO_USER = {
  firstName: 'Иван',
  lastName: 'Иванов',
  photoUrl: '',
  bloodGroup: '2+' as BloodGroup,
  bloodGroupLabel: 'A(II)',
  rhesus: 'Rh+',
  kell: 'K−',
  phenotype: 'CcDee',
  donorCode: '1234-5678',
  referralsCount: 3,
  referralLink: 'https://max.ru/kaplya_bot?startapp=ref_7K2P9Q',
}

export interface PersonalData {
  lastName: string
  firstName: string
  middleName: string
  passportSeries: string
  passportNumber: string
  passportIssuedBy: string
  passportDivisionCode: string
  omsNumber: string
  phone: string
  email: string
}

export const DEMO_PERSONAL_DATA: PersonalData = {
  lastName: 'Иванов',
  firstName: 'Иван',
  middleName: 'Иванович',
  passportSeries: '4510',
  passportNumber: '123456',
  passportIssuedBy: 'ГУ МВД России по г. Москве',
  passportDivisionCode: '770-001',
  omsNumber: '1234 5678 9012 3456',
  phone: '+7 (900) 123-45-67',
  email: 'ivanov@mail.ru',
}

export const DEMO_PROGRESS = {
  whole: 10,
  plasma: 2,
  etaText: '4 года 2 месяца',
}

export interface Center {
  id: number
  name: string
  address: string
  distanceKm: number
  freeSlots: number
  groupStatus: StockStatus
  /** Положение метки на демо-карте, в процентах. */
  mapX: number
  mapY: number
}

export const CENTERS: Center[] = [
  { id: 1, name: 'Центр крови ФМБА России', address: 'ул. Поликарпова, 14', distanceKm: 2.3, freeSlots: 12, groupStatus: 'urgent', mapX: 31, mapY: 28 },
  { id: 2, name: 'ГКБ имени С. П. Боткина', address: '2-й Боткинский проезд, 5', distanceKm: 4.7, freeSlots: 8, groupStatus: 'low', mapX: 70, mapY: 32 },
  { id: 3, name: 'Центр крови Департамента здравоохранения Москвы', address: 'ул. Бакинская, 31', distanceKm: 6.1, freeSlots: 10, groupStatus: 'enough', mapX: 71, mapY: 76 },
  { id: 4, name: 'НМИЦ гематологии', address: 'Новый Зыковский проезд, 4', distanceKm: 8.9, freeSlots: 6, groupStatus: 'enough', mapX: 24, mapY: 78 },
]

export const DEMO_APPOINTMENT = {
  date: addDays(NEXT_ALLOWED_WHOLE, 2),
  time: '09:30',
  donationType: 'whole_blood' as DonationType,
  center: CENTERS[0],
}

export interface Region {
  id: number
  name: string
  hasCenters: boolean
}

const REGION_NAMES = [
  'Адыгея', 'Алтай', 'Алтайский край', 'Амурская область', 'Архангельская область', 'Астраханская область',
  'Башкортостан', 'Белгородская область', 'Брянская область', 'Бурятия', 'Владимирская область',
  'Волгоградская область', 'Вологодская область', 'Воронежская область', 'ДНР', 'Дагестан',
  'Еврейская автономная область', 'Забайкальский край', 'Запорожская область', 'Ивановская область', 'Ингушетия',
  'Иркутская область', 'Кабардино-Балкария', 'Калининградская область', 'Калмыкия', 'Калужская область',
  'Камчатский край', 'Карачаево-Черкесия', 'Карелия', 'Кемеровская область', 'Кировская область', 'Коми',
  'Костромская область', 'Краснодарский край', 'Красноярский край', 'Крым', 'Курганская область',
  'Курская область', 'Ленинградская область', 'Липецкая область', 'ЛНР', 'Магаданская область', 'Марий Эл',
  'Мордовия', 'Москва', 'Московская область', 'Мурманская область', 'Ненецкий автономный округ',
  'Нижегородская область', 'Новгородская область', 'Новосибирская область', 'Омская область',
  'Оренбургская область', 'Орловская область', 'Пензенская область', 'Пермский край', 'Приморский край',
  'Псковская область', 'Ростовская область', 'Рязанская область', 'Самарская область', 'Санкт-Петербург',
  'Саратовская область', 'Саха (Якутия)', 'Сахалинская область', 'Свердловская область', 'Севастополь',
  'Северная Осетия', 'Смоленская область', 'Ставропольский край', 'Тамбовская область', 'Татарстан',
  'Тверская область', 'Томская область', 'Тульская область', 'Тыва', 'Тюменская область', 'Удмуртия',
  'Ульяновская область', 'Хабаровский край', 'Хакасия', 'Ханты-Мансийский автономный округ', 'Херсонская область',
  'Челябинская область', 'Чечня', 'Чувашия', 'Чукотский автономный округ', 'Ямало-Ненецкий автономный округ',
  'Ярославская область',
]

const REGIONS_WITHOUT_CENTERS = new Set(['Ненецкий автономный округ', 'Чукотский автономный округ', 'Херсонская область'])

export const REGIONS: Region[] = REGION_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  hasCenters: !REGIONS_WITHOUT_CENTERS.has(name),
}))

export const DEMO_REGION = REGIONS.find((region) => region.name === 'Москва')!

export interface Slot {
  id: number
  time: string
  isFree: boolean
}

export interface SlotGroup {
  period: string
  slots: Slot[]
}

const BUSY_SLOTS = new Set(['08:30', '10:15', '12:30', '13:15'])

const makeSlots = (fromHour: number, toHour: number, startId: number): Slot[] => {
  const slots: Slot[] = []
  for (let hour = fromHour; hour < toHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      slots.push({ id: startId + slots.length, time, isFree: !BUSY_SLOTS.has(time) })
    }
  }
  return slots
}

export const SLOT_GROUPS: SlotGroup[] = [
  { period: 'Утро', slots: makeSlots(8, 12, 1) },
  { period: 'День', slots: makeSlots(12, 14, 100) },
]

/** Демо-правило доступности дня: после интервала, в пределах 2 месяцев, кроме воскресений и пары занятых дней. */
export const isDayAvailable = (date: Date): boolean => {
  const fullyBooked = [addDays(NEXT_ALLOWED_WHOLE, 5), addDays(NEXT_ALLOWED_WHOLE, 12)]
  if (date < NEXT_ALLOWED_WHOLE || date > addDays(TODAY, 61)) return false
  if (date.getDay() === 0) return false
  return !fullyBooked.some((day) => day.getTime() === date.getTime())
}

export interface Donation {
  id: number
  type: DonationType
  date: Date
  centerName: string
}

const DONATION_PLAN: [DonationType, number, string][] = [
  ['whole_blood', 45, 'Центр крови ФМБА России'],
  ['plasma', 118, 'ГКБ им. С. П. Боткина'],
  ['whole_blood', 180, 'Городская станция переливания крови'],
  ['whole_blood', 290, 'Центр крови ФМБА России'],
  ['plasma', 350, 'ГКБ им. С. П. Боткина'],
  ['whole_blood', 420, 'Центр крови ФМБА России'],
  ['whole_blood', 500, 'НМИЦ гематологии'],
  ['whole_blood', 600, 'Центр крови ФМБА России'],
  ['whole_blood', 700, 'Городская станция переливания крови'],
  ['whole_blood', 820, 'Центр крови ФМБА России'],
  ['whole_blood', 930, 'НМИЦ гематологии'],
  ['whole_blood', 1050, 'Центр крови ФМБА России'],
]

export const DONATIONS: Donation[] = DONATION_PLAN.map(([type, daysAgo, centerName], index) => ({
  id: index + 1,
  type,
  date: addDays(TODAY, -daysAgo),
  centerName,
}))

export const BLOOD_GROUPS: BloodGroup[] = ['1+', '1-', '2+', '2-', '3+', '3-', '4+', '4-']

export const BLOOD_GROUP_NAMES: Record<BloodGroup, string> = {
  '1+': 'O(I) положительная',
  '1-': 'O(I) отрицательная',
  '2+': 'A(II) положительная',
  '2-': 'A(II) отрицательная',
  '3+': 'B(III) положительная',
  '3-': 'B(III) отрицательная',
  '4+': 'AB(IV) положительная',
  '4-': 'AB(IV) отрицательная',
}

export interface MapZone {
  code: string
  name: string
  updatedAt: Date
  statuses: Record<BloodGroup, StockStatus>
}

export const MAP_ZONES: MapZone[] = [
  {
    code: 'RU-MOW',
    name: 'Москва',
    updatedAt: addDays(TODAY, -1),
    statuses: { '1+': 'enough', '1-': 'low', '2+': 'urgent', '2-': 'low', '3+': 'enough', '3-': 'low', '4+': 'urgent', '4-': 'none' },
  },
  {
    code: 'RU-MOS',
    name: 'Московская область',
    updatedAt: addDays(TODAY, -1),
    statuses: { '1+': 'low', '1-': 'urgent', '2+': 'enough', '2-': 'enough', '3+': 'low', '3-': 'urgent', '4+': 'enough', '4-': 'low' },
  },
  {
    code: 'RU-NEN',
    name: 'Ненецкий автономный округ',
    updatedAt: addDays(TODAY, -1),
    statuses: { '1+': 'none', '1-': 'none', '2+': 'none', '2-': 'none', '3+': 'none', '3-': 'none', '4+': 'none', '4-': 'none' },
  },
]
