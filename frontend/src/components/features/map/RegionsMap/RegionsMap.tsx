import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec'
import type { FeatureCollection, Point } from 'geojson'
import { type GeoJSONSource, type LngLatBoundsLike, type Map as MapLibreMap, Marker } from 'maplibre-gl'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'

import { BaseMap } from '@/components/shared/BaseMap/BaseMap'
import { geometryBounds, RUSSIA_BOUNDS } from '@/components/shared/BaseMap/bounds'
import { STATUS_COLORS } from '@/content/status'
import type { StockStatus } from '@/content/types'
import type { RegionFeature } from '@/hooks/useRussiaGeo'

import styles from './RegionsMap.module.scss'

export interface RegionsMapHandle {
  zoomIn: () => void
  zoomOut: () => void
  /** Приблизить карту к региону целиком. */
  focusRegion: (code: string) => void
  /** Перелететь к точке. */
  flyTo: (lon: number, lat: number, zoom: number) => void
}

/** Метка центра крови: цвет по светофору. */
export interface MapPoint {
  id: number
  lon: number
  lat: number
  status: StockStatus
}

interface RegionsMapProps {
  regions: RegionFeature[]
  /** Статус региона для раскраски: по выбранной группе или худший. */
  statuses: Record<string, StockStatus>
  selectedCode: string | null
  onSelect: (code: string) => void
  userLocation: { lat: number; lon: number } | null
  /** Приблизить к этому региону один раз, как только карта загрузится (регион пользователя). */
  initialFocusCode?: string | null
  /** Центры крови — метки при приближении. */
  centers?: MapPoint[]
  /** Что показать при открытии, по умолчанию вся Россия. */
  bounds?: LngLatBoundsLike
  selectedCenterId: number | null
  onSelectCenter: (id: number) => void
  /** Кнопки поверх карты. */
  children?: ReactNode
  ref?: Ref<RegionsMapHandle>
}

const SOURCE = 'regions'
const FILL = 'regions-fill'
const BORDER = 'regions-border'
const SELECTED = 'regions-selected'
const CENTERS_SOURCE = 'centers'
const CENTERS = 'centers'
const CENTER_SELECTED = 'centers-selected'
/** С какого зума видны метки центров: на всю страну их слишком много. */
const CENTERS_MIN_ZOOM = 5

const centersGeoJson = (centers: MapPoint[]): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: centers.map((center) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [center.lon, center.lat] },
    properties: { id: center.id, color: STATUS_COLORS[center.status] },
  })),
})

const selectedCenterFilter = (id: number | null): ExpressionSpecification => ['==', ['get', 'id'], id ?? -1]

/** match по коду региона → цвет светофора; регионы без данных — серые. */
const colorExpression = (statuses: Record<string, StockStatus>): ExpressionSpecification | string => {
  const pairs = Object.entries(statuses).flatMap(([code, status]) => [code, STATUS_COLORS[status]])
  if (pairs.length === 0) return STATUS_COLORS.none
  // Типы style-spec не описывают match с переменным числом пар
  return ['match', ['get', 'code'], ...pairs, STATUS_COLORS.none] as unknown as ExpressionSpecification
}

const selectedFilter = (code: string | null): ExpressionSpecification => ['==', ['get', 'code'], code ?? '']

/** Донорский светофор поверх подложки с улицами: зум от всей страны до домов. */
export const RegionsMap = ({
  regions,
  statuses,
  selectedCode,
  onSelect,
  userLocation,
  initialFocusCode,
  centers,
  bounds = RUSSIA_BOUNDS,
  selectedCenterId,
  onSelectCenter,
  children,
  ref,
}: RegionsMapProps) => {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const onSelectRef = useRef(onSelect)
  const onSelectCenterRef = useRef(onSelectCenter)
  const centersData = useMemo(() => centersGeoJson(centers ?? []), [centers])
  const initial = useRef({ statuses, selectedCode, centersData, selectedCenterId })

  useEffect(() => {
    onSelectRef.current = onSelect
    onSelectCenterRef.current = onSelectCenter
  })

  const onReady = (instance: MapLibreMap) => {
    instance.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: regions } })
    // Слои регионов кладём под подписи городов, чтобы названия оставались читаемыми
    const firstLabel = instance.getStyle().layers.find((layer) => layer.type === 'symbol')?.id
    instance.addLayer(
      {
        id: FILL,
        type: 'fill',
        source: SOURCE,
        paint: {
          'fill-color': colorExpression(initial.current.statuses),
          // Чем ближе, тем прозрачнее — чтобы были видны улицы
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.8, 6, 0.5, 10, 0.25],
        },
      },
      firstLabel,
    )
    instance.addLayer(
      { id: BORDER, type: 'line', source: SOURCE, paint: { 'line-color': '#ffffff', 'line-width': 0.8 } },
      firstLabel,
    )
    instance.addLayer({
      id: SELECTED,
      type: 'line',
      source: SOURCE,
      filter: selectedFilter(initial.current.selectedCode),
      paint: { 'line-color': '#007aff', 'line-width': 3 },
    })
    instance.addSource(CENTERS_SOURCE, { type: 'geojson', data: initial.current.centersData })
    instance.addLayer({
      id: CENTERS,
      type: 'circle',
      source: CENTERS_SOURCE,
      minzoom: CENTERS_MIN_ZOOM,
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], CENTERS_MIN_ZOOM, 5, 10, 9, 14, 12],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    })
    instance.addLayer({
      id: CENTER_SELECTED,
      type: 'circle',
      source: CENTERS_SOURCE,
      minzoom: CENTERS_MIN_ZOOM,
      filter: selectedCenterFilter(initial.current.selectedCenterId),
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], CENTERS_MIN_ZOOM, 8, 10, 13, 14, 16],
        'circle-stroke-color': '#007aff',
        'circle-stroke-width': 3,
      },
    })

    instance.on('click', CENTERS, (event) => {
      const id = event.features?.[0]?.properties?.id
      if (typeof id === 'number') onSelectCenterRef.current(id)
    })
    instance.on('click', FILL, (event) => {
      // Тап по метке центра не должен заодно выбирать регион под ней
      if (instance.queryRenderedFeatures(event.point, { layers: [CENTERS] }).length > 0) return
      const code = event.features?.[0]?.properties?.code
      if (typeof code === 'string') onSelectRef.current(code)
    })
    instance.on('mouseenter', CENTERS, () => {
      instance.getCanvas().style.cursor = 'pointer'
    })
    instance.on('mouseleave', CENTERS, () => {
      instance.getCanvas().style.cursor = ''
    })
    setMap(instance)
  }

  useEffect(() => {
    map?.setPaintProperty(FILL, 'fill-color', colorExpression(statuses))
  }, [map, statuses])

  useEffect(() => {
    map?.setFilter(SELECTED, selectedFilter(selectedCode))
  }, [map, selectedCode])

  useEffect(() => {
    ;(map?.getSource(SOURCE) as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: regions })
  }, [map, regions])

  useEffect(() => {
    ;(map?.getSource(CENTERS_SOURCE) as GeoJSONSource | undefined)?.setData(centersData)
  }, [map, centersData])

  useEffect(() => {
    map?.setFilter(CENTER_SELECTED, selectedCenterFilter(selectedCenterId))
  }, [map, selectedCenterId])

  // Точка «вы здесь»
  useEffect(() => {
    if (!map || !userLocation) return
    const element = document.createElement('div')
    element.className = styles['regions-map__me']
    const marker = new Marker({ element }).setLngLat([userLocation.lon, userLocation.lat]).addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, userLocation])

  const focusRegion = (code: string) => {
    const region = regions.find((item) => item.properties.code === code)
    const bounds = region && geometryBounds(region.geometry)
    if (map && bounds) map.fitBounds(bounds, { padding: 40, maxZoom: 9 })
  }

  const focusedInitially = useRef(false)
  useEffect(() => {
    if (!map || !initialFocusCode || focusedInitially.current) return
    focusedInitially.current = true
    const region = regions.find((item) => item.properties.code === initialFocusCode)
    const bounds = region && geometryBounds(region.geometry)
    if (bounds) map.fitBounds(bounds, { padding: 40, maxZoom: 9 })
  }, [map, initialFocusCode, regions])

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => map?.zoomIn(),
      zoomOut: () => map?.zoomOut(),
      focusRegion,
      flyTo: (lon, lat, zoom) => map?.flyTo({ center: [lon, lat], zoom }),
    }),
  )

  return (
    <BaseMap bounds={bounds} onReady={onReady} label="Карта России с донорским светофором" className={styles['regions-map']}>
      {children}
    </BaseMap>
  )
}
