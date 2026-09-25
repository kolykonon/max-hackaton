import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './SheetSection.module.scss'

interface SheetSectionProps {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}

/** Раздел внутри шторки: подзаголовок и содержимое, разделы разделены линией. */
export const SheetSection = ({ title, description, children, className }: SheetSectionProps) => (
  <section className={cn(styles['sheet-section'], className)}>
    {title && (
      <Typography.Text variant="subheader" className={styles['sheet-section__title']}>
        {title}
      </Typography.Text>
    )}
    {description && (
      <Typography.Text variant="detail" color="secondary" className={styles['sheet-section__description']}>
        {description}
      </Typography.Text>
    )}
    {children}
  </section>
)
