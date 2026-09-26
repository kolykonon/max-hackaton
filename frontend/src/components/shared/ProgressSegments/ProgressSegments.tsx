import { cn } from '@/utils/cn'

import styles from './ProgressSegments.module.scss'

interface ProgressSegmentsProps {
  total: number
  /** Номер текущего сегмента, с 1. Закрашены пройденные и текущий. */
  current: number
  className?: string
}

/** Прогресс «как в сторис»: онбординг и шаги записи. */
export const ProgressSegments = ({ total, current, className }: ProgressSegmentsProps) => (
  <div
    className={cn(styles['progress-segments'], className)}
    role="progressbar"
    aria-valuemin={1}
    aria-valuemax={total}
    aria-valuenow={current}
  >
    {Array.from({ length: total }, (_, index) => (
      <span
        key={index}
        className={cn(styles['progress-segments__item'], index < current && styles['progress-segments__item--done'])}
      />
    ))}
  </div>
)
