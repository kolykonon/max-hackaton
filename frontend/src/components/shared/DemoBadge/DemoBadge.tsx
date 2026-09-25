import { cn } from '@/utils/cn'

import styles from './DemoBadge.module.scss'

interface DemoBadgeProps {
  variant?: 'themed' | 'neutral' | 'overlay'
  className?: string
}

/** Метка «Демо-данные». */
export const DemoBadge = ({ variant = 'themed', className }: DemoBadgeProps) => (
  <span className={cn(styles['demo-badge'], styles[`demo-badge--${variant}`], className)}>Демо-данные</span>
)
