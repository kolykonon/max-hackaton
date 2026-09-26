import { Typography } from '@maxhub/max-ui'
import { Users } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import { plural } from '@/utils/format'

import styles from './ReferralCounter.module.scss'

interface ReferralCounterProps {
  count: number
}

/** Счётчик приглашённых друзей. */
export const ReferralCounter = ({ count }: ReferralCounterProps) => (
  <Card padding="l" className={styles['referral-counter']}>
    <IconBadge icon={Users} size="xl" />
    <span className={styles['referral-counter__value']}>{count}</span>
    <Typography.Text variant="body" color="secondary">
      {count > 0 ? `${plural(count, ['друг принял', 'друга приняли', 'друзей приняли'])} приглашение` : 'Вы пока никого не пригласили'}
    </Typography.Text>
  </Card>
)
