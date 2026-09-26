import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { DonationType } from '@/content/types'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { BookingCenter, BookingDates, BookingSlots } from '../types'

export const useBookingDates = (regionId: number | null, donationType: DonationType) =>
  useQuery({
    queryKey: queryKeys.bookingDates(regionId ?? 0, donationType),
    queryFn: () => api.get<BookingDates>('/booking/dates', { region_id: regionId, donation_type: donationType }),
    enabled: regionId !== null,
  })

interface CentersParams {
  regionId: number | null
  donationType: DonationType
  date: string | null
  lat?: number
  lon?: number
  /** При переносе текущий центр идёт первым. */
  pinCenterId?: number
}

export const useBookingCenters = ({ regionId, donationType, date, lat, lon, pinCenterId }: CentersParams) =>
  useQuery({
    queryKey: queryKeys.bookingCenters({ regionId, donationType, date, lat, lon, pinCenterId }),
    queryFn: () =>
      api.get<BookingCenter[]>('/booking/centers', {
        region_id: regionId,
        donation_type: donationType,
        date,
        lat,
        lon,
        pin_center_id: pinCenterId,
      }),
    enabled: regionId !== null && date !== null,
    // Сначала список приходит без координат, потом с ними — не мигаем скелетоном при пересортировке
    placeholderData: keepPreviousData,
  })

export const useBookingSlots = (centerId: number | null, donationType: DonationType, date: string | null) =>
  useQuery({
    queryKey: queryKeys.bookingSlots(centerId ?? 0, donationType, date ?? ''),
    queryFn: () => api.get<BookingSlots>('/booking/slots', { center_id: centerId, donation_type: donationType, date }),
    enabled: centerId !== null && date !== null,
  })
