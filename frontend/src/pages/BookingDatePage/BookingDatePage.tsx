import { Button, Typography } from '@maxhub/max-ui'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useBookingDates } from '@/api/hooks/booking'
import { Calendar } from '@/components/features/booking-date/Calendar/Calendar'
import { CalendarLegend } from '@/components/features/booking-date/CalendarLegend/CalendarLegend'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { BookingSummary } from '@/components/shared/BookingSummary/BookingSummary'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { useBookingStore } from '@/store/booking'
import { formatDayMonth, parseISODate, startOfDay, toISODate } from '@/utils/format'

import styles from './BookingDatePage.module.scss'

const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth()
const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

export const BookingDatePage = () => {
  const navigate = useNavigate()
  const { donationType, regionId, date, rescheduleId, presetCenter, setDate } = useBookingStore()
  const dates = useBookingDates(regionId, donationType)
  const [shownMonth, setShownMonth] = useState<Date | null>(null)

  if (regionId === null) return <Navigate to="/home" replace />

  const data = dates.data
  const today = startOfDay(new Date())
  const availableDays = new Set(data?.days.filter((day) => day.available).map((day) => day.date))
  const lastDay = data ? parseISODate(data.to) : today
  const month = shownMonth ?? firstOfMonth(data?.first_available ? parseISODate(data.first_available) : today)
  const earliest = data ? parseISODate(data.earliest_allowed) : today

  const renderCalendar = () => {
    if (dates.isPending) return <Skeleton height={360} />
    if (dates.isError) {
      return <ErrorState text="Не удалось загрузить даты" retrying={dates.isFetching} onRetry={() => dates.refetch()} />
    }
    return (
      <>
        <Calendar
          month={month}
          today={today}
          selected={date ? parseISODate(date) : null}
          canGoPrev={monthIndex(month) > monthIndex(today)}
          canGoNext={monthIndex(month) < monthIndex(lastDay)}
          isAvailable={(day) => availableDays.has(toISODate(day))}
          onSelect={(day) => setDate(toISODate(day))}
          onPrev={() => setShownMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          onNext={() => setShownMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        />
        <CalendarLegend />
        {earliest > today && (
          <div className={styles['booking-date__hint']}>
            <Info size={20} />
            <Typography.Text variant="detail" color="secondary">
              Из-за интервала после прошлой донации записаться можно с {formatDayMonth(earliest)}
            </Typography.Text>
          </div>
        )}
        {!dates.data.first_available && (
          <div className={styles['booking-date__empty']}>
            <Typography.Text variant="body" color="secondary">
              В ближайшие 2 месяца свободных мест нет. Попробуйте другой регион или вид донации
            </Typography.Text>
            <OutlineButton size="medium" onClick={() => navigate('/booking/type')}>
              Изменить
            </OutlineButton>
          </div>
        )}
      </>
    )
  }

  return (
    <Screen
      header={
        <StepHeader
          title="Выберите дату"
          step={2}
          onBack={() => navigate(rescheduleId ? '/home' : '/booking/type')}
        />
      }
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={!date} onClick={() => navigate(presetCenter ? '/booking/time' : '/booking/center')}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <BookingSummary />
      {renderCalendar()}
    </Screen>
  )
}
