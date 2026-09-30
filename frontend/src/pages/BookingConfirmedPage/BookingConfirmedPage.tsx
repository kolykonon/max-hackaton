import { Button, Typography } from '@maxhub/max-ui'
import { HeartHandshake, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCurrentAppointment } from '@/api/hooks/appointments'
import { AppointmentSummary } from '@/components/shared/AppointmentSummary/AppointmentSummary'
import { SuccessBadge } from '@/components/features/booking-confirmed/SuccessBadge/SuccessBadge'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { GroupInviteButton } from '@/components/shared/GroupInviteButton/GroupInviteButton'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { PREPARATION } from '@/content/preparation'
import { useBackButton } from '@/hooks/useBackButton'
import { useToast } from '@/hooks/useToast'
import { useBookingStore } from '@/store/booking'
import { formatDateTimeFull, parseISODate, visibleTime } from '@/utils/format'

import styles from './BookingConfirmedPage.module.scss'

/** Экран «Вы записаны». Без шапки и нижнего меню; «На главную» и системный «Назад» ведут на «Запись». */
export const BookingConfirmedPage = () => {
  const navigate = useNavigate()
  const current = useCurrentAppointment()
  const appointment = current.data?.appointment
  const toast = useToast()
  const group = useBookingStore((state) => state.group)
  const goingTogether =
    group && appointment && group.centerId === appointment.center.id && group.date === appointment.local_date
  const goHome = () => navigate('/home', { replace: true })
  useBackButton(goHome)

  return (
    <Screen
      footer={
        <StickyFooter>
          <Button size="large" stretched onClick={goHome}>
            На главную
          </Button>
        </StickyFooter>
      }
    >
      <div className={styles['booking-confirmed__hero']}>
        <SuccessBadge />
        <Typography.Text variant="hero" className={styles['booking-confirmed__title']}>
          Вы записаны!
        </Typography.Text>
        <Typography.Text variant="body" color="secondary">
          Спасибо, что помогаете тем, кому нужна кровь
        </Typography.Text>
      </div>
      {appointment ? (
        <>
          <AppointmentSummary
            dateTime={formatDateTimeFull(parseISODate(appointment.local_date), visibleTime(appointment))}
            donationType={appointment.donation_type}
            centerName={appointment.center.name}
            address={appointment.center.address}
          />
          {goingTogether && (
            <InfoRow
              icon={HeartHandshake}
              tone="red"
              title="Вы идёте с группой"
              description={`${group.ownerName} получит сообщение в чат, что вы записались`}
            />
          )}
          <GroupInviteButton appointment={appointment} onMessage={toast.show} />
        </>
      ) : (
        <Skeleton height={130} />
      )}
      <section className={styles['booking-confirmed__prep']}>
        <Typography.Text variant="subheader">Как подготовиться</Typography.Text>
        {PREPARATION.map((item) => (
          <InfoRow key={item.title} icon={item.icon} tone={item.tone} title={item.title} />
        ))}
      </section>
      <div className={styles['booking-confirmed__note']}>
        <MessageCircle size={20} />
        <Typography.Text variant="description" color="tertiary">
          Подтверждение и памятку отправили вам в чат. Напомним за день до донации
        </Typography.Text>
      </div>
      <Toast message={toast.message} />
    </Screen>
  )
}
