import { Lock, Star } from 'lucide-react'

import { cn } from '@/utils/cn'

import styles from './LevelBadge.module.scss'

interface LevelBadgeProps {
  /** Индекс уровня в SCALE_LEVELS — он определяет цвет значка. */
  index?: number
  locked?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

/** Единый значок уровня для карточки профиля и списка уровней. */
export const LevelBadge = ({ index, locked = false, size = 'large', className }: LevelBadgeProps) => (
  <span
    className={cn(
      styles['level-badge'],
      styles[`level-badge--${size}`],
      styles[index === undefined ? 'level-badge--future' : `level-badge--${index}`],
      locked && styles['level-badge--locked'],
      className,
    )}
    aria-hidden
  >
    {locked ? <Lock size="50%" /> : <Star size="52%" fill="currentColor" />}
  </span>
)
