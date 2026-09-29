import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { DonationHistory, Eligibility, Me, PersonalData, PersonalDataInput, Progress, Referrals } from '../types'

export const useMe = () => useQuery({ queryKey: queryKeys.me, queryFn: () => api.get<Me>('/me') })

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/me/onboarding', { consent: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  })
}

export const usePersonalData = () =>
  useQuery({ queryKey: queryKeys.personalData, queryFn: () => api.get<PersonalData>('/me/personal-data') })

export const useSavePersonalData = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PersonalDataInput) => api.put<PersonalData>('/me/personal-data', data),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.personalData, data),
  })
}

export const useEligibility = () =>
  useQuery({ queryKey: queryKeys.eligibility, queryFn: () => api.get<Eligibility>('/me/eligibility') })

export const useProgress = () => useQuery({ queryKey: queryKeys.progress, queryFn: () => api.get<Progress>('/me/progress') })

export const useDonations = (enabled = true) =>
  useQuery({ queryKey: queryKeys.donations, queryFn: () => api.get<DonationHistory>('/me/donations'), enabled })

export const useReferrals = () => useQuery({ queryKey: queryKeys.referrals, queryFn: () => api.get<Referrals>('/me/referrals') })

/** Регион донора для пушей о дефиците крови. 404 — нет такого региона. */
export const useUpdateRegion = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (regionId: number) => api.put<Me>('/me/region', { region_id: regionId }),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.me, data),
  })
}
