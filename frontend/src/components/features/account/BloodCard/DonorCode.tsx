import { IconButton, Typography } from '@maxhub/max-ui'
import { Copy } from 'lucide-react'

import styles from './BloodCard.module.scss'

interface DonorCodeProps {
  code: string
  onCopy: () => void
}

export const DonorCode = ({ code, onCopy }: DonorCodeProps) => (
  <div className={styles['blood-card__code']}>
    <Typography.Text variant="detail" color="tertiary">
      Код донора
    </Typography.Text>
    <span className={styles['blood-card__code-value']}>{code}</span>
    <IconButton size="small" variant="ghost" aria-label="Скопировать код донора" onClick={onCopy}>
      <Copy size={20} className={styles['blood-card__copy']} />
    </IconButton>
  </div>
)
