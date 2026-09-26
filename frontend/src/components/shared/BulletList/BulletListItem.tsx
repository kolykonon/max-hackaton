import { Typography } from '@maxhub/max-ui'
import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './BulletList.module.scss'

export type BulletMarker = 'dot' | 'dot-red' | 'check' | 'cross' | 'number'

interface BulletListItemProps {
  marker?: BulletMarker
  /** Номер для marker="number". */
  index?: number
  size?: 'body' | 'detail'
  children: ReactNode
}

const renderMarker = (marker: BulletMarker, index?: number) => {
  switch (marker) {
    case 'check':
      return <Check size={16} strokeWidth={3} />
    case 'cross':
      return <X size={16} strokeWidth={3} />
    case 'number':
      return `${index}.`
    default:
      return null
  }
}

export const BulletListItem = ({ marker = 'dot', index, size = 'body', children }: BulletListItemProps) => (
  <li className={cn(styles['bullet-list__item'], styles[`bullet-list__item--${marker}`])}>
    <span className={styles['bullet-list__marker']} aria-hidden>
      {renderMarker(marker, index)}
    </span>
    <Typography.Text variant={size} className={styles['bullet-list__text']}>
      {children}
    </Typography.Text>
  </li>
)
