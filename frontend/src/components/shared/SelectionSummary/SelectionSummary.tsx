import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './SelectionSummary.module.scss'

interface SelectionSummaryProps {
  children: ReactNode
  className?: string
}

/** Плашка «что выбрано» на шагах записи: «Цельная кровь · Москва · 14 октября». */
export const SelectionSummary = ({ children, className }: SelectionSummaryProps) => (
  <div className={cn(styles['selection-summary'], className)}>{children}</div>
)
