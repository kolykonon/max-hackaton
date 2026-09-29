import { create } from 'zustand'

import type { Appointment, Group } from '@/api/types'
import type { DonationType } from '@/content/types'

/** booking — обычная запись; group — те же шаги, но в конце создаётся групповая донация. */
export type BookingMode = 'booking' | 'group'

export interface SelectedCenter {
  id: number
  name: string
  address: string
}

export interface SelectedSlot {
  id: number
  time: string
}

/** Запись с групповой донацией: кто уже записан и на какое время. */
export interface BookingGroup {
  code: string
  ownerName: string
  date: string
  centerId: number
  booked: { name: string; time: string }[]
}

interface BookingState {
  mode: BookingMode
  /** Перенос: id записи, которую переносим. */
  rescheduleId: number | null
  donationType: DonationType
  regionId: number | null
  /** YYYY-MM-DD */
  date: string | null
  center: SelectedCenter | null
  slot: SelectedSlot | null
  /** Центр выбран заранее на карте — шаг 3 пропускаем, пока пользователь сам не захочет другой. */
  presetCenter: boolean
  group: BookingGroup | null

  startNew: () => void
  /** «Собрать группу»: вид донации → регион → дата → центр. */
  startGroupCreation: () => void
  /** «Собрать снова»: центр и вид донации как у прошедшей группы, выбрать только дату. */
  startGroupAgain: (center: SelectedCenter, regionId: number, donationType: DonationType) => void
  /** «Записаться с группой»: вид донации, центр и день — как у группы. */
  startFromGroup: (group: Group) => void
  /** Запись из карточки центра на карте: регион и центр уже известны. */
  startFromCenter: (center: SelectedCenter, regionId: number) => void
  /** Пользователь хочет выбрать другой центр — дальше шаг 3 как обычно. */
  releaseCenter: () => void
  startReschedule: (appointment: Appointment) => void
  setDonationType: (donationType: DonationType) => void
  setRegion: (regionId: number) => void
  setDate: (date: string) => void
  setCenter: (center: SelectedCenter) => void
  setSlot: (slot: SelectedSlot) => void
}

const initial = {
  mode: 'booking' as BookingMode,
  rescheduleId: null,
  donationType: 'whole_blood' as DonationType,
  regionId: null,
  date: null,
  center: null,
  slot: null,
  presetCenter: false,
  group: null,
}

/** Мастер записи. При смене шага сбрасываем всё, что от него зависит (ТЗ §9, общие правила записи). */
export const useBookingStore = create<BookingState>()((set, get) => ({
  ...initial,

  startNew: () => set(initial),

  startGroupCreation: () => set({ ...initial, mode: 'group' }),

  startGroupAgain: (center, regionId, donationType) =>
    set({ ...initial, mode: 'group', center, regionId, donationType, presetCenter: true }),

  startFromGroup: ({ code, owner_name: ownerName, center, date, donation_type: donationType, members }) =>
    set({
      ...initial,
      donationType,
      regionId: center.region_id,
      date,
      center: { id: center.id, name: center.name, address: center.address },
      presetCenter: true,
      group: {
        code,
        ownerName,
        date,
        centerId: center.id,
        booked: members.flatMap((member) => (member.booked_time ? [{ name: member.name, time: member.booked_time }] : [])),
      },
    }),

  startFromCenter: (center, regionId) => set({ ...initial, regionId, center, presetCenter: true }),

  releaseCenter: () => set({ presetCenter: false }),

  startReschedule: (appointment) =>
    set({
      ...initial,
      rescheduleId: appointment.id,
      donationType: appointment.donation_type,
      regionId: appointment.center.region_id,
      center: { id: appointment.center.id, name: appointment.center.name, address: appointment.center.address },
    }),

  setDonationType: (donationType) => {
    if (donationType === get().donationType) return
    // Центр с карты сохраняем: если в нём нет такого вида донации, увидим это на шаге времени
    set({ donationType, date: null, slot: null, center: get().presetCenter ? get().center : null })
  },
  setRegion: (regionId) => {
    if (regionId !== get().regionId) set({ regionId, date: null, center: null, slot: null, presetCenter: false, group: null })
  },
  setDate: (date) => {
    if (date === get().date) return
    const { rescheduleId, presetCenter, center } = get()
    set({ date, slot: null, center: rescheduleId || presetCenter ? center : null })
  },
  setCenter: (center) => {
    if (center.id !== get().center?.id) set({ center, slot: null })
  },
  setSlot: (slot) => set({ slot }),
}))
