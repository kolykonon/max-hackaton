import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { Card } from '@/components/shared/Card/Card'
import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'

import styles from './BloodCard.module.scss'

interface BloodCardProps {
  /** Показатели — BloodStat. */
  children: ReactNode
  /** Код донора — DonorCode. */
  footer: ReactNode
}

/** Карточка «Мои данные о крови». */
export const BloodCard = ({ children, footer }: BloodCardProps) => (
  <Card className={styles['blood-card']}>
    <div className={styles['blood-card__head']}>
      <DonationIcon kind="whole_blood" size={28} />
      <Typography.Text variant="title" className={styles['blood-card__title']}>
        Мои данные о крови
      </Typography.Text>
      <DemoBadge />
    </div>
    <dl className={styles['blood-card__stats']}>{children}</dl>
    <div className={styles['blood-card__footer']}>{footer}</div>
  </Card>
)
