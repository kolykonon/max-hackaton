import type { DonationType } from '@/content/types'
import { toISODate } from '@/utils/format'

import type { PersonalDataInput } from '../types'
import { CENTERS, DEMO_PERSONAL_DATA, DONATIONS, REGIONS } from './fixtures'

export interface MockDonation {
  id: number
  type: DonationType
  date: string
  centerName: string
  /** Засчитана через приложение (демо-кнопка) — для неё есть «После донации», как на бэке у не-демо донаций. */
  fromApp?: boolean
  /** Когда отметили, что день отдыха использован. */
  restUsedAt?: string | null
}

export interface MockAppointment {
  id: number
  slotId: number
  donationType: DonationType
  status: 'active' | 'cancelled' | 'rescheduled' | 'completed'
}

/** Групповая донация: свою группу пользователь создаёт, в демо-группу — вступает. */
export interface MockGroup {
  code: string
  centerId: number
  date: string
  donationType: DonationType
  isOwner: boolean
  isMember: boolean
}

interface MockState {
  onboardingCompleted: boolean
  personalData: PersonalDataInput
  isDemoData: boolean
  regionId: number | null
  donations: MockDonation[]
  appointments: MockAppointment[]
  groups: MockGroup[]
  nextId: number
}

const STORAGE_KEY = 'kaplya:mock-db:v2'

export const toISO = toISODate

const initialState = (): MockState => ({
  onboardingCompleted: false,
  personalData: { ...DEMO_PERSONAL_DATA },
  isDemoData: true,
  regionId: null,
  donations: DONATIONS.map((d) => ({ id: d.id, type: d.type, date: d.date.toISOString(), centerName: d.centerName })),
  appointments: [],
  groups: [],
  nextId: 1000,
})

const load = (): MockState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw) as MockState
      // Сохранено до появления групп
      state.groups ??= []
      state.regionId ??= null
      return state
    }
  } catch {
    // повреждённое состояние — начинаем заново
  }
  return initialState()
}

export const db = {
  state: load(),
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
  },
  reset() {
    const onboardingCompleted = this.state.onboardingCompleted
    this.state = { ...initialState(), onboardingCompleted }
    this.save()
  },
  nextId() {
    this.state.nextId += 1
    return this.state.nextId
  },
  activeAppointment() {
    return this.state.appointments.find((a) => a.status === 'active') ?? null
  },
}


export const MOSCOW_ID = REGIONS.find((r) => r.name === 'Москва')!.id

const regionCentroids = new Map<string, [number, number]>()

export const setRegionCentroids = (centroids: Map<string, [number, number]>) => {
  centroids.forEach((point, code) => regionCentroids.set(code, point))
}

export interface MockCenter {
  id: number
  regionId: number
  name: string
  address: string
  lat: number
  lon: number
  distanceKm: number
  groupStatus: 'urgent' | 'low' | 'enough'
}

/** В Москве — центры из демо, в остальных регионах с центрами — одна областная станция. */
export const centersOf = (regionId: number): MockCenter[] => {
  if (regionId === MOSCOW_ID) {
    return CENTERS.map((c) => ({
      id: c.id,
      regionId,
      name: c.name,
      address: c.address,
      lat: c.lat,
      lon: c.lon,
      distanceKm: c.distanceKm,
      groupStatus: c.groupStatus,
    }))
  }
  const region = REGIONS.find((r) => r.id === regionId)
  if (!region?.hasCenters) return []
  // Станция стоит в центре региона — центры посчитаны по файлу карты при запуске моков
  const [lon, lat] = regionCentroids.get(region.code) ?? [40, 55]
  return [
    {
      id: 100 + regionId,
      regionId,
      name: 'Областная станция переливания крови',
      address: 'ул. Ленина, 1',
      lat,
      lon,
      distanceKm: 3.5,
      groupStatus: (['urgent', 'low', 'enough'] as const)[regionId % 3],
    },
  ]
}

export const findCenter = (centerId: number): MockCenter | undefined =>
  REGIONS.flatMap((r) => centersOf(r.id)).find((c) => c.id === centerId)

const TYPE_CODE: Record<DonationType, number> = { whole_blood: 0, plasma: 1 }

export const encodeSlot = (centerId: number, donationType: DonationType, date: string, time: string): number =>
  centerId * 1e13 + TYPE_CODE[donationType] * 1e12 + Number(date.replaceAll('-', '')) * 1e4 + Number(time.replace(':', ''))

export const decodeSlot = (slotId: number) => {
  const centerId = Math.floor(slotId / 1e13)
  const donationType: DonationType = Math.floor((slotId % 1e13) / 1e12) === 1 ? 'plasma' : 'whole_blood'
  const dateNum = Math.floor((slotId % 1e12) / 1e4)
  const timeNum = slotId % 1e4
  const d = String(dateNum)
  const t = String(timeNum).padStart(4, '0')
  return {
    centerId,
    donationType,
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    time: `${t.slice(0, 2)}:${t.slice(2)}`,
  }
}
