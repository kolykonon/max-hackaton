import { Users } from 'lucide-react'

import { ApiError } from '@/api/client'
import { useCreateInvite } from '@/api/hooks/appointments'
import type { Appointment } from '@/api/types'
import { shareContent } from '@/bridge/max'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { formatDayMonth, parseISODate } from '@/utils/format'

interface InviteFriendButtonProps {
  appointment: Appointment
  /** Показать тост: ссылка скопирована или приглашение не создалось. */
  onMessage: (text: string) => void
}

const shareText = (appointment: Appointment) =>
  `Я иду сдавать кровь ${formatDayMonth(parseISODate(appointment.local_date))} в ${appointment.local_time} — ` +
  `${appointment.center.name}. Пойдём вместе? 🩸`

/** «Позвать друга сдать вместе»: ссылка на запись в тот же центр и день. */
export const InviteFriendButton = ({ appointment, onMessage }: InviteFriendButtonProps) => {
  const createInvite = useCreateInvite()

  const invite = async () => {
    let link: string
    try {
      link = (await createInvite.mutateAsync(appointment.id)).link
    } catch (error) {
      onMessage(
        error instanceof ApiError && error.status > 0
          ? 'Не удалось создать приглашение. Попробуйте ещё раз'
          : 'Не удалось создать приглашение. Проверьте интернет',
      )
      return
    }
    try {
      const result = await shareContent({ text: shareText(appointment), link })
      if (result === 'copied') onMessage('Ссылка скопирована — отправьте её другу')
    } catch {
      // пользователь закрыл меню «Поделиться»
    }
  }

  return (
    <OutlineButton
      size="medium"
      stretched
      loading={createInvite.isPending}
      iconBefore={<Users size={20} />}
      onClick={invite}
    >
      Позвать друга сдать вместе
    </OutlineButton>
  )
}
