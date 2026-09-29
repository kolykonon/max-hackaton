import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'

import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import type { Tone } from '@/content/types'

import styles from './GroupHero.module.scss'

interface GroupHeroProps {
  icon: LucideIcon
  tone?: Tone
  title: string
  text: string
}

/** Шапка экрана групповой донации: иконка, заголовок и пояснение. */
export const GroupHero = ({ icon, tone = 'red', title, text }: GroupHeroProps) => (
  <div className={styles['group-hero']}>
    <IconBadge icon={icon} tone={tone} size="xl" className={styles['group-hero__icon']} />
    <Typography.Text variant="hero" className={styles['group-hero__title']}>
      {title}
    </Typography.Text>
    <Typography.Text variant="body" color="secondary">
      {text}
    </Typography.Text>
  </div>
)
