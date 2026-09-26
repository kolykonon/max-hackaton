import { Typography } from '@maxhub/max-ui'

import { Card } from '@/components/shared/Card/Card'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'

import styles from './HonoraryAchievedCard.module.scss'

interface HonoraryAchievedCardProps {
  onMore: () => void
}

/** Вместо целей, когда донаций для звания уже хватает. */
export const HonoraryAchievedCard = ({ onMore }: HonoraryAchievedCardProps) => (
  <Card variant="promo" padding="l" className={styles['honorary-achieved']}>
    <Typography.Text variant="title">🏅 Вы набрали донации для звания «Почётный донор России»</Typography.Text>
    <OutlineButton size="medium" stretched onClick={onMore}>
      Подробнее
    </OutlineButton>
  </Card>
)
