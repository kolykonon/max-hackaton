import { SCALE_LEVELS } from '@/content/levels'

import styles from './LevelScale.module.scss'
import { LevelScaleStep } from './LevelScaleStep'

interface LevelScaleProps {
  total: number
}

/** Шкала уровней: 5 точек (1 · 5 · 10 · 20 · 40), пройденные закрашены. */
export const LevelScale = ({ total }: LevelScaleProps) => {
  const currentIndex = SCALE_LEVELS.reduce((index, level, i) => (total >= level.threshold ? i : index), -1)

  return (
    <ol className={styles['level-scale']} aria-label="Шкала уровней">
      {SCALE_LEVELS.map((level, index) => (
        <LevelScaleStep
          key={level.code}
          threshold={level.threshold}
          done={index <= currentIndex}
          current={index === currentIndex}
          lineDone={index < currentIndex}
          last={index === SCALE_LEVELS.length - 1}
        />
      ))}
    </ol>
  )
}
