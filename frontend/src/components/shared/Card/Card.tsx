import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './Card.module.scss'

export type CardVariant = 'outlined' | 'filled' | 'selected' | 'promo'
export type CardPadding = 'none' | 's' | 'm' | 'l'

interface CardProps extends Omit<ComponentProps<'div'>, 'onClick'> {
  variant?: CardVariant
  padding?: CardPadding
  onClick?: () => void
  children: ReactNode
}

/** Базовая карточка. С onClick становится кнопкой. */
export const Card = ({ variant = 'outlined', padding = 'm', onClick, className, children, ...rest }: CardProps) => {
  const classes = cn(
    styles.card,
    styles[`card--${variant}`],
    styles[`card--padding-${padding}`],
    onClick && styles['card--pressable'],
    className,
  )

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children}
      </button>
    )
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
