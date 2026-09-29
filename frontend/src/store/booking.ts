import { create } from 'zustand'

import type { Appointment } from '@/api/types'
import type { DonationType } from '@/content/types'

export interface SelectedCenter {
  id: number
  name: string
  address: string
}

export interface SelectedSlot {
  id: number
  time: string
}

interface BookingState {
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

  startNew: () => void
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
  rescheduleId: null,
  donationType: 'whole_blood' as DonationType,
  regionId: null,
  date: null,
  center: null,
  slot: null,
  presetCenter: false,
}

/** Мастер записи. При смене шага сбрасываем всё, что от него зависит (ТЗ §9, общие правила записи). */
export const useBookingStore = create<BookingState>()((set, get) => ({
  ...initial,

  startNew: () => set(initial),

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
    if (regionId !== get().regionId) set({ regionId, date: null, center: null, slot: null, presetCenter: false })
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
