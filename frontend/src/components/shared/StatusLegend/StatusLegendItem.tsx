import { Typography } from '@maxhub/max-ui'

import type { StockStatus } from '@/content/types'

import { StatusDot } from '../StatusDot/StatusDot'
import styles from './StatusLegend.module.scss'

interface StatusLegendItemProps {
  status: StockStatus
  label: string
}

export const StatusLegendItem = ({ status, label }: StatusLegendItemProps) => (
  <li className={styles['status-legend__item']}>
    <StatusDot status={status} size="m" />
    <Typography.Text variant="description" color="secondary">
      {label}
    </Typography.Text>
  </li>
)
