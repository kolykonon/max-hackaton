import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'

/** Демо-эндпоинты работают только при DEMO_MODE=true на бэке (ТЗ §6). */
export type DemoPath =
  | '/demo/reset'
  | `/demo/appointments/${number}/${'remind' | 'ask-donated' | 'complete'}`
  | `/demo/pushes/${'interval_open' | 'deficit' | 'rest_day'}`

export const useDemoAction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (path: DemoPath) => api.post<void>(path),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
