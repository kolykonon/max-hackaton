import { Button } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCancelAppointment, useCurrentAppointment } from '@/api/hooks/appointments'
import { useEligibility } from '@/api/hooks/me'
import { AppointmentCard } from '@/components/features/home/AppointmentCard/AppointmentCard'
import { NoAppointmentCard } from '@/components/features/home/NoAppointmentCard/NoAppointmentCard'
import { TrafficLightCard } from '@/components/features/home/TrafficLightCard/TrafficLightCard'
import { Screen } from '@/components/layout/Screen/Screen'
import { Card } from '@/components/shared/Card/Card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { useToast } from '@/hooks/useToast'
import { useBookingStore } from '@/store/booking'
import { formatDateTimeShort, formatDayMonth, parseISODate } from '@/utils/format'

export const HomePage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const current = useCurrentAppointment()
  const eligibility = useEligibility()
  const cancel = useCancelAppointment()
  const startNew = useBookingStore((state) => state.startNew)
  const startReschedule = useBookingStore((state) => state.startReschedule)
  const [cancelOpen, setCancelOpen] = useState(false)

  const appointment = current.data?.appointment ?? null

  const nextAllowed =
    eligibility.data?.interval_active.whole_blood ? formatDayMonth(parseISODate(eligibility.data.next_allowed.whole_blood)) : undefined

  const confirmCancel = () => {
    if (!appointment) return
    cancel.mutate(appointment.id, {
      onSuccess: () => toast.show('Запись отменена'),
      onError: () => toast.show('Не удалось отменить запись. Попробуйте ещё раз'),
      onSettled: () => setCancelOpen(false),
    })
  }

  const renderAppointment = () => {
    if (current.isPending) return <Skeleton height={180} />
    if (current.isError) {
      return (
        <Card padding="l">
          <ErrorState compact text="Не удалось загрузить запись" retrying={current.isFetching} onRetry={() => current.refetch()} />
        </Card>
      )
    }
    if (appointment) {
      return (
        <AppointmentCard
          dateTime={formatDateTimeShort(parseISODate(appointment.local_date), appointment.local_time)}
          donationType={appointment.donation_type}
          centerName={appointment.center.name}
          address={appointment.center.address}
          onReschedule={() => {
            startReschedule(appointment)
            navigate('/booking/date')
          }}
          onCancel={() => setCancelOpen(true)}
        />
      )
    }
    return (
      <>
        <NoAppointmentCard nextAllowed={nextAllowed} />
        <Button
          size="large"
          stretched
          onClick={() => {
            startNew()
            navigate('/donation-info')
          }}
        >
          Записаться
        </Button>
      </>
    )
  }

  return (
    <Screen withTabBar>
      <TrafficLightCard onOpen={() => navigate('/map')} />
      {renderAppointment()}
      {appointment && (
        <ConfirmDialog
          open={cancelOpen}
          title="Отменить запись?"
          text={`${formatDayMonth(parseISODate(appointment.local_date))}, ${appointment.local_time}, ${appointment.center.name}`}
          confirmText="Отменить запись"
          cancelText="Оставить"
          destructive
          loading={cancel.isPending}
          onConfirm={confirmCancel}
          onCancel={() => setCancelOpen(false)}
        />
      )}
      <Toast message={toast.message} />
    </Screen>
  )
}
