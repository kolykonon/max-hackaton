import { cn } from '@/utils/cn'

import styles from './Skeleton.module.scss'

interface SkeletonProps {
  height: number
  width?: number | string
  radius?: 's' | 'l' | 'round'
  className?: string
}

/** Серая заглушка на время загрузки. */
export const Skeleton = ({ height, width = '100%', radius = 'l', className }: SkeletonProps) => (
  <span
    className={cn(styles.skeleton, styles[`skeleton--${radius}`], className)}
    style={{ height, width }}
    aria-hidden
  />
)
