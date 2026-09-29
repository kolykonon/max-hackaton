import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, requestFile } from '../client'
import { queryKeys } from '../queryKeys'
import type { AfterDonation, AfterDonationResponse, LeaveApplicationInput } from '../types'

export type ApplicationFormat = 'pdf' | 'docx'

/** Последняя донация за год, засчитанная через приложение, или null. */
export const useAfterDonation = () =>
  useQuery({
    queryKey: queryKeys.afterDonation,
    queryFn: () => api.get<AfterDonationResponse>('/me/after-donation'),
  })

/** Документы и день отдыха по конкретной донации (ссылка rest_<id> из бота). 404 donation_not_found. */
export const useDonationAfter = (donationId: number) =>
  useQuery({
    queryKey: queryKeys.donationAfter(donationId),
    queryFn: () => api.get<AfterDonation>(`/me/donations/${donationId}/after`),
  })

/** Отметить, использован ли дополнительный день отдыха. */
export const useSetRestDayUsed = (donationId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (used: boolean) => api.put<AfterDonation>(`/me/donations/${donationId}/rest-day`, { used }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.donationAfter(donationId), data)
      return queryClient.invalidateQueries({ queryKey: queryKeys.afterDonation, exact: true })
    },
  })
}

interface ApplicationRequest {
  format: ApplicationFormat
  input: LeaveApplicationInput
}

/** Бот присылает заявление файлом в чат. 502 bot_send_failed, 422 — fields.rest_date. */
export const useSendApplication = (donationId: number) =>
  useMutation({
    mutationFn: ({ format, input }: ApplicationRequest) =>
      api.postWithParams<void>(`/me/donations/${donationId}/leave-application/send`, { format }, input),
  })

/** Заявление файлом для скачивания. 422 — fields.rest_date. */
export const useDownloadApplication = (donationId: number) =>
  useMutation({
    mutationFn: ({ format, input }: ApplicationRequest) =>
      requestFile(`/me/donations/${donationId}/leave-application`, {
        params: { format },
        body: input,
        fallbackName: `zayavlenie.${format}`,
      }),
  })
