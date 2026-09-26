import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import styles from './SelectionSummary.module.scss'

interface SelectionSummaryItemProps {
  icon: ReactNode
  children: ReactNode
}

export const SelectionSummaryItem = ({ icon, children }: SelectionSummaryItemProps) => (
  <span className={styles['selection-summary__item']}>
    <span className={styles['selection-summary__icon']}>{icon}</span>
    <Typography.Text variant="description" color="secondary">
      {children}
    </Typography.Text>
  </span>
)
