import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Tone } from '@/content/types'
import { cn } from '@/utils/cn'

import { IconBadge, type IconBadgeSize } from '../IconBadge/IconBadge'
import styles from './InfoRow.module.scss'

interface InfoRowProps {
  icon?: LucideIcon
  badge?: ReactNode
  tone?: Tone
  size?: IconBadgeSize
  title: ReactNode
  description?: ReactNode
  /** Жирный заголовок — для списков льгот и ограничений. */
  strong?: boolean
  className?: string
}

/** Строка «иконка в кружке + заголовок и пояснение». */
export const InfoRow = ({ icon, badge, tone, size = 'm', title, description, strong, className }: InfoRowProps) => (
  <div className={cn(styles['info-row'], !description && styles['info-row--single'], className)}>
    <IconBadge icon={icon} tone={tone} size={size}>
      {badge}
    </IconBadge>
    <div className={styles['info-row__text']}>
      <Typography.Text variant={strong ? 'body-strong' : 'body'} className={styles['info-row__title']}>
        {title}
      </Typography.Text>
      {description && (
        <Typography.Text variant="detail" color="secondary" className={styles['info-row__description']}>
          {description}
        </Typography.Text>
      )}
    </div>
  </div>
)
