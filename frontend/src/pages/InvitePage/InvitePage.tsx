import { Button } from '@maxhub/max-ui'
import { CalendarX, HeartHandshake, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { useCurrentAppointment, useInvite } from '@/api/hooks/appointments'
import { useEligibility } from '@/api/hooks/me'
import { InviteHero } from '@/components/features/invite/InviteHero/InviteHero'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { AppointmentSummary } from '@/components/shared/AppointmentSummary/AppointmentSummary'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { useBookingStore } from '@/store/booking'
import { formatDateTimeFull, formatDayMonth, parseISODate } from '@/utils/format'

/** Экран «Сдать кровь вместе»: друг прислал ссылку ?startapp=together_<code>. */
export const InvitePage = () => {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const invite = useInvite(code)
  const current = useCurrentAppointment()
  const eligibility = useEligibility()
  const { startNew, startFromInvite, startFromCenter } = useBookingStore()
  const goHome = () => navigate('/home', { replace: true })

  const screen = (content: ReactNode, footer?: ReactNode) => (
    <Screen
      header={<PageHeader title="Сдать кровь вместе" onBack={goHome} />}
      footer={footer && <StickyFooter>{footer}</StickyFooter>}
    >
      {content}
    </Screen>
  )
  const footerButton = (text: string, onClick: () => void) => (
    <Button size="large" stretched onClick={onClick}>
      {text}
    </Button>
  )

  if (invite.isPending || current.isPending || eligibility.isPending) {
    return screen([240, 130].map((height) => <Skeleton key={height} height={height} />))
  }

  if (invite.isError) {
    if (invite.error instanceof ApiError && invite.error.code === 'invite_not_found') {
      const bookAlone = () => {
        startNew()
        navigate('/donation-info')
      }
      return screen(
        <InviteHero
          icon={CalendarX}
          tone="gray"
          title="Приглашение больше не действует"
          text="Друг отменил или перенёс запись. Вы можете записаться сами — это займёт пару минут"
        />,
        footerButton('Записаться', bookAlone),
      )
    }
    return screen(
      <ErrorState text="Не удалось загрузить приглашение" retrying={invite.isFetching} onRetry={() => invite.refetch()} />,
    )
  }

  const { inviter_name: inviterName, is_own: isOwn, appointment } = invite.data
  const summary = (
    <AppointmentSummary
      dateTime={formatDateTimeFull(parseISODate(appointment.local_date), appointment.local_time)}
      donationType={appointment.donation_type}
      centerName={appointment.center.name}
      address={appointment.center.address}
    />
  )

  if (isOwn) {
    return screen(
      <>
        <InviteHero
          icon={Users}
          tone="blue"
          title="Это ваше приглашение"
          text="Отправьте ссылку другу. Когда он запишется рядом с вами, мы напишем вам в чат"
        />
        {summary}
      </>,
      footerButton('На главную', goHome),
    )
  }

  const title = `${inviterName} зовёт вас сдать кровь вместе`

  const own = current.data?.appointment
  if (own) {
    const together = own.center.id === appointment.center.id && own.local_date === appointment.local_date
    return screen(
      <>
        <InviteHero
          icon={HeartHandshake}
          title={together ? 'Вы уже идёте вместе' : title}
          text={
            together
              ? `Вы записаны на ${own.local_time} в тот же центр`
              : 'У вас уже есть запись. Чтобы пойти вместе, отмените её на главной и откройте ссылку ещё раз'
          }
        />
        {summary}
      </>,
      footerButton('На главную', goHome),
    )
  }

  // Интервал после прошлой донации: в день друга вам ещё нельзя — предлагаем тот же центр позже
  const nextAllowed = eligibility.data?.next_allowed[appointment.donation_type]
  if (nextAllowed && nextAllowed > appointment.local_date) {
    const { id, name, address, region_id: regionId } = appointment.center
    const bookLater = () => {
      startFromCenter({ id, name, address }, regionId)
      navigate('/donation-info')
    }
    return screen(
      <>
        <InviteHero
          icon={HeartHandshake}
          title={title}
          text={
            `${DONATION_TYPE_LABEL[appointment.donation_type]} — вам можно с ${formatDayMonth(parseISODate(nextAllowed))}, ` +
            'поэтому в этот день не получится. Запишитесь в тот же центр позже'
          }
        />
        {summary}
      </>,
      footerButton('Выбрать другой день', bookLater),
    )
  }

  const bookNearby = () => {
    startFromInvite(invite.data)
    navigate('/donation-info')
  }
  return screen(
    <>
      <InviteHero icon={HeartHandshake} title={title} text="Запишитесь в тот же центр и день — время выберете рядом" />
      {summary}
    </>,
    footerButton('Записаться рядом', bookNearby),
  )
}
