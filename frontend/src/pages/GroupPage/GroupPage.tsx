import { Button } from '@maxhub/max-ui'
import { CalendarX, HeartHandshake, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { useCurrentAppointment } from '@/api/hooks/appointments'
import { useGroup, useJoinGroup } from '@/api/hooks/groups'
import { useEligibility } from '@/api/hooks/me'
import { GroupHero } from '@/components/features/group/GroupHero/GroupHero'
import { GroupMemberItem } from '@/components/features/group/GroupMembers/GroupMemberItem'
import { GroupMembers } from '@/components/features/group/GroupMembers/GroupMembers'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { AppointmentSummary } from '@/components/shared/AppointmentSummary/AppointmentSummary'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { GroupInviteButton } from '@/components/shared/GroupInviteButton/GroupInviteButton'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { useToast } from '@/hooks/useToast'
import { stepAfterCenter, useBookingStore } from '@/store/booking'
import { formatDayMonth, formatDayMonthWeekday, parseISODate } from '@/utils/format'

/** Экран групповой донации: пришли по ссылке ?startapp=grp_<code>. */
export const GroupPage = () => {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const group = useGroup(code)
  const join = useJoinGroup()
  const current = useCurrentAppointment()
  const eligibility = useEligibility()
  const { startNew, startFromGroup, startFromCenter, startGroupAgain } = useBookingStore()
  const goHome = () => navigate('/home', { replace: true })
  // Участник вернётся к своим группам, пришедший по ссылке — на главную
  const goBack = () => (group.data?.is_member ? navigate('/groups') : goHome())
  const bookAlone = () => {
    startNew()
    navigate('/booking/type')
  }

  const screen = (content: ReactNode, footer?: ReactNode) => (
    <Screen
      header={<PageHeader title="Сдать кровь вместе" onBack={goBack} />}
      footer={footer && <StickyFooter>{footer}</StickyFooter>}
    >
      {content}
      <Toast message={toast.message} />
    </Screen>
  )
  const footerButton = (text: string, onClick: () => void, loading = false) => (
    <Button size="large" stretched loading={loading} onClick={onClick}>
      {text}
    </Button>
  )

  if (group.isPending || current.isPending || eligibility.isPending) {
    return screen([240, 130, 180].map((height) => <Skeleton key={height} height={height} />))
  }

  if (group.isError) {
    if (group.error instanceof ApiError && group.error.code === 'group_not_found') {
      return screen(
        <GroupHero
          icon={CalendarX}
          tone="gray"
          title="Группа не найдена"
          text="Возможно, ссылка устарела. Вы можете записаться сами — это займёт пару минут"
        />,
        footerButton('Записаться', bookAlone),
      )
    }
    return screen(
      <ErrorState text="Не удалось загрузить группу" retrying={group.isFetching} onRetry={() => group.refetch()} />,
    )
  }

  const data = group.data
  const details = (
    <>
      <AppointmentSummary
        dateTime={formatDayMonthWeekday(parseISODate(data.date))}
        donationType={data.donation_type}
        centerName={data.center.name}
        address={data.center.address}
      />
      <GroupMembers
        title={`Участники · ${data.members_count}`}
        caption={data.is_past ? undefined : `Свободных мест в этот день: ${data.free_slots}`}
      >
        {data.members.map((member, index) => (
          <GroupMemberItem key={`${member.name}-${index}`} member={member} />
        ))}
      </GroupMembers>
    </>
  )
  const title = data.is_owner ? 'Ваша групповая донация' : `${data.owner_name} зовёт вас сдать кровь вместе`

  if (data.is_past) {
    const collectAgain = () => {
      const { id, name, address, region_id: regionId } = data.center
      startGroupAgain({ id, name, address }, regionId, data.donation_type)
      navigate('/booking/date')
    }
    return screen(
      <>
        <GroupHero
          icon={data.is_member ? Users : CalendarX}
          tone={data.is_member ? 'blue' : 'gray'}
          title="Эта групповая донация прошла"
          text={
            data.is_member
              ? `Сдали ${data.donated_count} из ${data.members_count}. Соберите группу снова в тот же центр`
              : 'Можно записаться самому на другой день'
          }
        />
        {details}
      </>,
      data.is_member ? footerButton('Собрать снова', collectAgain) : footerButton('Записаться', bookAlone),
    )
  }

  if (data.is_booked) {
    return screen(
      <>
        <GroupHero
          icon={Users}
          tone="blue"
          title={title}
          text="Вы записаны. Позовите ещё друзей — каждый донор помогает до трёх пациентов"
        />
        {details}
        <GroupInviteButton group={data} onMessage={toast.show} />
      </>,
      footerButton('На главную', goHome),
    )
  }

  if (current.data?.appointment) {
    return screen(
      <>
        <GroupHero
          icon={HeartHandshake}
          title={title}
          text="У вас уже есть запись. Чтобы пойти с группой, отмените её на главной и откройте ссылку ещё раз"
        />
        {details}
      </>,
      footerButton('На главную', goHome),
    )
  }

  const bookOtherDay = () => {
    const { id, name, address, region_id: regionId } = data.center
    startFromCenter({ id, name, address }, regionId)
    navigate('/booking/type')
  }

  // Интервал после прошлой донации: в день группы вам ещё нельзя — предлагаем тот же центр позже
  const nextAllowed = eligibility.data?.next_allowed[data.donation_type]
  if (nextAllowed && nextAllowed > data.date) {
    return screen(
      <>
        <GroupHero
          icon={HeartHandshake}
          title={title}
          text={
            `${DONATION_TYPE_LABEL[data.donation_type]} — вам можно с ${formatDayMonth(parseISODate(nextAllowed))}, ` +
            'поэтому в этот день не получится. Запишитесь в тот же центр позже'
          }
        />
        {details}
      </>,
      footerButton('Выбрать другой день', bookOtherDay),
    )
  }

  if (data.free_slots === 0) {
    return screen(
      <>
        <GroupHero
          icon={HeartHandshake}
          title={title}
          text="Свободных мест в этот день не осталось. Можно записаться в тот же центр в другой день"
        />
        {details}
      </>,
      footerButton('Выбрать другой день', bookOtherDay),
    )
  }

  const bookWithGroup = async () => {
    try {
      startFromGroup(data.is_member ? data : await join.mutateAsync(data.code))
      // Вид донации, центр и день — как у группы: плазме осталось выбрать время, крови — проверить запись
      navigate(stepAfterCenter(data.donation_type))
    } catch (error) {
      toast.show(
        error instanceof ApiError && error.code === 'group_closed'
          ? 'Дата группы уже прошла'
          : 'Не удалось присоединиться. Попробуйте ещё раз',
      )
    }
  }

  if (data.is_owner) {
    return screen(
      <>
        <GroupHero
          icon={Users}
          tone="blue"
          title={title}
          text="Позовите друзей или коллег и запишитесь сами — каждый выберет своё время в этот день"
        />
        {details}
        <GroupInviteButton group={data} onMessage={toast.show} />
      </>,
      footerButton('Записаться самому', bookWithGroup),
    )
  }

  return screen(
    <>
      <GroupHero icon={HeartHandshake} title={title} text="Запишитесь в тот же центр и день — время выберете рядом" />
      {details}
    </>,
    footerButton('Записаться с группой', bookWithGroup, join.isPending),
  )
}
