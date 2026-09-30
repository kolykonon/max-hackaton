import { Typography } from '@maxhub/max-ui'
import { ChevronRight, Users } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'

import styles from './ReferralBanner.module.scss'

interface ReferralBannerProps {
  count: number
  onOpen: () => void
}

/** Плашка рефералов. */
export const ReferralBanner = ({ count, onOpen }: ReferralBannerProps) => (
  <Card onClick={onOpen} className={styles['referral-banner']}>
    <Users size={26} className={styles['referral-banner__icon']} />
    <Typography.Text variant="title" className={styles['referral-banner__text']}>
      Приглашённые друзья
    </Typography.Text>
    <span className={styles['referral-banner__action']}>
      <span className={styles['referral-banner__count']}>{count}</span>
      <ChevronRight size={22} className={styles['referral-banner__chevron']} />
    </span>
  </Card>
)
