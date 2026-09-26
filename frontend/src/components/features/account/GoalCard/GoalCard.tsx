import { Typography } from '@maxhub/max-ui'
import { ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { ProgressBar } from '@/components/shared/ProgressBar/ProgressBar'
import { DONATION_TYPE_INFO } from '@/content/donationTypes'
import type { DonationKind } from '@/content/types'

import styles from './GoalCard.module.scss'

interface GoalCardProps {
  kind: DonationKind
  count: number
  goal: number
  hint?: string
  onOpen: () => void
}

/** Карточка цели к званию: «Цельная кровь 10 из 40» с прогрессом. */
export const GoalCard = ({ kind, count, goal, hint, onOpen }: GoalCardProps) => {
  const info = DONATION_TYPE_INFO[kind]

  return (
    <Card onClick={onOpen} padding="s" className={styles['goal-card']}>
      <div className={styles['goal-card__head']}>
        <DonationIcon kind={kind} size={32} alt={info.alt} />
        <div className={styles['goal-card__text']}>
          <Typography.Text variant="detail" color="secondary">
            {info.cardTitle}
          </Typography.Text>
          <Typography.Text variant="title">
            {count} из {goal}
          </Typography.Text>
        </div>
        <ChevronRight size={20} className={styles['goal-card__chevron']} />
      </div>
      <ProgressBar value={count} max={goal} label={`${info.cardTitle}: ${count} из ${goal}`} />
      {hint && (
        <Typography.Text variant="description" color="tertiary" className={styles['goal-card__hint']}>
          {hint}
        </Typography.Text>
      )}
    </Card>
  )
}
