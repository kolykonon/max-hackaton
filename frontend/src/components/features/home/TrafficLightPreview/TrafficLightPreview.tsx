import { Map as MapIcon } from 'lucide-react'
import { useMemo } from 'react'

import { useMe } from '@/api/hooks/me'
import { useMapStatus } from '@/api/hooks/regions'
import { getZoneStatus } from '@/components/features/map/utils'
import { DEFAULT_ZONE, getLastZone, zoneFitCodes } from '@/components/shared/RussiaMap/lastZone'
import { RussiaMap } from '@/components/shared/RussiaMap/RussiaMap'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { useRussiaGeo } from '@/hooks/useRussiaGeo'

import styles from './TrafficLightPreview.module.scss'

/** Превью светофора в карточке на главной: последний просмотренный регион в цветах группы пользователя. */
export const TrafficLightPreview = () => {
  const geo = useRussiaGeo()
  const status = useMapStatus()
  const me = useMe()
  const group = me.data?.blood.group ?? null
  const zoneCode = getLastZone() ?? DEFAULT_ZONE
  const zones = useMemo(() => new Map(status.data?.regions.map((zone) => [zone.code, zone])), [status.data])

  if (geo.isPending || status.isPending) return <Skeleton height={200} radius="s" className={styles['traffic-light-preview']} />

  // Карта не загрузилась — серый фон с иконкой, карточка остаётся нажимаемой (main_screen.md)
  if (geo.isError || status.isError) {
    return (
      <div className={styles['traffic-light-preview__fallback']} role="img" aria-label="Карта станций переливания крови">
        <MapIcon size={40} strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <RussiaMap
      regions={geo.data.features}
      getStatus={(code) => getZoneStatus(zones.get(code) ?? { code, statuses: {}, worst: null }, group)}
      fitCodes={zoneFitCodes(zoneCode)}
      width={1000}
      height={520}
      label="Карта станций переливания крови"
      className={styles['traffic-light-preview']}
    />
  )
}
