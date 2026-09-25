import { Button, Typography } from '@maxhub/max-ui'
import { Info, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Calendar } from '@/components/features/booking-date/Calendar/Calendar'
import { CalendarLegend } from '@/components/features/booking-date/CalendarLegend/CalendarLegend'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { SelectionSummary } from '@/components/shared/SelectionSummary/SelectionSummary'
import { SelectionSummaryItem } from '@/components/shared/SelectionSummary/SelectionSummaryItem'
import { DEMO_REGION, isDayAvailable, NEXT_ALLOWED_WHOLE, TODAY } from '@/content/demo'
import { useBookingMode } from '@/hooks/useBookingMode'
import { formatDayMonth } from '@/utils/format'

import styles from './BookingDatePage.module.scss'

const MONTHS_AHEAD = 2

const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth()

/** Шаг 2 — дата. */
export const BookingDatePage = () => {
  const navigate = useNavigate()
  const { isReschedule, withMode } = useBookingMode()
  // При открытии показан месяц с первой доступной датой
  const [month, setMonth] = useState(new Date(NEXT_ALLOWED_WHOLE.getFullYear(), NEXT_ALLOWED_WHOLE.getMonth(), 1))
  const [selected, setSelected] = useState<Date | null>(null)

  const shiftMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  const intervalActive = NEXT_ALLOWED_WHOLE > TODAY

  return (
    <Screen
      header={
        <StepHeader
          title="Выберите дату"
          step={2}
          onBack={() => (isReschedule ? navigate('/home?booked=1') : navigate('/booking/type'))}
        />
      }
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={!selected} onClick={() => navigate(withMode('/booking/center'))}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <SelectionSummary>
        <SelectionSummaryItem icon={<DonationIcon kind="whole_blood" size={18} />}>Цельная кровь</SelectionSummaryItem>
        <SelectionSummaryItem icon={<MapPin size={18} />}>{DEMO_REGION.name}</SelectionSummaryItem>
      </SelectionSummary>
      <Calendar
        month={month}
        today={TODAY}
        selected={selected}
        canGoPrev={monthIndex(month) > monthIndex(TODAY)}
        canGoNext={monthIndex(month) < monthIndex(TODAY) + MONTHS_AHEAD}
        isAvailable={isDayAvailable}
        onSelect={setSelected}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
      />
      <CalendarLegend />
      {intervalActive && (
        <div className={styles['booking-date__hint']}>
          <Info size={20} />
          <Typography.Text variant="detail" color="secondary">
            Из-за интервала после прошлой донации записаться можно с {formatDayMonth(NEXT_ALLOWED_WHOLE)}
          </Typography.Text>
        </div>
      )}
    </Screen>
  )
}
