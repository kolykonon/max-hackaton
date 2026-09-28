import type { DonationType } from '@/content/types'

export const queryKeys = {
  me: ['me'] as const,
  personalData: ['me', 'personal-data'] as const,
  eligibility: ['me', 'eligibility'] as const,
  progress: ['me', 'progress'] as const,
  donations: ['me', 'donations'] as const,
  referrals: ['me', 'referrals'] as const,
  regions: ['regions'] as const,
  locate: (lat: number, lon: number) => ['regions', 'locate', lat, lon] as const,
  mapStatus: ['map', 'status'] as const,
  mapCenters: ['map', 'centers'] as const,
  bookingDates: (regionId: number, type: DonationType) => ['booking', 'dates', regionId, type] as const,
  bookingCenters: (params: object) => ['booking', 'centers', params] as const,
  bookingSlots: (centerId: number, type: DonationType, date: string) => ['booking', 'slots', centerId, type, date] as const,
  currentAppointment: ['appointments', 'current'] as const,
}
