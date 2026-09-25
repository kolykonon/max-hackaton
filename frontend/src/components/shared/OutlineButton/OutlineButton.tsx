import { Button, type ButtonProps } from '@maxhub/max-ui'

import { cn } from '@/utils/cn'

import styles from './OutlineButton.module.scss'

interface OutlineButtonProps extends Omit<ButtonProps, 'variant'> {
  tone?: 'themed' | 'negative'
}

/** Контурная кнопка из макетов. У Max UI такого варианта нет, красим через его CSS-переменные. */
export const OutlineButton = ({ tone = 'themed', size = 'large', className, innerClassNames, ...rest }: OutlineButtonProps) => (
  <Button
    variant="secondary"
    size={size}
    className={cn(styles['outline-button'], styles[`outline-button--${tone}`], className)}
    innerClassNames={{ ...innerClassNames, content: cn(styles['outline-button__content'], innerClassNames?.content) }}
    {...rest}
  />
)
