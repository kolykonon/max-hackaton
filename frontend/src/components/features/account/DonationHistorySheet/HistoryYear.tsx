import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { formatDonations } from '@/utils/format'

import styles from './DonationHistorySheet.module.scss'

interface HistoryYearProps {
  year: number
  count: number
  /** Карточки донаций — HistoryItem. */
  children: ReactNode
}

/** Год с липким заголовком. */
export const HistoryYear = ({ year, count, children }: HistoryYearProps) => (
  <section className={styles['history-year']}>
    <Typography.Text variant="subheader" className={styles['history-year__title']}>
      {year} · {formatDonations(count)}
    </Typography.Text>
    <ul className={styles['history-year__list']}>{children}</ul>
  </section>
)
