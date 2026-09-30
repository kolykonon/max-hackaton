import { Typography } from '@maxhub/max-ui'
import { Check } from 'lucide-react'

import { cn } from '@/utils/cn'
import { formatDonations, plural } from '@/utils/format'

import { LevelBadge } from '../LevelBadge/LevelBadge'
import styles from './DonorLevelsSheet.module.scss'

interface DonorLevelRowProps {
  /** Порядковый номер уровня — от него цвет значка. */
  index: number
  name: string
  threshold: number
  status: 'done' | 'current' | 'locked'
  remaining: number
}

export const DonorLevelRow = ({ index, name, threshold, status, remaining }: DonorLevelRowProps) => (
  <li className={cn(styles['donor-level-row'], styles[`donor-level-row--${status}`])}>
    <LevelBadge index={index} locked={status === 'locked'} />
    <div className={styles['donor-level-row__text']}>
      <Typography.Text variant="title">{name}</Typography.Text>
      <Typography.Text variant="detail" color="tertiary">
        от {threshold} {plural(threshold, ['донации', 'донаций', 'донаций'])}
      </Typography.Text>
    </div>
    <span className={styles['donor-level-row__status']}>
      {status === 'done' && (
        <>
          <Check size={16} strokeWidth={3} /> Получен
        </>
      )}
      {status === 'current' && 'Ваш уровень'}
      {status === 'locked' && `Осталось ${formatDonations(remaining)}`}
    </span>
  </li>
)
