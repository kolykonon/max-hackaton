import { Users } from 'lucide-react'

import { ApiError } from '@/api/client'
import { useCreateGroup } from '@/api/hooks/groups'
import type { Appointment, Group } from '@/api/types'
import { shareContent } from '@/bridge/max'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'

interface GroupInviteButtonProps {
  /** Своя запись: группа создаётся на её центр, день и вид донации. */
  appointment?: Appointment
  /** Уже известная группа — просто делимся ссылкой. */
  group?: Group
  /** Показать тост: ссылка скопирована или группа не создалась. */
  onMessage: (text: string) => void
}

/** «Позвать друзей сдать вместе»: ссылка на групповую донацию в тот же центр и день. */
export const GroupInviteButton = ({ appointment, group, onMessage }: GroupInviteButtonProps) => {
  const createGroup = useCreateGroup()

  const resolveGroup = async (): Promise<Group | null> => {
    if (group) return group
    if (!appointment) return null
    try {
      return await createGroup.mutateAsync({
        center_id: appointment.center.id,
        date: appointment.local_date,
        donation_type: appointment.donation_type,
      })
    } catch (error) {
      onMessage(
        error instanceof ApiError && error.status > 0
          ? 'Не удалось создать приглашение. Попробуйте ещё раз'
          : 'Не удалось создать приглашение. Проверьте интернет',
      )
      return null
    }
  }

  const invite = async () => {
    const target = await resolveGroup()
    if (!target) return
    try {
      const result = await shareContent({ text: target.share_text, link: target.link })
      if (result === 'copied') onMessage('Ссылка скопирована — отправьте её друзьям')
    } catch {
      // пользователь закрыл меню «Поделиться»
    }
  }

  return (
    <OutlineButton
      size="medium"
      stretched
      loading={createGroup.isPending}
      iconBefore={<Users size={20} />}
      onClick={invite}
    >
      Позвать друзей сдать вместе
    </OutlineButton>
  )
}
