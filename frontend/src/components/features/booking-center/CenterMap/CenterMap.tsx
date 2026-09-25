import { IconButton } from '@maxhub/max-ui'
import { LocateFixed } from 'lucide-react'

import type { BookingCenter } from '@/api/types'
import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'

import styles from './CenterMap.module.scss'
import { CenterPin } from './CenterPin'

interface CenterMapProps {
  regionName: string
  centers: BookingCenter[]
  selectedId: number | null
  onSelect: (center: BookingCenter) => void
  onLocate: () => void
}

/** Координаты → проценты на заглушке карты: вписываем все центры в рамку 15–85%. */
const toPositions = (centers: BookingCenter[]) => {
  const lats = centers.map((c) => c.lat)
  const lons = centers.map((c) => c.lon)
  const scale = (value: number, min: number, max: number) => (max === min ? 50 : 15 + ((value - min) / (max - min)) * 70)
  return new Map(
    centers.map((c) => [
      c.id,
      { x: scale(c.lon, Math.min(...lons), Math.max(...lons)), y: 100 - scale(c.lat, Math.min(...lats), Math.max(...lats)) },
    ]),
  )
}

/** Вкладка «Карта»: карта региона с метками центров цвета светофора. TODO: настоящая карта на d3-geo (FE2). */
export const CenterMap = ({ regionName, centers, selectedId, onSelect, onLocate }: CenterMapProps) => {
  const positions = toPositions(centers)

  return (
    <MapPlaceholder label={regionName} alt={`Карта центров крови: ${regionName}`} className={styles['center-map']}>
      {centers.map((center) => (
        <CenterPin
          key={center.id}
          name={center.name}
          status={center.group_status ?? 'none'}
          position={positions.get(center.id)!}
          selected={center.id === selectedId}
          onSelect={() => onSelect(center)}
        />
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
}
