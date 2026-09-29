import { Typography } from '@maxhub/max-ui'
import { BookOpen, ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'

import styles from './GuideButton.module.scss'

interface GuideButtonProps {
  onOpen: () => void
}

/** Ссылка на гид «Как стать донором» (тот же, что в онбординге, без согласия). */
export const GuideButton = ({ onOpen }: GuideButtonProps) => (
  <Card onClick={onOpen} className={styles['guide-button']}>
    <BookOpen size={24} className={styles['guide-button__icon']} />
    <Typography.Text variant="title" className={styles['guide-button__text']}>
      Как стать донором
    </Typography.Text>
    <ChevronRight size={22} className={styles['guide-button__chevron']} />
  </Card>
)
