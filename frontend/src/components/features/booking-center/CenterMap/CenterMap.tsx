import type { LngLatBoundsLike } from 'maplibre-gl'
import { useMemo, useRef } from 'react'

import type { BookingCenter } from '@/api/types'
import { type MapPoint, RegionsMap, type RegionsMapHandle } from '@/components/features/map/RegionsMap/RegionsMap'
import { useRegionsMapData } from '@/components/features/map/useRegionsMapData'
import { zoneAt } from '@/components/features/map/utils'
import { geometryBounds, RUSSIA_BOUNDS } from '@/components/shared/BaseMap/bounds'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { MapControls } from '@/components/shared/MapControls/MapControls'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import type { BloodGroup } from '@/content/types'
import type { RegionFeature } from '@/hooks/useRussiaGeo'

interface CenterMapProps {
  /** Код региона записи (RU-MOW) — к нему приближаемся, если центров нет. */
  regionCode: string | null
  /** Группа пользователя: по ней красим регионы, как на экране «Карта». */
  group: BloodGroup | null
  centers: BookingCenter[]
  selectedId: number | null
  onSelect: (center: BookingCenter) => void
  userLocation: { lat: number; lon: number } | null
  /** Геопозиции нет — показать уведомление. */
  onLocateFailed: () => void
}

const SINGLE_CENTER_DELTA = 0.02
const LOCATE_ZOOM = 13
const noop = () => {}

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

/** Вкладка «Карта» на шаге 3: та же карта, что на экране «Карта», но метки — только центры со свободными местами. */
export const CenterMap = ({ regionCode, group, centers, selectedId, onSelect, userLocation, onLocateFailed }: CenterMapProps) => {
  const mapRef = useRef<RegionsMapHandle>(null)
  const mapData = useRegionsMapData(group)
  const region = mapData.geo.data?.features.find((item) => item.properties.code === regionCode) ?? null
  const bounds = useMemo(() => initialBounds(centers, region), [centers, region])
  // Цвет метки — статус группы пользователя в этом центре
  const points = useMemo<MapPoint[]>(
    () => centers.map((center) => ({ id: center.id, lon: center.lon, lat: center.lat, status: center.group_status ?? 'none' })),
    [centers],
  )
  const selected = centers.find((center) => center.id === selectedId)
  // Обводим зону (район Москвы) или регион выбранного центра
  const selectedCode = (selected && zoneAt(mapData.zones, selected.lon, selected.lat)?.properties.code) ?? regionCode

  if (mapData.isPending) return <Skeleton height={420} radius="s" />
  if (mapData.isError) {
    return <ErrorState text="Не удалось загрузить карту" retrying={mapData.isFetching} onRetry={mapData.refetch} />
  }

  const selectCenter = (id: number) => {
    const center = centers.find((item) => item.id === id)
    if (center) onSelect(center)
  }

  const locate = () => {
    if (!userLocation) return onLocateFailed()
    mapRef.current?.flyTo(userLocation.lon, userLocation.lat, LOCATE_ZOOM)
  }

  return (
    <RegionsMap
      ref={mapRef}
      regions={mapData.features}
      statuses={mapData.statuses}
      selectedCode={selectedCode}
      onSelect={noop}
      userLocation={userLocation}
      bounds={bounds}
      centers={points}
      selectedCenterId={selectedId}
      onSelectCenter={selectCenter}
    >
      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLocate={locate}
      />
    </RegionsMap>
  )
}
