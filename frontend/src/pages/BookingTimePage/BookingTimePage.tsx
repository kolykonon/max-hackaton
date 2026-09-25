import { Button, Typography } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SlotButton } from '@/components/features/booking-time/SlotButton/SlotButton'
import { SlotGroup } from '@/components/features/booking-time/SlotGroup/SlotGroup'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { DEMO_APPOINTMENT, SLOT_GROUPS } from '@/content/demo'
import { useBookingMode } from '@/hooks/useBookingMode'
import { formatDayMonthWeekday } from '@/utils/format'

import styles from './BookingTimePage.module.scss'

/** Шаг 4 — время. */
export const BookingTimePage = () => {
  const navigate = useNavigate()
  const { withMode } = useBookingMode()
  const [slotId, setSlotId] = useState<number | null>(null)

  return (
    <Screen
      header={<StepHeader title="Выберите время" step={4} onBack={() => navigate(withMode('/booking/center'))} />}
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={!slotId} onClick={() => navigate(withMode('/booking/check'))}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <div className={styles['booking-time__center']}>
        <Typography.Text variant="header">{DEMO_APPOINTMENT.center.name}</Typography.Text>
        <Typography.Text variant="body" color="secondary">
          {formatDayMonthWeekday(DEMO_APPOINTMENT.date)}
        </Typography.Text>
      </div>
      {SLOT_GROUPS.filter((group) => group.slots.length > 0).map((group) => (
        <SlotGroup key={group.period} title={group.period}>
          {group.slots.map((slot) => (
            <SlotButton
              key={slot.id}
              time={slot.time}
              isFree={slot.isFree}
              selected={slot.id === slotId}
              onSelect={() => setSlotId(slot.id)}
            />
          ))}
        </SlotGroup>
      ))}
    </Screen>
  )
}
