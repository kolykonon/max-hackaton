import { geoCentroid, geoContains, geoDistance } from 'd3-geo'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { feature, merge } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

import type { ApiStockStatus, MapCenter, MapStatus } from '@/api/types'
import { BLOOD_GROUPS } from '@/content/bloodGroups'
import type { BloodGroup, StockStatus } from '@/content/types'
import type { ZoneFeature } from '@/hooks/useRussiaGeo'

export type ZoneStatus = MapStatus['regions'][number]

/** Цвет зоны: статус выбранной группы, а без выбора — худший среди всех групп. */
export const getZoneStatus = (zone: ZoneStatus, group: BloodGroup | null): StockStatus =>
  group ? (zone.statuses[group] ?? 'none') : (zone.worst ?? 'none')

/** Метки центров для RegionsMap: цвет — статус выбранной группы, а без выбора — худший. */
export const toMapPoints = (centers: MapCenter[], group: BloodGroup | null) =>
  centers.map((center) => ({
    id: center.id,
    lon: center.lon,
    lat: center.lat,
    status: (group ? center.statuses[group] : center.worst) ?? ('none' as StockStatus),
  }))

/** Статусы по всем 8 группам: пропущенные — «нет данных». */
export const fillStatuses = (zone: ZoneStatus): Record<BloodGroup, StockStatus> =>
  Object.fromEntries(BLOOD_GROUPS.map((group) => [group, zone.statuses[group] ?? 'none'])) as Record<BloodGroup, StockStatus>

/** Регион без данных: statuses = {}, worst = null. */
export const hasZoneData = (zone: ZoneStatus): boolean => zone.worst !== null

const SEVERITY: Record<ApiStockStatus, number> = { enough: 1, low: 2, urgent: 3 }
const worse = (a: ApiStockStatus | null | undefined, b: ApiStockStatus): ApiStockStatus =>
  a && SEVERITY[a] >= SEVERITY[b] ? a : b

/** Зона, в которую попадает точка, — или null. */
export const zoneAt = (zones: ZoneFeature[], lon: number, lat: number): ZoneFeature | null =>
  zones.find((zone) => geoContains(zone, [lon, lat])) ?? null

/**
 * Статус районов Москвы и округов области — по центрам крови внутри: худший по каждой группе.
 * ponytail: перебор зон на каждый центр, O(центры × зоны); хватает на сотни центров, иначе — индекс по bbox.
 */
export const zoneStatusesFromCenters = (zones: ZoneFeature[], centers: MapCenter[]): ZoneStatus[] => {
  const byCode = new Map<string, ZoneStatus>(zones.map((zone) => [zone.properties.code, { code: zone.properties.code, statuses: {}, worst: null }]))
  for (const center of centers) {
    const zone = zoneAt(zones, center.lon, center.lat)
    if (!zone) continue
    const item = byCode.get(zone.properties.code)!
    for (const [group, status] of Object.entries(center.statuses) as [BloodGroup, ApiStockStatus][]) {
      item.statuses[group] = worse(item.statuses[group], status)
    }
    if (center.worst) item.worst = worse(item.worst, center.worst)
  }
  return [...byCode.values()]
}

/**
 * Склеивает районы Москвы и округа области вокруг центров крови: зона с центром — ядро группы,
 * остальные присоединяются к ядру ближайшего центра (от середины района). Так серых зон нет.
 * ponytail: ближайший по прямой от центроида — группа может выйти несвязной у кривых границ; нужна точность — назначать по соседству (topojson neighbors).
 */
export const groupZonesByCenters = (topology: Topology, centers: MapCenter[]): ZoneFeature[] => {
  const object = topology.objects.zones as GeometryCollection<ZoneFeature['properties']>
  const zones = (feature(topology, object) as FeatureCollection<Polygon | MultiPolygon, ZoneFeature['properties']>).features
  const seeds = centers
    .map((center) => ({ point: [center.lon, center.lat] as [number, number], zone: zones.findIndex((zone) => geoContains(zone, [center.lon, center.lat])) }))
    .filter((seed) => seed.zone >= 0)
  if (seeds.length === 0) return zones

  const groups = new Map<number, number[]>()
  zones.forEach((zone, index) => {
    const own = seeds.find((seed) => seed.zone === index)
    const centroid = geoCentroid(zone)
    const nearest = own ?? seeds.reduce((best, seed) => (geoDistance(centroid, seed.point) < geoDistance(centroid, best.point) ? seed : best))
    groups.set(nearest.zone, [...(groups.get(nearest.zone) ?? []), index])
  })

  return [...groups].map(([seed, members]) => {
    const { properties } = zones[seed]
    return {
      type: 'Feature',
      properties: { ...properties, name: members.length > 1 ? `${properties.name} и окрестности` : properties.name },
      geometry: merge(topology, members.map((index) => object.geometries[index]) as Parameters<typeof merge>[1]),
    }
  })
}
