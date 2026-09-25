import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { useMapStatus, useRegions } from '@/api/hooks/regions'
import { BloodGroupStrip } from '@/components/features/map/BloodGroupStrip/BloodGroupStrip'
import { MapControls } from '@/components/features/map/MapControls/MapControls'
import { fillStatuses, getZoneStatus, hasZoneData } from '@/components/features/map/utils'
import { ZonePanel } from '@/components/features/map/ZonePanel/ZonePanel'
import { ZoneSpot } from '@/components/features/map/ZoneSpot/ZoneSpot'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { StatusLegend } from '@/components/shared/StatusLegend/StatusLegend'
import { Toast } from '@/components/shared/Toast/Toast'
import type { BloodGroup } from '@/content/types'
import { useToast } from '@/hooks/useToast'
import { formatDayMonth } from '@/utils/format'

import styles from './MapPage.module.scss'

// Заглушка: три зоны вместо карты России. TODO: SVG-карта на d3-geo из russia.topo.json (FE2)
const SPOTS: Record<string, { x: number; y: number; size: number }> = {
  'RU-MOS': { x: 34, y: 58, size: 34 },
  'RU-MOW': { x: 34, y: 58, size: 12 },
  'RU-SPE': { x: 22, y: 24, size: 14 },
}

/** Экран «Карта» — донорский светофор. Нижнее меню скрыто. */
export const MapPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const status = useMapStatus()
  const regions = useRegions()
  const me = useMe()
  const userGroup = me.data?.blood.group ?? null
  const [zoneCode, setZoneCode] = useState('RU-MOW')
  // undefined — пользователь ещё не выбирал, берём его группу; null — выбор снят
  const [pickedGroup, setPickedGroup] = useState<BloodGroup | null | undefined>(undefined)
  const group = pickedGroup === undefined ? userGroup : pickedGroup

  const zones = status.data?.regions.filter((zone) => zone.code in SPOTS) ?? []
  const zone = zones.find((item) => item.code === zoneCode)
  const zoneName = regions.data?.find((region) => region.code === zoneCode)?.name ?? ''

  // Повторное нажатие на выбранную группу снимает выбор
  const toggleGroup = (value: BloodGroup) => setPickedGroup(group === value ? null : value)

  const renderMap = () => {
    if (status.isPending) return <Skeleton height={320} radius="s" />
    if (status.isError) {
      return <ErrorState text="Не удалось загрузить карту" retrying={status.isFetching} onRetry={() => status.refetch()} />
    }
    return (
      <MapPlaceholder alt="Карта России с донорским светофором">
        {/* Крупные зоны рисуем раньше, чтобы Москва была поверх области */}
        {[...zones]
          .sort((a, b) => SPOTS[b.code].size - SPOTS[a.code].size)
          .map((item) => (
            <ZoneSpot
              key={item.code}
              name={regions.data?.find((region) => region.code === item.code)?.name ?? item.code}
              status={getZoneStatus(item, group)}
              selected={item.code === zoneCode}
              {...SPOTS[item.code]}
              onSelect={() => setZoneCode(item.code)}
            />
          ))}
        <MapControls
          onZoomIn={() => undefined}
          onZoomOut={() => undefined}
          onLocate={() => toast.show('Не удалось определить местоположение')}
        />
      </MapPlaceholder>
    )
  }

  return (
    <Screen header={<PageHeader title="Карта" onBack={() => navigate('/home')} />} flush contentClassName={styles['map-page']}>
      <div className={styles['map-page__map']}>{renderMap()}</div>
      <div className={styles['map-page__legend']}>
        <StatusLegend withNoData />
      </div>
      {zone && status.data && (
        <ZonePanel name={zoneName} updatedAt={formatDayMonth(new Date(status.data.updated_at))} hasData={hasZoneData(zone)}>
          <BloodGroupStrip statuses={fillStatuses(zone)} selected={group} userGroup={userGroup} onToggle={toggleGroup} />
        </ZonePanel>
      )}
      <Toast message={toast.message} />
    </Screen>
  )
}
