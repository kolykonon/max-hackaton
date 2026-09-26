import { Typography } from '@maxhub/max-ui'

import { cn } from '@/utils/cn'

import styles from './DataRow.module.scss'

interface DataRowProps {
  label: string
  value: string
  /** Пустое обязательное поле показывается как «Не указано» красным. */
  required?: boolean
}

/** Пара «подпись — значение» в режиме просмотра. */
export const DataRow = ({ label, value, required = true }: DataRowProps) => {
  const missing = required && !value.trim()

  return (
    <div className={styles['data-row']}>
      <Typography.Text variant="detail" color="tertiary" className={styles['data-row__label']}>
        {label}
      </Typography.Text>
      <Typography.Text variant="detail" className={cn(styles['data-row__value'], missing && styles['data-row__value--missing'])}>
        {missing ? 'Не указано' : value || '—'}
      </Typography.Text>
    </div>
  )
}
