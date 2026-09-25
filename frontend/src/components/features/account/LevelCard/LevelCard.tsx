import { Typography } from '@maxhub/max-ui'
import { Award, ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { DONOR_LEVELS, getLevelIndex } from '@/content/levels'
import { formatDonations } from '@/utils/format'

import { LevelScale } from '../LevelScale/LevelScale'
import styles from './LevelCard.module.scss'

interface LevelCardProps {
  total: number
  onOpen: () => void
}

const getCaption = (total: number): string => {
  const index = getLevelIndex(total)
  const next = DONOR_LEVELS[index + 1]
  if (total === 0) return 'Сдайте кровь первый раз — и получите уровень «Новичок»'
  if (!next) return `${formatDonations(total)} · максимальный уровень`
  return `${formatDonations(total)} · до уровня «${next.name}» осталось ${next.threshold - total}`
}

/** Блок «Уровень донора». Нажимается целиком — открывает шторку уровней. */
export const LevelCard = ({ total, onOpen }: LevelCardProps) => (
  <Card onClick={onOpen} className={styles['level-card']}>
    <div className={styles['level-card__head']}>
      <Award size={28} className={styles['level-card__icon']} />
      <Typography.Text variant="title" className={styles['level-card__title']}>
        Уровень: {DONOR_LEVELS[getLevelIndex(total)].name}
      </Typography.Text>
      <ChevronRight size={22} className={styles['level-card__chevron']} />
    </div>
    <LevelScale total={total} />
    <Typography.Text variant="description" color="secondary" className={styles['level-card__caption']}>
      {getCaption(total)}
    </Typography.Text>
  </Card>
)
