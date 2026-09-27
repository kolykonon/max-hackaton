import type { StockStatus } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './RussiaMap.module.scss'

interface RegionPathProps {
  d: string
  code: string
  status: StockStatus
}

/** Один субъект РФ, залитый цветом светофора. */
export const RegionPath = ({ d, code, status }: RegionPathProps) => (
  <path d={d} data-code={code} className={cn(styles['russia-map__region'], styles[`russia-map__region--${status}`])} />
)
