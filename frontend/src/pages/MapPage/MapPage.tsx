import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { useLocateRegion, useMapCenters, useMapStatus, useRegions } from '@/api/hooks/regions'
import { BloodGroupStrip } from '@/components/features/map/BloodGroupStrip/BloodGroupStrip'
import { CenterInfoCard } from '@/components/features/map/CenterInfoCard/CenterInfoCard'
import { MapControls } from '@/components/features/map/MapControls/MapControls'
import { fillStatuses, getZoneStatus, hasZoneData, type ZoneStatus } from '@/components/features/map/utils'
import { ZonePanel } from '@/components/features/map/ZonePanel/ZonePanel'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { DEFAULT_ZONE, getLastZone, setLastZone } from '@/components/shared/RussiaMap/lastZone'
import type { RegionsMapHandle } from '@/components/features/map/RegionsMap/RegionsMap'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { StatusLegend } from '@/components/shared/StatusLegend/StatusLegend'
import { Toast } from '@/components/shared/Toast/Toast'
import type { BloodGroup, StockStatus } from '@/content/types'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useRussiaGeo } from '@/hooks/useRussiaGeo'
import { useToast } from '@/hooks/useToast'
import { useBookingStore } from '@/store/booking'
import { formatDayMonth } from '@/utils/format'

import styles from './MapPage.module.scss'

const EMPTY_ZONE = (code: string): ZoneStatus => ({ code, statuses: {}, worst: null })

// MapLibre тяжёлый — грузим только при открытии экрана карты
const RegionsMap = lazy(() =>
  import('@/components/features/map/RegionsMap/RegionsMap').then((module) => ({ default: module.RegionsMap })),
)

/** Экран «Карта» — донорский светофор по субъектам РФ. Нижнее меню скрыто. */
export const MapPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const mapRef = useRef<RegionsMapHandle>(null)
  const geo = useRussiaGeo()
  const status = useMapStatus()
  const centers = useMapCenters()
  const startNew = useBookingStore((state) => state.startNew)
  const setBookingRegion = useBookingStore((state) => state.setRegion)
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)
  const regions = useRegions()
  const me = useMe()
  const location = useGeolocation()
  const located = useLocateRegion(location.status === 'granted' ? { lat: location.lat, lon: location.lon } : null)
  const userRegionCode = located.data?.region?.code ?? null

  // Без геопозиции — последняя выбранная зона, при первом запуске Москва (map.md, «Первое открытие»)
  const [pickedZone, setPickedZone] = useState<string | null>(null)
  const zoneCode = pickedZone ?? userRegionCode ?? getLastZone() ?? DEFAULT_ZONE

  const userGroup = me.data?.blood.group ?? null
  // undefined — пользователь ещё не выбирал, берём его группу; null — выбор снят
  const [pickedGroup, setPickedGroup] = useState<BloodGroup | null | undefined>(undefined)
  const group = pickedGroup === undefined ? userGroup : pickedGroup

  const zonesByCode = useMemo(() => new Map(status.data?.regions.map((zone) => [zone.code, zone])), [status.data])
  const namesByCode = useMemo(() => new Map(regions.data?.map((region) => [region.code, region.name])), [regions.data])
  const zone = zonesByCode.get(zoneCode) ?? EMPTY_ZONE(zoneCode)
  const statuses = useMemo(
    () =>
      Object.fromEntries(
        [...zonesByCode.values()].map((item) => [item.code, getZoneStatus(item, group)]),
      ) as Record<string, StockStatus>,
    [zonesByCode, group],
  )
  const userLocation = useMemo(
    () => (location.status === 'granted' ? { lat: location.lat, lon: location.lon } : null),
    [location],
  )

  const selectZone = (code: string) => {
    setPickedZone(code)
    setLastZone(code)
    setSelectedCenterId(null)
  }

  const selectedCenter = centers.data?.find((center) => center.id === selectedCenterId) ?? null

  // Тап по центру показывает его карточку, а панель внизу переключается на его регион
  const selectCenter = (id: number) => {
    const center = centers.data?.find((item) => item.id === id)
    const code = regions.data?.find((region) => region.id === center?.region_id)?.code
    if (code) {
      setPickedZone(code)
      setLastZone(code)
    }
    setSelectedCenterId(id)
  }

  // «Записаться» из карточки: мастер записи сразу с регионом центра
  const bookInCenter = () => {
    if (!selectedCenter) return
    startNew()
    setBookingRegion(selectedCenter.region_id)
    navigate('/donation-info')
  }

  const locate = () => {
    if (!userRegionCode) return toast.show('Не удалось определить местоположение')
    selectZone(userRegionCode)
    mapRef.current?.focusRegion(userRegionCode)
  }

  // Повторное нажатие на выбранную группу снимает выбор
  const toggleGroup = (value: BloodGroup) => setPickedGroup(group === value ? null : value)

  const renderMap = () => {
    if (geo.isPending || status.isPending) return <Skeleton height={320} radius="s" />
    if (geo.isError || status.isError) {
      const retry = () => Promise.all([geo.refetch(), status.refetch()])
      return <ErrorState text="Не удалось загрузить карту" retrying={geo.isFetching || status.isFetching} onRetry={retry} />
    }
    return (
      <Suspense fallback={<Skeleton height={320} radius="s" />}>
        <RegionsMap
          ref={mapRef}
          regions={geo.data.features}
          statuses={statuses}
          selectedCode={zoneCode}
          onSelect={selectZone}
          userLocation={userLocation}
          initialFocusCode={userRegionCode}
          centers={centers.data}
          group={group}
          selectedCenterId={selectedCenterId}
          onSelectCenter={selectCenter}
        >
          <MapControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onLocate={locate}
          />
          {selectedCenter && (
            <CenterInfoCard
              center={selectedCenter}
              group={group}
              onBook={bookInCenter}
              onClose={() => setSelectedCenterId(null)}
            />
          )}
        </RegionsMap>
      </Suspense>
    )
  }

  return (
    <Screen header={<PageHeader title="Карта" onBack={() => navigate('/home')} />} flush contentClassName={styles['map-page']}>
      <div className={styles['map-page__map']}>{renderMap()}</div>
      <div className={styles['map-page__legend']}>
        <StatusLegend withNoData />
      </div>
      {status.data && (
        <ZonePanel
          name={namesByCode.get(zoneCode) ?? ''}
          updatedAt={formatDayMonth(new Date(status.data.updated_at))}
          hasData={hasZoneData(zone)}
        >
          <BloodGroupStrip statuses={fillStatuses(zone)} selected={group} userGroup={userGroup} onToggle={toggleGroup} />
        </ZonePanel>
      )}
      <Toast message={toast.message} />
    </Screen>
  )
}
