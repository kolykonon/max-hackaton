import type { MapStatus } from '@/api/types'
import { BLOOD_GROUPS } from '@/content/bloodGroups'
import type { BloodGroup, StockStatus } from '@/content/types'

export type ZoneStatus = MapStatus['regions'][number]

/** Цвет зоны: статус выбранной группы, а без выбора — худший среди всех групп. */
export const getZoneStatus = (zone: ZoneStatus, group: BloodGroup | null): StockStatus =>
  group ? (zone.statuses[group] ?? 'none') : (zone.worst ?? 'none')

/** Статусы по всем 8 группам: пропущенные — «нет данных». */
export const fillStatuses = (zone: ZoneStatus): Record<BloodGroup, StockStatus> =>
  Object.fromEntries(BLOOD_GROUPS.map((group) => [group, zone.statuses[group] ?? 'none'])) as Record<BloodGroup, StockStatus>

/** Регион без данных: statuses = {}, worst = null. */
export const hasZoneData = (zone: ZoneStatus): boolean => zone.worst !== null
