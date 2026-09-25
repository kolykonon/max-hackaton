import { STATUS_LEGEND } from '@/content/status'
import type { StockStatus } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './StatusLegend.module.scss'
import { StatusLegendItem } from './StatusLegendItem'

interface StatusLegendProps {
  withNoData?: boolean
  className?: string
}

const STATUSES: StockStatus[] = ['urgent', 'low', 'enough', 'none']

/** Легенда светофора: «Нужна срочно · Мало · Достаточно (· Нет данных)». */
export const StatusLegend = ({ withNoData, className }: StatusLegendProps) => (
  <ul className={cn(styles['status-legend'], className)}>
    {STATUSES.filter((status) => withNoData || status !== 'none').map((status) => (
      <StatusLegendItem key={status} status={status} label={STATUS_LEGEND[status]} />
    ))}
  </ul>
)
