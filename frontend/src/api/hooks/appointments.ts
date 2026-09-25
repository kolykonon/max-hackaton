import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { Appointment, CurrentAppointment } from '../types'

export const useCurrentAppointment = () =>
  useQuery({
    queryKey: queryKeys.currentAppointment,
    queryFn: () => api.get<CurrentAppointment>('/appointments/current'),
  })

/** После записи, переноса и отмены обновляем текущую запись и слоты. */
const useInvalidateBooking = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.currentAppointment }),
      queryClient.invalidateQueries({ queryKey: ['booking'] }),
    ])
}

/** Ошибки: 409 slot_taken, 409 active_exists, 422 interval_not_passed, 422 personal_data_incomplete, 404 slot_not_found. */
export const useCreateAppointment = () => {
  const invalidate = useInvalidateBooking()
  return useMutation({
    mutationFn: (slotId: number) => api.post<Appointment>('/appointments', { slot_id: slotId }),
    onSuccess: invalidate,
  })
}

export const useRescheduleAppointment = () => {
  const invalidate = useInvalidateBooking()
  return useMutation({
    mutationFn: ({ appointmentId, slotId }: { appointmentId: number; slotId: number }) =>
      api.post<Appointment>(`/appointments/${appointmentId}/reschedule`, { slot_id: slotId }),
    onSuccess: invalidate,
  })
}

export const useCancelAppointment = () => {
  const invalidate = useInvalidateBooking()
  return useMutation({
    mutationFn: (appointmentId: number) => api.post<void>(`/appointments/${appointmentId}/cancel`),
    onSuccess: invalidate,
  })
}
