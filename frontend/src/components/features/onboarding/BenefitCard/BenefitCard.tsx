import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'

import styles from './BenefitCard.module.scss'

interface BenefitCardProps {
  icon: LucideIcon
  title: string
  description: string
}

/** Карточка льготы на экране 2 онбординга. */
export const BenefitCard = ({ icon: Icon, title, description }: BenefitCardProps) => (
  <Card className={styles['benefit-card']}>
    <span className={styles['benefit-card__icon']} aria-hidden>
      <Icon size={28} />
    </span>
    <div className={styles['benefit-card__text']}>
      <Typography.Text variant="title" className={styles['benefit-card__title']}>
        {title}
      </Typography.Text>
      <Typography.Text variant="detail" color="secondary" className={styles['benefit-card__description']}>
        {description}
      </Typography.Text>
    </div>
  </Card>
)
