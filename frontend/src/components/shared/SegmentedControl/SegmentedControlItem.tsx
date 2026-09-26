import type { ReactNode } from 'react'

import { haptic } from '@/bridge/max'
import { cn } from '@/utils/cn'

import styles from './SegmentedControl.module.scss'

interface SegmentedControlItemProps {
  selected: boolean
  onSelect: () => void
  before?: ReactNode
  children: ReactNode
}

export const SegmentedControlItem = ({ selected, onSelect, before, children }: SegmentedControlItemProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    className={cn(styles['segmented-control__item'], selected && styles['segmented-control__item--selected'])}
    onClick={() => {
      haptic.selection()
      onSelect()
    }}
  >
    {before}
    {children}
  </button>
)
