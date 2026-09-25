import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'

/** Демо-эндпоинты работают только при DEMO_MODE=true на бэке (ТЗ §6). */
export const useDemoAction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (path: '/demo/reset' | `/demo/appointments/${number}/remind` | `/demo/appointments/${number}/complete`) =>
      api.post<void>(path),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
