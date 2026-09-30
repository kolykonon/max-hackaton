import 'maplibre-gl/dist/maplibre-gl.css'

import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec'
import { type LngLatBoundsLike, Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl'
// MapLibre ищет воркер рядом со своим файлом, а после сборки Vite его там нет — собираем воркер сами
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import { cn } from '@/utils/cn'

import styles from './BaseMap.module.scss'

setWorkerUrl(maplibreWorkerUrl)

/** Бесплатные векторные тайлы OpenFreeMap: без ключа и лимитов, данные OpenStreetMap. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

interface BaseMapProps {
  /** Что показать при открытии. */
  bounds: LngLatBoundsLike
  /** Вызывается, когда стиль загружен и на карту можно добавлять слои. */
  onReady: (map: MapLibreMap) => void
  label: string
  /** Кнопки и карточки поверх карты. */
  children?: ReactNode
  className?: string
}

// В стилях OpenMapTiles подписи «Moskva Москва» — оставляем только русское название
const RUSSIAN_LABEL: ExpressionSpecification = ['coalesce', ['get', 'name:ru'], ['get', 'name:nonlatin'], ['get', 'name']]

const localizeLabels = (map: MapLibreMap) => {
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const textField = map.getLayoutProperty(layer.id, 'text-field')
    if (textField && JSON.stringify(textField).includes('name')) {
      map.setLayoutProperty(layer.id, 'text-field', RUSSIAN_LABEL)
    }
  }
}

/** Карта MapLibre с подложкой OpenFreeMap. Слои добавляют компоненты-наследники в onReady. */
export const BaseMap = ({ bounds, onReady, label, children, className }: BaseMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  const boundsRef = useRef(bounds)
  // До первой полной отрисовки (стиль + тайлы) поверх холста — фейковая карта; тайлы не пришли — так и остаётся
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    onReadyRef.current = onReady
  })

  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current!,
      style: STYLE_URL,
      bounds: boundsRef.current,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      // Поворот и наклон на телефоне только мешают
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    })
    map.touchZoomRotate.disableRotation()
    // Компактная атрибуция при появлении раскрыта и закрывает карту — сворачиваем, остаётся кнопка «i»
    const collapseAttribution = () => {
      const attribution = map.getContainer().querySelector('.maplibregl-compact')
      if (!attribution) return
      attribution.classList.remove('maplibregl-compact-show')
      map.off('styledata', collapseAttribution)
      map.off('sourcedata', collapseAttribution)
    }
    map.on('styledata', collapseAttribution)
    map.on('sourcedata', collapseAttribution)
    // style.load, а не load: load ждёт ещё и тайлы подложки, и при медленной сети слои не появились бы вовсе
    map.once('style.load', () => {
      localizeLabels(map)
      onReadyRef.current(map)
    })
    map.once('load', () => setLoaded(true))
    return () => map.remove()
  }, [])

  return (
    <div className={cn(styles['base-map'], className)}>
      <div ref={containerRef} className={styles['base-map__canvas']} role="region" aria-label={label} />
      {!loaded && <MapPlaceholder className={styles['base-map__placeholder']} />}
      {children}
    </div>
  )
}
