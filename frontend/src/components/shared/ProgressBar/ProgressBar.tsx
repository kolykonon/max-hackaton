import { cn } from '@/utils/cn'

import styles from './ProgressBar.module.scss'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  className?: string
}

export const ProgressBar = ({ value, max, label, className }: ProgressBarProps) => {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div
      className={cn(styles['progress-bar'], className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span className={styles['progress-bar__fill']} style={{ width: `${Math.max(percent, 2)}%` }} />
    </div>
  )
}
