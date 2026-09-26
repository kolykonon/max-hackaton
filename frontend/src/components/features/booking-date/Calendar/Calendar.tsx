import { IconButton, Typography } from '@maxhub/max-ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { useSwipe } from '@/hooks/useSwipe'
import { formatMonthYear, isSameDay } from '@/utils/format'

import styles from './Calendar.module.scss'
import { CalendarDay } from './CalendarDay'

interface CalendarProps {
  month: Date
  today: Date
  selected: Date | null
  canGoPrev: boolean
  canGoNext: boolean
  isAvailable: (date: Date) => boolean
  onSelect: (date: Date) => void
  onPrev: () => void
  onNext: () => void
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/** Дни сетки: с понедельника недели, в которую попало 1-е число, 6 недель. */
const getGridDays = (month: Date): Date[] => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const weeks = Math.ceil((offset + lastDay) / 7)
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i - offset + 1))
}

/** Календарь месяца с доступными днями. Месяцы листаются стрелками и свайпом. */
export const Calendar = ({ month, today, selected, canGoPrev, canGoNext, isAvailable, onSelect, onPrev, onNext }: CalendarProps) => {
  const swipe = useSwipe({
    onSwipeLeft: () => canGoNext && onNext(),
    onSwipeRight: () => canGoPrev && onPrev(),
  })

  return (
    <Card padding="m" className={styles.calendar}>
      <div className={styles.calendar__header}>
        <IconButton size="small" variant="ghost" aria-label="Предыдущий месяц" disabled={!canGoPrev} onClick={onPrev}>
          <ChevronLeft size={22} />
        </IconButton>
        <Typography.Text variant="title">{formatMonthYear(month)}</Typography.Text>
        <IconButton size="small" variant="ghost" aria-label="Следующий месяц" disabled={!canGoNext} onClick={onNext}>
          <ChevronRight size={22} />
        </IconButton>
      </div>
      <div className={styles.calendar__grid} role="grid" {...swipe}>
        {WEEKDAYS.map((weekday) => (
          <Typography.Text key={weekday} variant="description" color="tertiary" className={styles.calendar__weekday}>
            {weekday}
          </Typography.Text>
        ))}
        {getGridDays(month).map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            outside={date.getMonth() !== month.getMonth()}
            past={date < today}
            available={isAvailable(date)}
            isToday={isSameDay(date, today)}
            selected={selected !== null && isSameDay(date, selected)}
            onSelect={() => onSelect(date)}
          />
        ))}
      </div>
    </Card>
  )
}
