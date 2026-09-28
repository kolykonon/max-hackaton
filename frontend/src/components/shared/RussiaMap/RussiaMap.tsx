import { geoPath } from 'd3-geo'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { useMemo } from 'react'

import type { StockStatus } from '@/content/types'
import type { RegionFeature } from '@/hooks/useRussiaGeo'
import { cn } from '@/utils/cn'

import { createProjection } from './projection'
import { RegionPath } from './RegionPath'
import styles from './RussiaMap.module.scss'

interface RussiaMapProps {
  regions: RegionFeature[]
  getStatus: (code: string) => StockStatus
  /** Вписать карту в эти регионы. По умолчанию — вся Россия. */
  fitCodes?: string[]
  width?: number
  height?: number
  label: string
  className?: string
}

/**
 * Статичная карта субъектов РФ на SVG (d3-geo) — превью светофора на главной.
 * Лёгкая и без сети: интерактивные карты с улицами — на MapLibre (BaseMap).
 */
export const RussiaMap = ({ regions, getStatus, fitCodes, width = 1000, height = 600, label, className }: RussiaMapProps) => {
  const fitKey = fitCodes?.join(',') ?? ''
  const paths = useMemo(() => {
    const fitFeatures = fitKey ? regions.filter((region) => fitKey.split(',').includes(region.properties.code)) : regions
    const fitTo: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: fitFeatures.length ? fitFeatures : regions,
    }
    const path = geoPath(createProjection(fitTo, width, height, fitKey ? 24 : 8))
    return regions.map((region) => ({ code: region.properties.code, d: path(region) ?? '' }))
  }, [regions, fitKey, width, height])

  return (
    <svg className={cn(styles['russia-map'], className)} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {paths.map((item) => (
        <RegionPath key={item.code} d={item.d} code={item.code} status={getStatus(item.code)} />
      ))}
    </svg>
  )
}
