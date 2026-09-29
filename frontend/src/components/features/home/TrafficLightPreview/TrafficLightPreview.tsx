import { Map as MapIcon } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'

import { useMe } from '@/api/hooks/me'
import { useMapCenters, useMapStatus } from '@/api/hooks/regions'
import { getZoneStatus, toMapPoints } from '@/components/features/map/utils'
import { DEFAULT_ZONE, getLastZone } from '@/components/shared/RussiaMap/lastZone'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import type { StockStatus } from '@/content/types'
import { useRussiaGeo } from '@/hooks/useRussiaGeo'

import styles from './TrafficLightPreview.module.scss'

// Та же карта, что на экране «Карта»; MapLibre тяжёлый — грузим отдельно
const RegionsMap = lazy(() =>
  import('@/components/features/map/RegionsMap/RegionsMap').then((module) => ({ default: module.RegionsMap })),
)

const noop = () => {}

/** Превью светофора в карточке на главной: последний просмотренный регион в цветах группы пользователя. */
export const TrafficLightPreview = () => {
  const geo = useRussiaGeo()
  const status = useMapStatus()
  const centers = useMapCenters()
  const me = useMe()
  const group = me.data?.blood.group ?? null
  const zoneCode = getLastZone() ?? DEFAULT_ZONE
  const statuses = useMemo(
    () =>
      Object.fromEntries(status.data?.regions.map((zone) => [zone.code, getZoneStatus(zone, group)]) ?? []) as Record<
        string,
        StockStatus
      >,
    [status.data, group],
  )
  const points = useMemo(() => toMapPoints(centers.data ?? [], group), [centers.data, group])

  const skeleton = <Skeleton height={200} radius="s" className={styles['traffic-light-preview']} />
  if (geo.isPending || status.isPending) return skeleton

  // Карта не загрузилась — серый фон с иконкой, карточка остаётся нажимаемой (main_screen.md)
  if (geo.isError || status.isError) {
    return (
      <div className={styles['traffic-light-preview__fallback']} role="img" aria-label="Карта станций переливания крови">
        <MapIcon size={40} strokeWidth={1.5} />
      </div>
    )
  }

  // ponytail: превью не интерактивное (pointer-events: none) — тап уходит карточке и открывает экран «Карта»
  return (
    <div className={styles['traffic-light-preview']}>
      <Suspense fallback={skeleton}>
        <RegionsMap
          regions={geo.data.features}
          statuses={statuses}
          selectedCode={null}
          onSelect={noop}
          userLocation={null}
          initialFocusCode={zoneCode}
          centers={points}
          selectedCenterId={null}
          onSelectCenter={noop}
        />
      </Suspense>
    </div>
  )
}
