import { IconButton } from '@maxhub/max-ui'
import { LocateFixed } from 'lucide-react'

import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import type { Center } from '@/content/demo'

import styles from './CenterMap.module.scss'
import { CenterPin } from './CenterPin'

interface CenterMapProps {
  regionName: string
  centers: Center[]
  selectedId: number | null
  onSelect: (id: number) => void
  onLocate: () => void
}

/** Вкладка «Карта»: карта региона с метками центров цвета светофора. */
export const CenterMap = ({ regionName, centers, selectedId, onSelect, onLocate }: CenterMapProps) => (
  <MapPlaceholder label={regionName} alt={`Карта центров крови: ${regionName}`} className={styles['center-map']}>
    {centers.map((center) => (
      <CenterPin key={center.id} center={center} selected={center.id === selectedId} onSelect={() => onSelect(center.id)} />
    ))}
    <IconButton
      size="large"
      variant="primary-contrast"
      aria-label="Показать моё местоположение"
      className={styles['center-map__locate']}
      onClick={onLocate}
    >
      <LocateFixed size={24} />
    </IconButton>
  </MapPlaceholder>
)
