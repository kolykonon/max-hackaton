import styles from './CalendarLegend.module.scss'
import { CalendarLegendItem } from './CalendarLegendItem'

/** Легенда: «Есть места · Нет мест · Сегодня». */
export const CalendarLegend = () => (
  <ul className={styles['calendar-legend']}>
    <CalendarLegendItem variant="available" label="Есть места" />
    <CalendarLegendItem variant="unavailable" label="Нет мест" />
    <CalendarLegendItem variant="today" label="Сегодня" />
  </ul>
)
