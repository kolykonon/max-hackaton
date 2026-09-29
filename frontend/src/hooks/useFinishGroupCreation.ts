import { useNavigate } from 'react-router-dom'

import { useCreateGroup } from '@/api/hooks/groups'
import { useBookingStore } from '@/store/booking'

/** Последний шаг «Собрать группу»: создаём группу на выбранные центр и день и открываем её. */
export const useFinishGroupCreation = (onError: () => void) => {
  const navigate = useNavigate()
  const createGroup = useCreateGroup()
  const { donationType, date, center } = useBookingStore()

  const finish = () => {
    if (!date || !center) return
    createGroup.mutate(
      { center_id: center.id, date, donation_type: donationType },
      { onSuccess: (group) => navigate(`/group/${group.code}`, { replace: true }), onError },
    )
  }

  return { finish, isPending: createGroup.isPending }
}
