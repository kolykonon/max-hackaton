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

  startNew: () => void
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
}

/** Мастер записи. При смене шага сбрасываем всё, что от него зависит (ТЗ §9, общие правила записи). */
export const useBookingStore = create<BookingState>()((set, get) => ({
  ...initial,

  startNew: () => set(initial),

  startReschedule: (appointment) =>
    set({
      ...initial,
      rescheduleId: appointment.id,
      donationType: appointment.donation_type,
      regionId: appointment.center.region_id,
      center: { id: appointment.center.id, name: appointment.center.name, address: appointment.center.address },
    }),

  setDonationType: (donationType) => {
    if (donationType !== get().donationType) set({ donationType, date: null, center: null, slot: null })
  },
  setRegion: (regionId) => {
    if (regionId !== get().regionId) set({ regionId, date: null, center: null, slot: null })
  },
  setDate: (date) => {
    if (date !== get().date) set({ date, slot: null, center: get().rescheduleId ? get().center : null })
  },
  setCenter: (center) => {
    if (center.id !== get().center?.id) set({ center, slot: null })
  },
  setSlot: (slot) => set({ slot }),
}))
