import { MapPin } from 'lucide-react'

import type { StockStatus } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './CenterMap.module.scss'

interface CenterPinProps {
  name: string
  status: StockStatus
  /** Положение на карте в процентах. */
  position: { x: number; y: number }
  selected: boolean
  onSelect: () => void
}

export const CenterPin = ({ name, status, position, selected, onSelect }: CenterPinProps) => (
  <button
    type="button"
    className={cn(styles['center-map__pin'], styles[`center-map__pin--${status}`], selected && styles['center-map__pin--selected'])}
    style={{ left: `${position.x}%`, top: `${position.y}%` }}
    aria-label={name}
    aria-pressed={selected}
    onClick={onSelect}
  >
    <MapPin size={selected ? 44 : 34} fill="currentColor" stroke="white" strokeWidth={1.5} />
  </button>
)
