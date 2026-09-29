import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { AppointmentResponse, Invite, InviteLink } from '../types'

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
      return queryClient.invalidateQueries({ queryKey: ['booking'] })
    },
    // 404 / 409 appointment_not_active — запись уже изменилась, показываем актуальную
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.currentAppointment }),
  }
}

/**
 * Ошибки: 404 slot_not_found, 409 slot_taken / active_exists, 422 interval_not_passed / personal_data_incomplete.
 * inviteCode — запись по приглашению «Сдать кровь вместе»: бэк свяжет её с записью друга, если центр и день совпали.
 */
export const useCreateAppointment = () =>
  useMutation({
    mutationFn: ({ slotId, inviteCode }: { slotId: number; inviteCode?: string | null }) =>
      api.post<AppointmentResponse>('/appointments', { slot_id: slotId, invite_code: inviteCode ?? null }),
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

/** Ссылка «Сдать кровь вместе» для активной записи. Повторный вызов возвращает ту же ссылку. */
export const useCreateInvite = () =>
  useMutation({
    mutationFn: (appointmentId: number) => api.post<InviteLink>(`/appointments/${appointmentId}/invite`),
  })

/** Приглашение друга. 404 invite_not_found — запись друга отменена или уже прошла. */
export const useInvite = (code: string) =>
  useQuery({
    queryKey: queryKeys.invite(code),
    queryFn: () => api.get<Invite>(`/invites/${code}`),
  })
