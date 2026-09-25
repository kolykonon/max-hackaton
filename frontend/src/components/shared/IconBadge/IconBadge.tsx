import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Tone } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './IconBadge.module.scss'

export type IconBadgeSize = 's' | 'm' | 'l' | 'xl'

interface IconBadgeProps {
  icon?: LucideIcon
  /** Произвольное содержимое вместо иконки, например «18+». */
  children?: ReactNode
  tone?: Tone
  size?: IconBadgeSize
  className?: string
}

const ICON_SIZE: Record<IconBadgeSize, number> = { s: 18, m: 22, l: 24, xl: 32 }

export const IconBadge = ({ icon: Icon, children, tone = 'blue', size = 'm', className }: IconBadgeProps) => (
  <span className={cn(styles['icon-badge'], styles[`icon-badge--${tone}`], styles[`icon-badge--${size}`], className)} aria-hidden>
    {Icon ? <Icon size={ICON_SIZE[size]} strokeWidth={2} /> : children}
  </span>
)
