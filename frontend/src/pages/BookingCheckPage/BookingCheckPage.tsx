import { Button, Typography } from '@maxhub/max-ui'
import { Bell, CalendarX, IdCard, UserRoundPen } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/client'
import { useCreateAppointment, useRescheduleAppointment } from '@/api/hooks/appointments'
import { useBookingSlots } from '@/api/hooks/booking'
import { usePersonalData } from '@/api/hooks/me'
import { useRegions } from '@/api/hooks/regions'
import { RegionSheet } from '@/components/features/account/RegionSheet/RegionSheet'
import { SummaryCard } from '@/components/features/booking-check/SummaryCard/SummaryCard'
import { SummarySection } from '@/components/features/booking-check/SummaryCard/SummarySection'
import { useBookingRegion } from '@/components/features/booking-type-region/useBookingRegion'
import { sectionOf, settingsPath, type SectionKey } from '@/components/features/personal-data/fields'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { Toast } from '@/components/shared/Toast/Toast'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { useToast } from '@/hooks/useToast'
import { bookingSteps, useBookingStore } from '@/store/booking'
import { formatDayMonthWeekday, parseISODate } from '@/utils/format'
import { MASKS } from '@/utils/masks'

import styles from './BookingCheckPage.module.scss'

/** Тексты по коду ошибки. message из API — для логов, пользователю его не показываем. */
const ERROR_TEXT: Partial<Record<string, string>> = {
  active_exists: 'У вас уже есть запись. Отмените или перенесите её на главной',
  interval_not_passed: 'Интервал после прошлой донации ещё не прошёл. Выберите более позднюю дату',
  slot_not_found: 'Это время больше недоступно. Выберите другое',
}

/** Последний шаг — «Проверьте запись». Каждый параметр меняется на месте, без новой записи. */
export const BookingCheckPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { donationType, regionId, date, center, slot, rescheduleId, presetCenter, releaseCenter } = useBookingStore()
  const isPlasma = donationType === 'plasma'
  const donor = usePersonalData()
  const regions = useRegions()
  const region = useBookingRegion(toast.show, () => navigate('/booking/date'))
  // Цельная кровь: время не выбирают — в центре один слот на день, берём его
  const daySlots = useBookingSlots(isPlasma ? null : (center?.id ?? null), donationType, date)
  const create = useCreateAppointment()
  const reschedule = useRescheduleAppointment()
  const [slotTakenOpen, setSlotTakenOpen] = useState(false)

  if (!date || !center || (isPlasma && !slot)) return <Navigate to="/home" replace />

  const daySlot = daySlots.data?.groups.flatMap((group) => group.slots).find((item) => item.is_free)
  const slotId = isPlasma ? slot?.id : daySlot?.id
  const noPlaces = !isPlasma && daySlots.isSuccess && !daySlot
  const isReschedule = rescheduleId !== null
  const submitting = create.isPending || reschedule.isPending
  const steps = bookingSteps(donationType)
  const missing = donor.data?.missing_fields ?? []

  // Заполнить данные в настройках и вернуться сюда же — выбор хранится в мастере записи
  const openSettings = (section: SectionKey) => navigate(settingsPath(section, '/booking/check'))

  const onError = (error: Error) => {
    if (!(error instanceof ApiError) || error.status === 0) {
      toast.show('Не удалось записаться. Проверьте интернет и попробуйте ещё раз')
      return
    }
    if (error.code === 'slot_taken') {
      daySlots.refetch()
      setSlotTakenOpen(true)
      return
    }
    if (error.code === 'personal_data_incomplete') {
      donor.refetch().then(({ data }) => openSettings(sectionOf(data?.missing_fields[0] ?? 'last_name')))
      return
    }
    toast.show(ERROR_TEXT[error.code] ?? 'Не удалось записаться. Попробуйте ещё раз')
  }

  const submit = () => {
    if (missing.length > 0) return openSettings(sectionOf(missing[0]))
    if (!slotId) return
    const options = { onSuccess: () => navigate('/booking/done', { replace: true }), onError }
    if (isReschedule) reschedule.mutate({ appointmentId: rescheduleId, slotId }, options)
    else create.mutate(slotId, options)
  }

  const donorName = donor.data ? [donor.data.last_name, donor.data.first_name, donor.data.middle_name].filter(Boolean).join(' ') : '…'
  const contacts = [donor.data?.phone && MASKS.phone(donor.data.phone), donor.data?.email].filter(Boolean).join(' · ')
  const regionName = regions.data?.find((item) => item.id === regionId)?.name ?? '…'
  const back = () => navigate(isPlasma ? '/booking/time' : presetCenter ? '/booking/date' : '/booking/center')

  return (
    <Screen
      header={
        <StepHeader
          title={isReschedule ? 'Проверьте новую запись' : 'Проверьте запись'}
          step={steps}
          total={steps}
          onBack={back}
        />
      }
      footer={
        <StickyFooter>
          <Button
            size="large"
            stretched
            loading={submitting || donor.isPending || daySlots.isLoading}
            disabled={submitting || noPlaces || (!isPlasma && !slotId)}
            onClick={submit}
          >
            {missing.length > 0 ? 'Заполнить данные' : isReschedule ? 'Перенести запись' : 'Записаться'}
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
        <SummarySection label="Регион" value={regionName} onEdit={region.openSheet} />
        <SummarySection
          label="Дата"
          value={formatDayMonthWeekday(parseISODate(date))}
          caption={isPlasma ? undefined : 'В любое время работы центра'}
          onEdit={() => navigate('/booking/date')}
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
        {isPlasma && slot && <SummarySection label="Время" value={slot.time} onEdit={() => navigate('/booking/time')} />}
        <SummarySection
          label="Контакты"
          value={donorName}
          caption={contacts || undefined}
          onEdit={() => openSettings('contacts')}
        />
      </SummaryCard>
      <div className={styles['booking-check__hints']}>
        {noPlaces && (
          <InfoRow
            icon={CalendarX}
            tone="red"
            title="В этом центре на эту дату мест не осталось"
            description="Выберите другую дату или центр"
          />
        )}
        {missing.length > 0 && (
          <InfoRow
            icon={UserRoundPen}
            tone="red"
            title="Заполните паспорт, полис ОМС и контакты"
            description="Один раз — в следующий раз подставим сами"
          />
        )}
        <InfoRow
          icon={Bell}
          title={<Typography.Text variant="detail" color="secondary">Напомним в чате MAX за день до донации</Typography.Text>}
        />
        <InfoRow icon={IdCard} title={<Typography.Text variant="detail" color="secondary">Не забудьте паспорт</Typography.Text>} />
      </div>
      <RegionSheet open={region.open} selectedId={regionId} onSelect={region.select} onClose={region.closeSheet} requireCenters />
      <ConfirmDialog
        open={slotTakenOpen}
        title={isPlasma ? 'На это время мест не осталось' : 'На эту дату мест не осталось'}
        confirmText={isPlasma ? 'Выбрать другое время' : 'Выбрать другую дату'}
        cancelText="Закрыть"
        onConfirm={() => navigate(isPlasma ? '/booking/time' : '/booking/date')}
        onCancel={() => setSlotTakenOpen(false)}
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
