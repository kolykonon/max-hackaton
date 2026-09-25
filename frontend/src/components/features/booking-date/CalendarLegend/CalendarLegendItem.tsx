import { Typography } from '@maxhub/max-ui'

import { cn } from '@/utils/cn'

import styles from './CalendarLegend.module.scss'

interface CalendarLegendItemProps {
  variant: 'available' | 'unavailable' | 'today'
  label: string
}

export const CalendarLegendItem = ({ variant, label }: CalendarLegendItemProps) => (
  <li className={styles['calendar-legend__item']}>
    <span className={cn(styles['calendar-legend__swatch'], styles[`calendar-legend__swatch--${variant}`])} aria-hidden />
    <Typography.Text variant="description" color="secondary">
      {label}
    </Typography.Text>
  </li>
)
