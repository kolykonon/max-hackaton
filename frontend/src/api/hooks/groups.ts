import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { Group, GroupCreate } from '../types'

/** Групповая донация по коду из ссылки grp_<code>. 404 group_not_found. */
export const useGroup = (code: string) =>
  useQuery({
    queryKey: queryKeys.group(code),
    queryFn: () => api.get<Group>(`/groups/${code}`),
  })

/** Мои групповые донации: предстоящие (по дате) или прошедшие (сначала недавние). */
export const useMyGroups = (past = false) =>
  useQuery({
    queryKey: queryKeys.myGroups(past),
    queryFn: () => api.get<Group[]>('/groups/my', { past: String(past) }),
  })

/** Группа попала в кэш — список «Мои группы» перезапрашиваем. */
const useUpdateGroupCache = () => {
  const queryClient = useQueryClient()
  return (group: Group) => {
    queryClient.setQueryData(queryKeys.group(group.code), group)
    return queryClient.invalidateQueries({ queryKey: ['groups', 'my'] })
  }
}

/** Группа на центр, день и вид донации. Повторный вызов с теми же данными возвращает ту же группу. */
export const useCreateGroup = () =>
  useMutation({
    mutationFn: (body: GroupCreate) => api.post<Group>('/groups', body),
    onSuccess: useUpdateGroupCache(),
  })

/** 409 group_closed — дата группы прошла. */
export const useJoinGroup = () =>
  useMutation({
    mutationFn: (code: string) => api.post<Group>(`/groups/${code}/join`),
    onSuccess: useUpdateGroupCache(),
  })
