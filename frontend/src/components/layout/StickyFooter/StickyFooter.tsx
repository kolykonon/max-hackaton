import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './StickyFooter.module.scss'

interface StickyFooterProps {
  children: ReactNode
  /** Над кнопками: подсказка или ошибка. */
  above?: ReactNode
  className?: string
}

/** Закреплённый низ экрана с основными кнопками. Несколько кнопок встают в ряд. */
export const StickyFooter = ({ children, above, className }: StickyFooterProps) => (
  <footer className={cn(styles['sticky-footer'], className)}>
    {above}
    <div className={styles['sticky-footer__actions']}>{children}</div>
  </footer>
)
