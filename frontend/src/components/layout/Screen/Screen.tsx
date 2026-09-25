import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './Screen.module.scss'

interface ScreenProps {
  /** Закреплённая шапка. */
  header?: ReactNode
  /** Закреплённый низ с кнопками. */
  footer?: ReactNode
  children: ReactNode
  /** Отступ под нижнее меню. */
  withTabBar?: boolean
  /** Без боковых отступов у содержимого — для карт на всю ширину. */
  flush?: boolean
  /** Содержимое по центру экрана (онбординг, «Вы записаны»). */
  centered?: boolean
  className?: string
  contentClassName?: string
}

/** Каркас экрана: шапка и низ закреплены, середина прокручивается. */
export const Screen = ({
  header,
  footer,
  children,
  withTabBar,
  flush,
  centered,
  className,
  contentClassName,
}: ScreenProps) => (
  <div className={cn(styles.screen, withTabBar && styles['screen--with-tabbar'], className)}>
    {header && <div className={styles.screen__header}>{header}</div>}
    <main
      className={cn(
        styles.screen__content,
        flush && styles['screen__content--flush'],
        centered && styles['screen__content--centered'],
        contentClassName,
      )}
    >
      {children}
    </main>
    {footer}
  </div>
)
