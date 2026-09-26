import type { ReactNode } from 'react'

import { Card } from '@/components/shared/Card/Card'

import styles from './SummaryCard.module.scss'

interface SummaryCardProps {
  /** Разделы — SummarySection. */
  children: ReactNode
}

/** Сводка записи на шаге 5: разделы через тонкую линию. */
export const SummaryCard = ({ children }: SummaryCardProps) => (
  <Card padding="none" className={styles['summary-card']}>
    {children}
  </Card>
)
