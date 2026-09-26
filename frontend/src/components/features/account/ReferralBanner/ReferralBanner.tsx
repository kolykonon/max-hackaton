import { Typography } from '@maxhub/max-ui'
import { ChevronRight, Users } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { plural } from '@/utils/format'

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
      {count > 0
        ? `Вы пригласили ${count} ${plural(count, ['друга', 'друзей', 'друзей'])}`
        : 'Пригласите друзей стать донорами'}
    </Typography.Text>
    <ChevronRight size={22} className={styles['referral-banner__chevron']} />
  </Card>
)
