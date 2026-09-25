import { Typography } from '@maxhub/max-ui'
import { ChevronRight, Clock } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'

import styles from './HistoryButton.module.scss'

interface HistoryButtonProps {
  onOpen: () => void
}

export const HistoryButton = ({ onOpen }: HistoryButtonProps) => (
  <Card onClick={onOpen} className={styles['history-button']}>
    <Clock size={24} className={styles['history-button__icon']} />
    <Typography.Text variant="title" className={styles['history-button__text']}>
      История донаций
    </Typography.Text>
    <ChevronRight size={22} className={styles['history-button__chevron']} />
  </Card>
)
