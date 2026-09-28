import { IconButton } from '@maxhub/max-ui'
import { LocateFixed } from 'lucide-react'
import { type LngLatBoundsLike, type Map as MapLibreMap, Marker } from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { BookingCenter } from '@/api/types'
import { BaseMap } from '@/components/shared/BaseMap/BaseMap'
import { geometryBounds, RUSSIA_BOUNDS } from '@/components/shared/BaseMap/bounds'
import type { RegionFeature } from '@/hooks/useRussiaGeo'

import styles from './CenterMap.module.scss'
import { createPinElement, setPinSelected } from './pinElement'

interface CenterMapProps {
  region: RegionFeature | null
  regionName: string
  centers: BookingCenter[]
  selectedId: number | null
  onSelect: (center: BookingCenter) => void
  userLocation: { lat: number; lon: number } | null
  /** Геопозиции нет — показать уведомление. */
  onLocateFailed: () => void
}

const SINGLE_CENTER_DELTA = 0.02

/** Что показать при открытии: все центры, один центр с окрестностями или регион целиком. */
const initialBounds = (centers: BookingCenter[], region: RegionFeature | null): LngLatBoundsLike => {
  if (centers.length > 1) {
    return geometryBounds({ type: 'MultiPoint', coordinates: centers.map((c) => [c.lon, c.lat]) }) ?? RUSSIA_BOUNDS
  }
  if (centers.length === 1) {
    const { lon, lat } = centers[0]
    return [
      [lon - SINGLE_CENTER_DELTA, lat - SINGLE_CENTER_DELTA],
      [lon + SINGLE_CENTER_DELTA, lat + SINGLE_CENTER_DELTA],
    ]
  }
  return (region && geometryBounds(region.geometry)) ?? RUSSIA_BOUNDS
}

/** Вкладка «Карта» на шаге 3: улицы, граница региона и метки центров цвета светофора вашей группы. */
export const CenterMap = ({ region, regionName, centers, selectedId, onSelect, userLocation, onLocateFailed }: CenterMapProps) => {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const pins = useRef(new Map<number, HTMLElement>())
  const onSelectRef = useRef(onSelect)
  const bounds = useMemo(() => initialBounds(centers, region), [centers, region])

  useEffect(() => {
    onSelectRef.current = onSelect
  })

  const onReady = (instance: MapLibreMap) => {
    if (region) {
      instance.addSource('region', { type: 'geojson', data: region })
      instance.addLayer({
        id: 'region-border',
        type: 'line',
        source: 'region',
        paint: { 'line-color': '#007aff', 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [2, 2] },
      })
    }
    setMap(instance)
  }

  // Метки центров пересоздаём, только когда меняется список
  useEffect(() => {
    if (!map) return
    const elements = pins.current
    const markers = centers.map((center) => {
      const element = createPinElement(center.name, center.group_status ?? 'none', () => onSelectRef.current(center))
      elements.set(center.id, element)
      return new Marker({ element, anchor: 'bottom' }).setLngLat([center.lon, center.lat]).addTo(map)
    })
    return () => {
      markers.forEach((marker) => marker.remove())
      elements.clear()
    }
  }, [map, centers])

  useEffect(() => {
    pins.current.forEach((element, id) => setPinSelected(element, id === selectedId))
    const selected = centers.find((center) => center.id === selectedId)
    if (map && selected) map.easeTo({ center: [selected.lon, selected.lat], duration: 400 })
  }, [map, selectedId, centers])

  // Точка «вы здесь», если геопозиция есть
  useEffect(() => {
    if (!map || !userLocation) return
    const element = document.createElement('div')
    element.className = styles['center-map__me']
    const marker = new Marker({ element }).setLngLat([userLocation.lon, userLocation.lat]).addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, userLocation])

  const locate = () => {
    if (!map || !userLocation) return onLocateFailed()
    map.flyTo({ center: [userLocation.lon, userLocation.lat], zoom: 13 })
  }

  return (
    <BaseMap bounds={bounds} onReady={onReady} label={`Карта центров крови: ${regionName}`} className={styles['center-map']}>
      <IconButton
        size="large"
        variant="primary-contrast"
        aria-label="Показать моё местоположение"
        className={styles['center-map__locate']}
        onClick={locate}
      >
        <LocateFixed size={24} />
      </IconButton>
    </BaseMap>
  )
}
