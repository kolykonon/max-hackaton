import { Button, Typography } from '@maxhub/max-ui'
import { MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppointmentSummary } from '@/components/features/booking-confirmed/AppointmentSummary/AppointmentSummary'
import { SuccessBadge } from '@/components/features/booking-confirmed/SuccessBadge/SuccessBadge'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { DEMO_APPOINTMENT } from '@/content/demo'
import { PREPARATION } from '@/content/preparation'
import { formatDateTimeFull } from '@/utils/format'

import styles from './BookingConfirmedPage.module.scss'

/** Экран «Вы записаны». Без шапки и нижнего меню. */
export const BookingConfirmedPage = () => {
  const navigate = useNavigate()
  const appointment = DEMO_APPOINTMENT

  return (
    <Screen
      footer={
        <StickyFooter>
          <Button size="large" stretched onClick={() => navigate('/home?booked=1', { replace: true })}>
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
      <AppointmentSummary
        dateTime={formatDateTimeFull(appointment.date, appointment.time)}
        donationType={appointment.donationType}
        centerName={appointment.center.name}
        address={appointment.center.address}
      />
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
    </Screen>
  )
}
