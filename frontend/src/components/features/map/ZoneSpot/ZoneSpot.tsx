import type { StockStatus } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './ZoneSpot.module.scss'

interface ZoneSpotProps {
  name: string
  status: StockStatus
  selected: boolean
  /** Положение и размер на заглушке карты, в процентах. */
  x: number
  y: number
  size: number
  onSelect: () => void
}

/** Зона на заглушке карты. В настоящей карте это будет path из topojson. */
export const ZoneSpot = ({ name, status, selected, x, y, size, onSelect }: ZoneSpotProps) => (
  <button
    type="button"
    className={cn(styles['zone-spot'], styles[`zone-spot--${status}`], selected && styles['zone-spot--selected'])}
    style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` }}
    aria-label={name}
    aria-pressed={selected}
    onClick={onSelect}
  />
)
