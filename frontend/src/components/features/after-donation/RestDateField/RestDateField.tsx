import { Input, Typography } from '@maxhub/max-ui'
import { useId } from 'react'

import { cn } from '@/utils/cn'

import styles from './RestDateField.module.scss'

interface RestDateFieldProps {
  value: string
  /** Первый возможный день — следующий после донации. */
  min: string
  max: string
  error?: string
  onChange: (value: string) => void
}

/** Желаемый день отдыха. Системный выбор даты — в WebView MAX он привычнее своего календаря. */
export const RestDateField = ({ value, min, max, error, onChange }: RestDateFieldProps) => {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn(styles['rest-date-field'], error && styles['rest-date-field--invalid'])}>
      <Typography.Text variant="description" color="tertiary" asChild>
        <label htmlFor={id}>Желаемый день отдыха</label>
      </Typography.Text>
      <Input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        innerClassNames={{ container: styles['rest-date-field__input'] }}
        onChange={(event) => onChange(event.target.value)}
      />
      <Typography.Text id={errorId} variant="description" className={styles['rest-date-field__hint']}>
        {error ?? 'Можно оставить пустым и вписать от руки'}
      </Typography.Text>
    </div>
  )
}
