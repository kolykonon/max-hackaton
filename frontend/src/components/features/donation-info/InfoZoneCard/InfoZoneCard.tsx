import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import { TextLink } from '@/components/shared/TextLink/TextLink'
import type { Tone } from '@/content/types'

import styles from './InfoZoneCard.module.scss'

interface InfoZoneCardProps {
  icon: LucideIcon
  tone: Tone
  title: string
  linkText: string
  onLinkClick: () => void
  /** Список пунктов — BulletList. */
  children: ReactNode
}

/** Зона на экране «Запись на донорство»: иконка, заголовок, 3 пункта и ссылка на шторку. */
export const InfoZoneCard = ({ icon, tone, title, linkText, onLinkClick, children }: InfoZoneCardProps) => (
  <Card padding="l" className={styles['info-zone-card']}>
    <IconBadge icon={icon} tone={tone} size="xl" />
    <div className={styles['info-zone-card__content']}>
      <Typography.Text variant="subheader" className={styles['info-zone-card__title']}>
        {title}
      </Typography.Text>
      {children}
      <TextLink onClick={onLinkClick} className={styles['info-zone-card__link']}>
        {linkText}
      </TextLink>
    </div>
  </Card>
)
