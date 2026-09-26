import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './BulletList.module.scss'

interface BulletListProps {
  children: ReactNode
  gap?: 's' | 'm'
  ordered?: boolean
  className?: string
}

/** Список. Пункты — BulletListItem. */
export const BulletList = ({ children, gap = 's', ordered, className }: BulletListProps) => {
  const Tag = ordered ? 'ol' : 'ul'
  return <Tag className={cn(styles['bullet-list'], styles[`bullet-list--gap-${gap}`], className)}>{children}</Tag>
}
