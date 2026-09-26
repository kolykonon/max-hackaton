import type { StockStatus } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './StatusDot.module.scss'

interface StatusDotProps {
  status: StockStatus
  size?: 's' | 'm' | 'l'
  className?: string
}

/** Цветная точка светофора. */
export const StatusDot = ({ status, size = 's', className }: StatusDotProps) => (
  <span className={cn(styles['status-dot'], styles[`status-dot--${status}`], styles[`status-dot--${size}`], className)} aria-hidden />
)
