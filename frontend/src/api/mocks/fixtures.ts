import type { PersonalDataFields } from '@/api/types'
import type { BloodGroup, DonationType } from '@/content/types'
import { addDays, startOfDay } from '@/utils/format'

export const DEMO_USER = {
  firstName: 'Иван',
  lastName: 'Иванов',
  bloodGroup: '2+' as BloodGroup,
  kell: 'K-',
  phenotype: 'CcDee',
  donorCode: '1234-5678',
  referralsCount: 3,
  referralLink: 'https://max.ru/kaplya_bot?startapp=ref_7K2P9Q',
}

export const DEMO_PERSONAL_DATA: PersonalDataFields = {
  last_name: 'Иванов',
  first_name: 'Иван',
  middle_name: 'Иванович',
  passport_series: '4510',
  passport_number: '123456',
  passport_issued_by: 'ГУ МВД России по г. Москве',
  passport_division_code: '770-001',
  oms_number: '1234 5678 9012 3456',
  phone: '+7 (900) 123-45-67',
  email: 'ivanov@mail.ru',
}

export interface FixtureCenter {
  id: number
  name: string
  address: string
  distanceKm: number
  groupStatus: 'urgent' | 'low' | 'enough'
}

/** Центры Москвы. В остальных регионах моки создают одну областную станцию. */
export const CENTERS: FixtureCenter[] = [
  { id: 1, name: 'Центр крови ФМБА России', address: 'ул. Поликарпова, 14', distanceKm: 2.3, groupStatus: 'urgent' },
  { id: 2, name: 'ГКБ имени С. П. Боткина', address: '2-й Боткинский проезд, 5', distanceKm: 4.7, groupStatus: 'low' },
  { id: 3, name: 'Центр крови Департамента здравоохранения Москвы', address: 'ул. Бакинская, 31', distanceKm: 6.1, groupStatus: 'enough' },
  { id: 4, name: 'НМИЦ гематологии', address: 'Новый Зыковский проезд, 4', distanceKm: 8.9, groupStatus: 'enough' },
]

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

export interface FixtureRegion {
  id: number
  name: string
  hasCenters: boolean
}

export const REGIONS: FixtureRegion[] = REGION_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  hasCenters: !REGIONS_WITHOUT_CENTERS.has(name),
}))

/** 10 донаций крови + 2 плазмы за ~3 года, последняя — кровь 45 дней назад (ТЗ §5.4). */
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

export const DONATIONS = DONATION_PLAN.map(([type, daysAgo, centerName], index) => ({
  id: index + 1,
  type,
  date: addDays(startOfDay(new Date()), -daysAgo),
  centerName,
}))
