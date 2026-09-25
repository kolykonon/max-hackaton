import { Typography } from '@maxhub/max-ui'

import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'

import styles from './HonoraryEta.module.scss'

interface HonoraryEtaProps {
  eta: string
  onMore: () => void
}

/** Срок до звания и кнопка «Подробнее». */
export const HonoraryEta = ({ eta, onMore }: HonoraryEtaProps) => (
  <div className={styles['honorary-eta']}>
    <Typography.Text variant="body">
      До звания примерно <b>{eta}</b>
    </Typography.Text>
    <Typography.Text variant="description" color="tertiary">
      Если сдавать кровь и плазму так часто, как разрешено
    </Typography.Text>
    <OutlineButton size="medium" stretched className={styles['honorary-eta__button']} onClick={onMore}>
      Подробнее
    </OutlineButton>
  </div>
)
