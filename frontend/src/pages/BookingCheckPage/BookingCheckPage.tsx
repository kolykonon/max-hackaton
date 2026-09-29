import { Button, Typography } from '@maxhub/max-ui'
import { Bell, IdCard } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { useCreateAppointment, useRescheduleAppointment } from '@/api/hooks/appointments'
import { usePersonalData } from '@/api/hooks/me'
import { SummaryCard } from '@/components/features/booking-check/SummaryCard/SummaryCard'
import { SummarySection } from '@/components/features/booking-check/SummaryCard/SummarySection'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { Toast } from '@/components/shared/Toast/Toast'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { useToast } from '@/hooks/useToast'
import { useBookingStore } from '@/store/booking'
import { formatDateTimeFull, parseISODate } from '@/utils/format'
import { MASKS } from '@/utils/masks'

import styles from './BookingCheckPage.module.scss'

/** Тексты по коду ошибки. message из API — для логов, пользователю его не показываем. */
const ERROR_TEXT: Partial<Record<string, string>> = {
  active_exists: 'У вас уже есть запись. Отмените или перенесите её на главной',
  interval_not_passed: 'Интервал после прошлой донации ещё не прошёл. Выберите более позднюю дату',
  personal_data_incomplete: 'Заполните личные данные, чтобы записаться',
  slot_not_found: 'Это время больше недоступно. Выберите другое',
}

/** Шаг 5 — проверка записи. При переносе меняются заголовок и кнопка. */
export const BookingCheckPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { donationType, date, center, slot, rescheduleId, invite, releaseCenter } = useBookingStore()
  const donor = usePersonalData()
  const create = useCreateAppointment()
  const reschedule = useRescheduleAppointment()
  const [slotTakenOpen, setSlotTakenOpen] = useState(false)

  if (!date || !center || !slot) return <Navigate to="/home" replace />

  const isReschedule = rescheduleId !== null
  const submitting = create.isPending || reschedule.isPending

  const onError = (error: Error) => {
    if (!(error instanceof ApiError) || error.status === 0) {
      toast.show('Не удалось записаться. Проверьте интернет и попробуйте ещё раз')
      return
    }
    if (error.code === 'slot_taken') {
      setSlotTakenOpen(true)
      return
    }
    toast.show(ERROR_TEXT[error.code] ?? 'Не удалось записаться. Попробуйте ещё раз')
  }

  const submit = () => {
    const options = { onSuccess: () => navigate('/booking/done', { replace: true }), onError }
    if (isReschedule) reschedule.mutate({ appointmentId: rescheduleId, slotId: slot.id }, options)
    else create.mutate({ slotId: slot.id, inviteCode: invite?.code }, options)
  }

  const donorName = donor.data ? [donor.data.last_name, donor.data.first_name, donor.data.middle_name].filter(Boolean).join(' ') : '…'

  return (
    <Screen
      header={
        <StepHeader
          title={isReschedule ? 'Проверьте новую запись' : 'Проверьте запись'}
          step={5}
          onBack={() => navigate('/booking/time')}
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
          value={DONATION_TYPE_LABEL[donationType]}
          onEdit={isReschedule ? undefined : () => navigate('/booking/type')}
        />
        <SummarySection
          label="Центр"
          value={center.name}
          caption={center.address}
          onEdit={() => {
            releaseCenter()
            navigate('/booking/center')
          }}
        />
        <SummarySection
          label="Дата и время"
          value={formatDateTimeFull(parseISODate(date), slot.time)}
          onEdit={() => navigate('/booking/date')}
        />
        <SummarySection label="Донор" value={donorName} caption={donor.data?.phone ? MASKS.phone(donor.data.phone) : undefined} />
      </SummaryCard>
      <div className={styles['booking-check__hints']}>
        <InfoRow
          icon={Bell}
          title={<Typography.Text variant="detail" color="secondary">Напомним в чате MAX за день до донации</Typography.Text>}
        />
        <InfoRow icon={IdCard} title={<Typography.Text variant="detail" color="secondary">Не забудьте паспорт</Typography.Text>} />
      </div>
      <ConfirmDialog
        open={slotTakenOpen}
        title="Это время уже заняли"
        confirmText="Выбрать другое время"
        cancelText="Закрыть"
        onConfirm={() => navigate('/booking/time')}
        onCancel={() => setSlotTakenOpen(false)}
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
