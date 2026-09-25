import { Input, Typography } from '@maxhub/max-ui'
import { useId } from 'react'

import { cn } from '@/utils/cn'

import styles from './DataField.module.scss'

interface DataFieldProps {
  label: string
  value: string
  error?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  placeholder?: string
  autoFocus?: boolean
  onChange: (value: string) => void
  onBlur: () => void
}

/** Поле ввода с подписью сверху и ошибкой снизу. */
export const DataField = ({ label, value, error, inputMode, placeholder, autoFocus, onChange, onBlur }: DataFieldProps) => {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn(styles['data-field'], error && styles['data-field--invalid'])} data-invalid={Boolean(error)}>
      <Typography.Text variant="description" color="tertiary" asChild>
        <label htmlFor={id} className={styles['data-field__label']}>
          {label}
        </label>
      </Typography.Text>
      <Input
        id={id}
        value={value}
        inputMode={inputMode}
        type={inputMode === 'email' ? 'email' : 'text'}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        innerClassNames={{ container: styles['data-field__input'] }}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error && (
        <Typography.Text id={errorId} variant="description" className={styles['data-field__error']}>
          {error}
        </Typography.Text>
      )}
    </div>
  )
}
