import type { BookingCenter } from '@/api/types'

import { CenterCard } from '../CenterCard/CenterCard'
import styles from './CenterList.module.scss'

interface CenterListProps {
  centers: BookingCenter[]
  selectedId: number | null
  onSelect: (center: BookingCenter) => void
}

/** Вкладка «Список». Порядок уже отсортирован: сначала «нужна срочно», потом по расстоянию. */
export const CenterList = ({ centers, selectedId, onSelect }: CenterListProps) => (
  <ul className={styles['center-list']}>
    {centers.map((center) => (
      <li key={center.id}>
        <CenterCard center={center} selected={center.id === selectedId} onSelect={() => onSelect(center)} />
      </li>
    ))}
  </ul>
)
