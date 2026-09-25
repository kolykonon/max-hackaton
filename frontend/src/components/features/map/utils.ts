import type { MapZone } from '@/content/demo'
import type { BloodGroup, StockStatus } from '@/content/types'

const SEVERITY: StockStatus[] = ['urgent', 'low', 'enough', 'none']

/** Цвет зоны: статус выбранной группы, а без выбора — худший среди всех групп. */
export const getZoneStatus = (zone: MapZone, group: BloodGroup | null): StockStatus => {
  if (group) return zone.statuses[group]
  const statuses = Object.values(zone.statuses)
  return SEVERITY.find((status) => statuses.includes(status)) ?? 'none'
}

export const hasZoneData = (zone: MapZone): boolean => Object.values(zone.statuses).some((status) => status !== 'none')
