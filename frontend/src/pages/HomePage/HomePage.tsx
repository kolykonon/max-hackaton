import { Button } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AppointmentCard } from '@/components/features/home/AppointmentCard/AppointmentCard'
import { NoAppointmentCard } from '@/components/features/home/NoAppointmentCard/NoAppointmentCard'
import { TrafficLightCard } from '@/components/features/home/TrafficLightCard/TrafficLightCard'
import { Screen } from '@/components/layout/Screen/Screen'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog'
import { Toast } from '@/components/shared/Toast/Toast'
import { DEMO_APPOINTMENT, NEXT_ALLOWED_WHOLE, TODAY } from '@/content/demo'
import { useToast } from '@/hooks/useToast'
import { formatDateTimeShort, formatDayMonth } from '@/utils/format'

/** Главный экран «Запись». Вариант с записью — ?booked=1 (пока нет API). */
export const HomePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [booked, setBooked] = useState(searchParams.get('booked') === '1')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const toast = useToast()

  const appointment = DEMO_APPOINTMENT
  const nextAllowed = NEXT_ALLOWED_WHOLE > TODAY ? formatDayMonth(NEXT_ALLOWED_WHOLE) : undefined

  // TODO: POST /appointments/{id}/cancel; ошибка — тост «Не удалось отменить запись…»
  const confirmCancel = () => {
    setCancelling(true)
    window.setTimeout(() => {
      setCancelling(false)
      setCancelOpen(false)
      setBooked(false)
      toast.show('Запись отменена')
    }, 600)
  }

  return (
    <Screen withTabBar>
      <TrafficLightCard onOpen={() => navigate('/map')} />
      {booked ? (
        <AppointmentCard
          dateTime={formatDateTimeShort(appointment.date, appointment.time)}
          donationType={appointment.donationType}
          centerName={appointment.center.name}
          address={appointment.center.address}
          onReschedule={() => navigate('/booking/date?mode=reschedule')}
          onCancel={() => setCancelOpen(true)}
        />
      ) : (
        <>
          <NoAppointmentCard nextAllowed={nextAllowed} />
          <Button size="large" stretched onClick={() => navigate('/donation-info')}>
            Записаться
          </Button>
        </>
      )}
      <ConfirmDialog
        open={cancelOpen}
        title="Отменить запись?"
        text={`${formatDayMonth(appointment.date)}, ${appointment.time}, ${appointment.center.name}`}
        confirmText="Отменить запись"
        cancelText="Оставить"
        destructive
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setCancelOpen(false)}
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
