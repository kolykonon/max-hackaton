import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'

import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import type { Tone } from '@/content/types'

import styles from './InviteHero.module.scss'

interface InviteHeroProps {
  icon: LucideIcon
  tone?: Tone
  title: string
  text: string
}

/** Шапка экрана приглашения: иконка, заголовок и пояснение. */
export const InviteHero = ({ icon, tone = 'red', title, text }: InviteHeroProps) => (
  <div className={styles['invite-hero']}>
    <IconBadge icon={icon} tone={tone} size="xl" className={styles['invite-hero__icon']} />
    <Typography.Text variant="hero" className={styles['invite-hero__title']}>
      {title}
    </Typography.Text>
    <Typography.Text variant="body" color="secondary">
      {text}
    </Typography.Text>
  </div>
)
