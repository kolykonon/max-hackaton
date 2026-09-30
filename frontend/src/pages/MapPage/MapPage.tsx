import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { useLocateRegion, useRegions } from '@/api/hooks/regions'
import { BloodGroupStrip } from '@/components/features/map/BloodGroupStrip/BloodGroupStrip'
import { CenterInfoCard } from '@/components/features/map/CenterInfoCard/CenterInfoCard'
import { MapControls } from '@/components/shared/MapControls/MapControls'
import { useRegionsMapData } from '@/components/features/map/useRegionsMapData'
import { fillStatuses, hasZoneData, zoneAt, type ZoneStatus } from '@/components/features/map/utils'
import { ZonePanel } from '@/components/features/map/ZonePanel/ZonePanel'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { DEFAULT_ZONE, getLastZone, setLastZone } from '@/components/shared/RussiaMap/lastZone'
import type { RegionsMapHandle } from '@/components/features/map/RegionsMap/RegionsMap'
import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import { StatusLegend } from '@/components/shared/StatusLegend/StatusLegend'
import { Toast } from '@/components/shared/Toast/Toast'
import type { BloodGroup } from '@/content/types'
import { useGeolocation } from '@/hooks/useGeolocation'
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
  const startFromCenter = useBookingStore((state) => state.startFromCenter)
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null)
  const regions = useRegions()
  const me = useMe()
  const location = useGeolocation()
  const located = useLocateRegion(location.status === 'granted' ? { lat: location.lat, lon: location.lon } : null)
  const userGroup = me.data?.blood.group ?? null
  // undefined — пользователь ещё не выбирал, берём его группу; null — выбор снят
  const [pickedGroup, setPickedGroup] = useState<BloodGroup | null | undefined>(undefined)
  const group = pickedGroup === undefined ? userGroup : pickedGroup
  const { status, centers, zones, features, zonesByCode, statuses, points, ...mapData } = useRegionsMapData(group)

  // В Москве и области — группа районов, где стоит пользователь
  const userZone = location.status === 'granted' ? zoneAt(zones, location.lon, location.lat) : null
  const userRegionCode = userZone?.properties.code ?? located.data?.region?.code ?? null
  // Геопозиция запрещена или не определилась — регион из профиля (настройки)
  const profileRegionCode = regions.data?.find((region) => region.id === me.data?.region?.id)?.code ?? null
  // Приближаем один раз, поэтому ждём ответа геолокации, иначе успел бы сработать регион профиля
  const geoSettled = location.status === 'denied' || (location.status === 'granted' && (userZone !== null || !located.isPending))
  const initialFocusCode = geoSettled ? (userRegionCode ?? profileRegionCode) : null

  // Без геопозиции — последняя выбранная зона, при первом запуске Москва (map.md, «Первое открытие»)
  const [pickedZone, setPickedZone] = useState<string | null>(null)
  const zoneCode = pickedZone ?? userRegionCode ?? profileRegionCode ?? getLastZone() ?? DEFAULT_ZONE

  const namesByCode = useMemo(
    () =>
      new Map([
        ...(regions.data?.map((region) => [region.code, region.name] as const) ?? []),
        ...zones.map((zone) => [zone.properties.code, zone.properties.name] as const),
      ]),
    [regions.data, zones],
  )
  const parentOf = (code: string) => zones.find((zone) => zone.properties.code === code)?.properties.parent ?? code
  const zone = zonesByCode.get(zoneCode) ?? EMPTY_ZONE(zoneCode)
  const userLocation = useMemo(
    () => (location.status === 'granted' ? { lat: location.lat, lon: location.lon } : null),
    [location],
  )

  const selectZone = (code: string) => {
    setPickedZone(code)
    // Превью на главной рисует субъекты целиком — запоминаем субъект, а не район
    setLastZone(parentOf(code))
    setSelectedCenterId(null)
  }

  const selectedCenter = centers.data?.find((center) => center.id === selectedCenterId) ?? null

  // Тап по центру показывает его карточку, а панель внизу переключается на его регион
  const selectCenter = (id: number) => {
    const center = centers.data?.find((item) => item.id === id)
    const regionCode = regions.data?.find((region) => region.id === center?.region_id)?.code
    const code = (center && zoneAt(zones, center.lon, center.lat)?.properties.code) ?? regionCode
    if (code) {
      setPickedZone(code)
      setLastZone(parentOf(code))
    }
    setSelectedCenterId(id)
  }

  // «Записаться» из карточки: мастер записи сразу с этим центром, шаг выбора центра пропускаем
  const bookInCenter = () => {
    if (!selectedCenter) return
    const { id, name, address, region_id } = selectedCenter
    startFromCenter({ id, name, address }, region_id)
    navigate('/booking/type')
  }

  const locate = () => {
    if (!userRegionCode) return toast.show('Не удалось определить местоположение')
    selectZone(userRegionCode)
    mapRef.current?.focusRegion(userRegionCode)
  }

  // Повторное нажатие на выбранную группу снимает выбор
  const toggleGroup = (value: BloodGroup) => setPickedGroup(group === value ? null : value)

  const renderMap = () => {
    if (mapData.isPending) return <MapPlaceholder height={320} />
    if (mapData.isError) {
      return <ErrorState text="Не удалось загрузить карту" retrying={mapData.isFetching} onRetry={mapData.refetch} />
    }
    return (
      <Suspense fallback={<MapPlaceholder height={320} />}>
        <RegionsMap
          ref={mapRef}
          regions={features}
          statuses={statuses}
          selectedCode={zoneCode}
          onSelect={selectZone}
          userLocation={userLocation}
          initialFocusCode={initialFocusCode}
          centers={points}
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
    <Screen
      header={
        <PageHeader
          title="Карта"
          subtitle={status.data && `Демо-данные (${formatDayMonth(new Date(status.data.updated_at))})`}
          onBack={() => navigate('/home')}
          className={styles['map-page__header']}
        />
      }
      flush
      contentClassName={styles['map-page']}
    >
      <div className={styles['map-page__map']}>{renderMap()}</div>
      {status.data && (
        <ZonePanel
          name={namesByCode.get(zoneCode) ?? ''}
          hasData={hasZoneData(zone)}
        >
          <BloodGroupStrip statuses={fillStatuses(zone)} selected={group} userGroup={userGroup} onToggle={toggleGroup} />
          <StatusLegend withNoData />
        </ZonePanel>
      )}
      <Toast message={toast.message} />
    </Screen>
  )
}
