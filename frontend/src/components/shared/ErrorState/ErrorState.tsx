import { Typography } from '@maxhub/max-ui'
import { RotateCw } from 'lucide-react'

import { cn } from '@/utils/cn'

import { OutlineButton } from '../OutlineButton/OutlineButton'
import styles from './ErrorState.module.scss'

interface ErrorStateProps {
  text: string
  onRetry: () => void
  retrying?: boolean
  /** Компактный вариант — внутри карточки, а не по центру экрана. */
  compact?: boolean
  className?: string
}

/** «Не удалось загрузить …» и кнопка «Повторить». */
export const ErrorState = ({ text, onRetry, retrying, compact, className }: ErrorStateProps) => (
  <div className={cn(styles['error-state'], compact && styles['error-state--compact'], className)} role="alert">
    <Typography.Text variant="body" color="secondary">
      {text}
    </Typography.Text>
    <OutlineButton size="medium" iconBefore={<RotateCw size={18} />} loading={retrying} onClick={onRetry}>
      Повторить
    </OutlineButton>
  </div>
)
