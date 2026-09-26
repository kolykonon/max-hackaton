import { cn } from '@/utils/cn'
import { formatDayMonth } from '@/utils/format'

import styles from './Calendar.module.scss'

interface CalendarDayProps {
  date: Date
  /** День соседнего месяца — показываем бледно и не даём выбрать. */
  outside: boolean
  past: boolean
  available: boolean
  isToday: boolean
  selected: boolean
  onSelect: () => void
}

export const CalendarDay = ({ date, outside, past, available, isToday, selected, onSelect }: CalendarDayProps) => {
  const selectable = available && !outside

  let state = 'unavailable'
  if (outside || past) state = 'disabled'
  else if (selected) state = 'selected'
  else if (available) state = 'available'

  return (
    <button
      type="button"
      role="gridcell"
      className={cn(styles.calendar__day, styles[`calendar__day--${state}`], isToday && styles['calendar__day--today'])}
      disabled={!selectable}
      aria-selected={selected}
      aria-label={`${formatDayMonth(date)}${selectable ? ', есть места' : ''}`}
      onClick={onSelect}
    >
      {date.getDate()}
    </button>
  )
}
