import { MapPin } from 'lucide-react'

import type { Center } from '@/content/demo'
import { cn } from '@/utils/cn'

import styles from './CenterMap.module.scss'

interface CenterPinProps {
  center: Center
  selected: boolean
  onSelect: () => void
}

export const CenterPin = ({ center, selected, onSelect }: CenterPinProps) => (
  <button
    type="button"
    className={cn(
      styles['center-map__pin'],
      styles[`center-map__pin--${center.groupStatus}`],
      selected && styles['center-map__pin--selected'],
    )}
    style={{ left: `${center.mapX}%`, top: `${center.mapY}%` }}
    aria-label={center.name}
    aria-pressed={selected}
    onClick={onSelect}
  >
    <MapPin size={selected ? 44 : 34} fill="currentColor" stroke="white" strokeWidth={1.5} />
  </button>
)
