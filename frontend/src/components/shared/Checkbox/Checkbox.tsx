import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './Checkbox.module.scss'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  invalid?: boolean
  children: ReactNode
  className?: string
}

export const Checkbox = ({ checked, onChange, invalid, children, className }: CheckboxProps) => (
  <label className={cn(styles.checkbox, invalid && styles['checkbox--invalid'], className)}>
    <input
      type="checkbox"
      className={styles.checkbox__input}
      checked={checked}
      aria-invalid={invalid}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className={cn(styles.checkbox__box, checked && styles['checkbox__box--checked'])} aria-hidden>
      {checked && <Check size={18} strokeWidth={3} />}
    </span>
    <span className={styles.checkbox__label}>{children}</span>
  </label>
)
