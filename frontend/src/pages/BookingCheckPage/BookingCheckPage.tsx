import { Button, Typography } from '@maxhub/max-ui'
import { Bell, IdCard } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SummaryCard } from '@/components/features/booking-check/SummaryCard/SummaryCard'
import { SummarySection } from '@/components/features/booking-check/SummaryCard/SummarySection'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { DEMO_APPOINTMENT, DEMO_PERSONAL_DATA } from '@/content/demo'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { useBookingMode } from '@/hooks/useBookingMode'
import { formatDateTimeFull } from '@/utils/format'

import styles from './BookingCheckPage.module.scss'

/** Шаг 5 — проверка записи. При переносе меняются заголовок и кнопка. */
export const BookingCheckPage = () => {
  const navigate = useNavigate()
  const { isReschedule, withMode } = useBookingMode()
  const [submitting, setSubmitting] = useState(false)

  const appointment = DEMO_APPOINTMENT
  const donor = DEMO_PERSONAL_DATA

  // TODO: POST /appointments; 409 slot_taken — окно «Это время уже заняли»
  const submit = () => {
    setSubmitting(true)
    window.setTimeout(() => navigate('/booking/done', { replace: true }), 700)
  }

  return (
    <Screen
      header={
        <StepHeader
          title={isReschedule ? 'Проверьте новую запись' : 'Проверьте запись'}
          step={5}
          onBack={() => navigate(withMode('/booking/time'))}
        />
      }
      footer={
        <StickyFooter>
          <Button size="large" stretched loading={submitting} disabled={submitting} onClick={submit}>
            {isReschedule ? 'Перенести запись' : 'Записаться'}
          </Button>
        </StickyFooter>
      }
    >
      <SummaryCard>
        <SummarySection
          label="Вид донации"
          value={DONATION_TYPE_LABEL[appointment.donationType]}
          onEdit={isReschedule ? undefined : () => navigate('/booking/type')}
        />
        <SummarySection
          label="Центр"
          value={appointment.center.name}
          caption={appointment.center.address}
          onEdit={() => navigate(withMode('/booking/center'))}
        />
        <SummarySection
          label="Дата и время"
          value={formatDateTimeFull(appointment.date, appointment.time)}
          onEdit={() => navigate(withMode('/booking/date'))}
        />
        <SummarySection
          label="Донор"
          value={`${donor.lastName} ${donor.firstName} ${donor.middleName}`}
          caption={donor.phone}
        />
      </SummaryCard>
      <div className={styles['booking-check__hints']}>
        <InfoRow icon={Bell} title={<Typography.Text variant="detail" color="secondary">Напомним в чате MAX за день до донации</Typography.Text>} />
        <InfoRow icon={IdCard} title={<Typography.Text variant="detail" color="secondary">Не забудьте паспорт</Typography.Text>} />
      </div>
    </Screen>
  )
}
