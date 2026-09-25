import { Typography } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { getLevelIndex, SCALE_LEVELS } from '@/content/levels'

import styles from './DonorLevelsSheet.module.scss'
import { DonorLevelRow } from './DonorLevelRow'

interface DonorLevelsSheetProps {
  open: boolean
  total: number
  onClose: () => void
}

export const DonorLevelsSheet = ({ open, total, onClose }: DonorLevelsSheetProps) => {
  const currentIndex = getLevelIndex(total) - 1

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Уровни донора"
      subtitle={
        <Typography.Text variant="detail" color="secondary">
          Уровень растёт с каждой донацией крови или плазмы
        </Typography.Text>
      }
      maxHeight={80}
    >
      {total === 0 && (
        <Typography.Text variant="body" className={styles['donor-levels-sheet__zero']}>
          Сдайте кровь в первый раз — и получите уровень «Новичок»
        </Typography.Text>
      )}
      <ul className={styles['donor-levels-sheet__list']}>
        {SCALE_LEVELS.map((level, index) => {
          let status: 'done' | 'current' | 'locked' = 'locked'
          if (index < currentIndex) status = 'done'
          if (index === currentIndex) status = 'current'
          return (
            <DonorLevelRow
              key={level.code}
              index={index}
              name={level.name}
              threshold={level.threshold}
              status={status}
              remaining={level.threshold - total}
            />
          )
        })}
      </ul>
    </BottomSheet>
  )
}
