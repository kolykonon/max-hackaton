import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { AppointmentResponse } from '../types'

export const useCurrentAppointment = () =>
  useQuery({
    queryKey: queryKeys.currentAppointment,
    queryFn: () => api.get<AppointmentResponse>('/appointments/current'),
  })

/**
 * Create / reschedule / cancel возвращают тот же AppointmentResponse, что и /appointments/current,
 * поэтому сразу кладём ответ в кэш. Слоты и даты перезапрашиваем — занятость изменилась.
 */
const useUpdateAppointmentCache = () => {
  const queryClient = useQueryClient()
  return {
    onSuccess: (data: AppointmentResponse) => {
      queryClient.setQueryData(queryKeys.currentAppointment, data)
      // Слоты и даты — занятость изменилась; группы — кто из участников записан
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['booking'] }),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
      ])
    },
    // 404 / 409 appointment_not_active — запись уже изменилась, показываем актуальную
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.currentAppointment }),
  }
}

/**
 * Ошибки: 404 slot_not_found, 409 slot_taken / active_exists, 422 interval_not_passed / personal_data_incomplete.
 * Если пользователь в группе на этот центр и день, бэк сам напишет создателю группы.
 */
export const useCreateAppointment = () =>
  useMutation({
    mutationFn: (slotId: number) => api.post<AppointmentResponse>('/appointments', { slot_id: slotId }),
    ...useUpdateAppointmentCache(),
  })

/** Возвращается новая запись с другим id. */
export const useRescheduleAppointment = () =>
  useMutation({
    mutationFn: ({ appointmentId, slotId }: { appointmentId: number; slotId: number }) =>
      api.post<AppointmentResponse>(`/appointments/${appointmentId}/reschedule`, { slot_id: slotId }),
    ...useUpdateAppointmentCache(),
  })

/** Ошибки: 404 appointment_not_found, 409 appointment_not_active. */
export const useCancelAppointment = () =>
  useMutation({
    mutationFn: (appointmentId: number) => api.post<AppointmentResponse>(`/appointments/${appointmentId}/cancel`),
    ...useUpdateAppointmentCache(),
  })
