import { Input, Typography } from '@maxhub/max-ui'
import type { FactoryOpts } from 'imask'
import { useCallback, useEffect, useId, useMemo, useRef } from 'react'
import { useIMask } from 'react-imask'

import { cn } from '@/utils/cn'

import styles from './DataField.module.scss'

interface DataFieldProps {
  label: string
  value: string
  error?: string
  /** Шаблон IMask. Без него поле принимает любой текст. */
  mask?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  placeholder?: string
  autoFocus?: boolean
  onChange: (value: string) => void
  onBlur: () => void
}

const ANY_TEXT = /^.*$/

/**
 * Поле ввода с подписью сверху и ошибкой снизу.
 * Значение ведёт IMask (он же держит курсор при правке в середине), поэтому input неконтролируемый:
 * начальное значение — defaultValue, изменения приходят в onChange.
 */
export const DataField = ({ label, value, error, mask, inputMode, placeholder, autoFocus, onChange, onBlur }: DataFieldProps) => {
  const id = useId()
  const errorId = `${id}-error`
  const maskOptions = useMemo<FactoryOpts>(() => (mask ? { mask } : { mask: ANY_TEXT }), [mask])
  // useIMask пересоздаёт маску при новом onAccept, и курсор прыгает в конец. Держим колбэк стабильным
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })
  const onAccept = useCallback((accepted: string) => onChangeRef.current(accepted), [])
  const { ref } = useIMask<HTMLInputElement>(maskOptions, { defaultValue: value, onAccept })

  return (
    <div className={cn(styles['data-field'], error && styles['data-field--invalid'])} data-invalid={Boolean(error)}>
      <Typography.Text variant="description" color="tertiary" asChild>
        <label htmlFor={id} className={styles['data-field__label']}>
          {label}
        </label>
      </Typography.Text>
      <Input
        ref={ref}
        id={id}
        inputMode={inputMode}
        type={inputMode === 'email' ? 'email' : 'text'}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        innerClassNames={{ container: styles['data-field__input'] }}
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
