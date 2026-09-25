import { cn } from '@/utils/cn'

import styles from './LevelScale.module.scss'

interface LevelScaleStepProps {
  threshold: number
  done: boolean
  current: boolean
  /** Закрашен ли отрезок до следующей точки. */
  lineDone: boolean
  last: boolean
}

export const LevelScaleStep = ({ threshold, done, current, lineDone, last }: LevelScaleStepProps) => (
  <li className={styles['level-scale__step']}>
    <div className={styles['level-scale__track']}>
      <span
        className={cn(
          styles['level-scale__point'],
          done && styles['level-scale__point--done'],
          current && styles['level-scale__point--current'],
        )}
      />
      {!last && <span className={cn(styles['level-scale__line'], lineDone && styles['level-scale__line--done'])} />}
    </div>
    <span className={styles['level-scale__value']}>{threshold}</span>
  </li>
)
