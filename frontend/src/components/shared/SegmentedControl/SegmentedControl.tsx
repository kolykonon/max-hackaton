import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './SegmentedControl.module.scss'

interface SegmentedControlProps {
  label: string
  children: ReactNode
  className?: string
}

/** Контейнер сегментов. Сегменты — SegmentedControlItem. */
export const SegmentedControl = ({ label, children, className }: SegmentedControlProps) => (
  <div role="radiogroup" aria-label={label} className={cn(styles['segmented-control'], className)}>
    {children}
  </div>
)
