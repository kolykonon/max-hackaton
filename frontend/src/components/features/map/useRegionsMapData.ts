import { useMemo } from 'react'

import { useMapCenters, useMapStatus } from '@/api/hooks/regions'
import type { BloodGroup, StockStatus } from '@/content/types'
import { useMoscowZones, useRussiaGeo } from '@/hooks/useRussiaGeo'

import { getZoneStatus, groupZonesByCenters, toMapPoints, zoneStatusesFromCenters } from './utils'

/**
 * Данные для RegionsMap: субъекты РФ, где Москва и область поделены на зоны вокруг центров крови,
 * и светофор каждой зоны по группе. Общие для экрана «Карта» и шага 3 записи — карты выглядят одинаково.
 */
export const useRegionsMapData = (group: BloodGroup | null) => {
  const geo = useRussiaGeo()
  const moscowZones = useMoscowZones()
  const status = useMapStatus()
  const centers = useMapCenters()

  const zones = useMemo(
    () => (moscowZones.data ? groupZonesByCenters(moscowZones.data, centers.data ?? []) : []),
    [moscowZones.data, centers.data],
  )
  // Москва и область на карте поделены на районы и округа — их статус считаем по центрам внутри
  const features = useMemo(() => {
    const parents = new Set(zones.map((zone) => zone.properties.parent))
    return [...(geo.data?.features ?? []).filter((region) => !parents.has(region.properties.code)), ...zones]
  }, [geo.data, zones])
  const zonesByCode = useMemo(
    () =>
      new Map(
        [...(status.data?.regions ?? []), ...zoneStatusesFromCenters(zones, centers.data ?? [])].map((zone) => [zone.code, zone]),
      ),
    [status.data, zones, centers.data],
  )
  const statuses = useMemo(
    () =>
      Object.fromEntries(
        [...zonesByCode.values()].map((item) => [item.code, getZoneStatus(item, group)]),
      ) as Record<string, StockStatus>,
    [zonesByCode, group],
  )
  const points = useMemo(() => toMapPoints(centers.data ?? [], group), [centers.data, group])

  return {
    geo,
    status,
    centers,
    zones,
    features,
    zonesByCode,
    statuses,
    points,
    isPending: geo.isPending || status.isPending || moscowZones.isPending || centers.isPending,
    isError: geo.isError || status.isError,
    isFetching: geo.isFetching || status.isFetching,
    refetch: () => Promise.all([geo.refetch(), status.refetch()]),
  }
}
