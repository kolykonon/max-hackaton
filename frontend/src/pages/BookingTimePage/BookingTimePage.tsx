import { Button, Typography } from '@maxhub/max-ui'
import { HeartHandshake } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useBookingSlots } from '@/api/hooks/booking'
import type { SlotPeriod } from '@/api/types'
import { SlotButton } from '@/components/features/booking-time/SlotButton/SlotButton'
import { SlotGroup } from '@/components/features/booking-time/SlotGroup/SlotGroup'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { bookingSteps, useBookingStore } from '@/store/booking'
import { formatDayMonthWeekday, parseISODate } from '@/utils/format'

import styles from './BookingTimePage.module.scss'

const PERIOD_LABEL: Record<SlotPeriod, string> = { morning: 'Утро', day: 'День', evening: 'Вечер' }

/** Шаг 4 — время, только для плазмы: окна по 30 минут, одно окно — один человек. */
export const BookingTimePage = () => {
  const navigate = useNavigate()
  const { donationType, date, center, slot, presetCenter, group, setSlot, releaseCenter } = useBookingStore()
  const slots = useBookingSlots(center?.id ?? null, donationType, date)

  if (!center || !date) return <Navigate to="/home" replace />
  // У цельной крови время не выбирают
  if (donationType !== 'plasma') return <Navigate to="/booking/check" replace />

  const pickOtherCenter = () => {
    releaseCenter()
    navigate('/booking/center')
  }

  const renderSlots = () => {
    if (slots.isPending) return <Skeleton height={260} />
    if (slots.isError) {
      return <ErrorState text="Не удалось загрузить время" retrying={slots.isFetching} onRetry={() => slots.refetch()} />
    }
    const hasFree = slots.data.groups.some((group) => group.slots.some((item) => item.is_free))
    if (!hasFree) {
      return (
        <div className={styles['booking-time__empty']}>
          <Typography.Text variant="body" color="secondary">
            На этот день всё занято
          </Typography.Text>
          <div className={styles['booking-time__empty-actions']}>
            <OutlineButton size="medium" onClick={pickOtherCenter}>
              Другой центр
            </OutlineButton>
            <OutlineButton size="medium" onClick={() => navigate('/booking/date')}>
              Другая дата
            </OutlineButton>
          </div>
        </div>
      )
    }
    return slots.data.groups.map((group) => (
      <SlotGroup key={group.period} title={PERIOD_LABEL[group.period]}>
        {group.slots.map((item) => (
          <SlotButton
            key={item.id}
            time={item.local_time}
            isFree={item.is_free}
            selected={item.id === slot?.id}
            onSelect={() => setSlot({ id: item.id, time: item.local_time })}
          />
        ))}
      </SlotGroup>
    ))
  }

  return (
    <Screen
      header={
        <StepHeader
          title="Выберите время"
          step={4}
          total={bookingSteps(donationType)}
          onBack={() => navigate(presetCenter ? '/booking/date' : '/booking/center')}
        />
      }
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={!slot} onClick={() => navigate('/booking/check')}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <div className={styles['booking-time__center']}>
        <Typography.Text variant="header">{center.name}</Typography.Text>
        <Typography.Text variant="body" color="secondary">
          {formatDayMonthWeekday(parseISODate(date))}
        </Typography.Text>
      </div>
      {group && group.date === date && group.centerId === center.id && group.booked.length > 0 && (
        <InfoRow
          icon={HeartHandshake}
          tone="red"
          title={group.booked.map((member) => `${member.name} — ${member.time}`).join(', ')}
          description="Уже записаны из вашей группы. Выберите время рядом"
          className={styles['booking-time__group']}
        />
      )}
      {renderSlots()}
    </Screen>
  )
}
