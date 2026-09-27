import type { PersonalDataInput } from '@/api/types'
import type { BloodGroup, DonationType } from '@/content/types'
import { addDays, startOfDay } from '@/utils/format'

export const DEMO_USER = {
  firstName: 'Иван',
  lastName: 'Иванов',
  bloodGroup: '2+' as BloodGroup,
  kell: 'K-' as const,
  phenotype: 'CcDee',
  donorCode: '1234-5678',
  referralsCount: 3,
  referralLink: 'https://max.ru/kaplya_bot?startapp=ref_7K2P9Q',
}

/** Как в API: без маски. */
export const DEMO_PERSONAL_DATA: PersonalDataInput = {
  last_name: 'Иванов',
  first_name: 'Иван',
  middle_name: 'Иванович',
  passport_series: '4510',
  passport_number: '123456',
  passport_issued_by: 'ГУ МВД России по г. Москве',
  passport_division_code: '770-001',
  oms_number: '1234567890123456',
  phone: '+79001234567',
  email: 'ivanov@mail.ru',
}

export interface FixtureCenter {
  id: number
  name: string
  address: string
  lat: number
  lon: number
  distanceKm: number
  groupStatus: 'urgent' | 'low' | 'enough'
}

/** Центры Москвы, координаты примерные. В остальных регионах моки создают одну областную станцию. */
export const CENTERS: FixtureCenter[] = [
  { id: 1, name: 'Центр крови ФМБА России', address: 'ул. Поликарпова, 14', lat: 55.7766, lon: 37.5305, distanceKm: 2.3, groupStatus: 'urgent' },
  { id: 2, name: 'ГКБ имени С. П. Боткина', address: '2-й Боткинский проезд, 5', lat: 55.7867, lon: 37.5559, distanceKm: 4.7, groupStatus: 'low' },
  { id: 3, name: 'Центр крови Департамента здравоохранения Москвы', address: 'ул. Бакинская, 31', lat: 55.6152, lon: 37.6691, distanceKm: 6.1, groupStatus: 'enough' },
  { id: 4, name: 'НМИЦ гематологии', address: 'Новый Зыковский проезд, 4', lat: 55.7842, lon: 37.5621, distanceKm: 8.9, groupStatus: 'enough' },
]

/** Название и код субъекта — коды как в frontend/src/assets/geo/russia.topo.json. */
const REGION_LIST: [string, string][] = [
  ['Адыгея', 'RU-AD'],
  ['Алтай', 'RU-AL'],
  ['Алтайский край', 'RU-ALT'],
  ['Амурская область', 'RU-AMU'],
  ['Архангельская область', 'RU-ARK'],
  ['Астраханская область', 'RU-AST'],
  ['Башкортостан', 'RU-BA'],
  ['Белгородская область', 'RU-BEL'],
  ['Брянская область', 'RU-BRY'],
  ['Бурятия', 'RU-BU'],
  ['Владимирская область', 'RU-VLA'],
  ['Волгоградская область', 'RU-VGG'],
  ['Вологодская область', 'RU-VLG'],
  ['Воронежская область', 'RU-VOR'],
  ['ДНР', 'RU-DPR'],
  ['Дагестан', 'RU-DA'],
  ['Еврейская автономная область', 'RU-YEV'],
  ['Забайкальский край', 'RU-ZAB'],
  ['Запорожская область', 'RU-ZAP'],
  ['Ивановская область', 'RU-IVA'],
  ['Ингушетия', 'RU-IN'],
  ['Иркутская область', 'RU-IRK'],
  ['Кабардино-Балкария', 'RU-KB'],
  ['Калининградская область', 'RU-KGD'],
  ['Калмыкия', 'RU-KL'],
  ['Калужская область', 'RU-KLU'],
  ['Камчатский край', 'RU-KAM'],
  ['Карачаево-Черкесия', 'RU-KC'],
  ['Карелия', 'RU-KR'],
  ['Кемеровская область', 'RU-KEM'],
  ['Кировская область', 'RU-KIR'],
  ['Коми', 'RU-KO'],
  ['Костромская область', 'RU-KOS'],
  ['Краснодарский край', 'RU-KDA'],
  ['Красноярский край', 'RU-KYA'],
  ['Крым', 'RU-CR'],
  ['Курганская область', 'RU-KGN'],
  ['Курская область', 'RU-KRS'],
  ['Ленинградская область', 'RU-LEN'],
  ['Липецкая область', 'RU-LIP'],
  ['ЛНР', 'RU-LPR'],
  ['Магаданская область', 'RU-MAG'],
  ['Марий Эл', 'RU-ME'],
  ['Мордовия', 'RU-MO'],
  ['Москва', 'RU-MOW'],
  ['Московская область', 'RU-MOS'],
  ['Мурманская область', 'RU-MUR'],
  ['Ненецкий автономный округ', 'RU-NEN'],
  ['Нижегородская область', 'RU-NIZ'],
  ['Новгородская область', 'RU-NGR'],
  ['Новосибирская область', 'RU-NVS'],
  ['Омская область', 'RU-OMS'],
  ['Оренбургская область', 'RU-ORE'],
  ['Орловская область', 'RU-ORL'],
  ['Пензенская область', 'RU-PNZ'],
  ['Пермский край', 'RU-PER'],
  ['Приморский край', 'RU-PRI'],
  ['Псковская область', 'RU-PSK'],
  ['Ростовская область', 'RU-ROS'],
  ['Рязанская область', 'RU-RYA'],
  ['Самарская область', 'RU-SAM'],
  ['Санкт-Петербург', 'RU-SPE'],
  ['Саратовская область', 'RU-SAR'],
  ['Саха (Якутия)', 'RU-SA'],
  ['Сахалинская область', 'RU-SAK'],
  ['Свердловская область', 'RU-SVE'],
  ['Севастополь', 'RU-SEV'],
  ['Северная Осетия', 'RU-SE'],
  ['Смоленская область', 'RU-SMO'],
  ['Ставропольский край', 'RU-STA'],
  ['Тамбовская область', 'RU-TAM'],
  ['Татарстан', 'RU-TA'],
  ['Тверская область', 'RU-TVE'],
  ['Томская область', 'RU-TOM'],
  ['Тульская область', 'RU-TUL'],
  ['Тыва', 'RU-TY'],
  ['Тюменская область', 'RU-TYU'],
  ['Удмуртия', 'RU-UD'],
  ['Ульяновская область', 'RU-ULY'],
  ['Хабаровский край', 'RU-KHA'],
  ['Хакасия', 'RU-KK'],
  ['Ханты-Мансийский автономный округ', 'RU-KHM'],
  ['Херсонская область', 'RU-KHE'],
  ['Челябинская область', 'RU-CHE'],
  ['Чечня', 'RU-CE'],
  ['Чувашия', 'RU-CU'],
  ['Чукотский автономный округ', 'RU-CHU'],
  ['Ямало-Ненецкий автономный округ', 'RU-YAN'],
  ['Ярославская область', 'RU-YAR'],
]

const REGIONS_WITHOUT_CENTERS = new Set(['Ненецкий автономный округ', 'Чукотский автономный округ', 'Херсонская область'])

export interface FixtureRegion {
  id: number
  code: string
  name: string
  hasCenters: boolean
}

export const REGIONS: FixtureRegion[] = REGION_LIST.map(([name, code], index) => ({
  id: index + 1,
  code,
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
