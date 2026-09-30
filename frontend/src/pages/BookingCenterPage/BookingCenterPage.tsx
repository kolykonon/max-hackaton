import { Button, Typography } from '@maxhub/max-ui'
import { CalendarCheck, CalendarX } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useBookingCenters } from '@/api/hooks/booking'
import { useMe } from '@/api/hooks/me'
import { useRegions } from '@/api/hooks/regions'
import type { BookingCenter } from '@/api/types'
import { CenterCard } from '@/components/features/booking-center/CenterCard/CenterCard'
import { CenterList } from '@/components/features/booking-center/CenterList/CenterList'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { BookingSummary } from '@/components/shared/BookingSummary/BookingSummary'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { SegmentedControl } from '@/components/shared/SegmentedControl/SegmentedControl'
import { SegmentedControlItem } from '@/components/shared/SegmentedControl/SegmentedControlItem'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useFinishGroupCreation } from '@/hooks/useFinishGroupCreation'
import { useToast } from '@/hooks/useToast'
import { bookingSteps, stepAfterCenter, useBookingStore } from '@/store/booking'
import { formatDayMonth, parseISODate } from '@/utils/format'

import styles from './BookingCenterPage.module.scss'

type View = 'list' | 'map'

// MapLibre тяжёлый — грузим, только когда открыли вкладку «Карта»
const CenterMap = lazy(() =>
  import('@/components/features/booking-center/CenterMap/CenterMap').then((module) => ({ default: module.CenterMap })),
)

/** Шаг 3 — центр крови. */
export const BookingCenterPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { mode, donationType, regionId, date, center, rescheduleId, setCenter } = useBookingStore()
  const isGroup = mode === 'group'
  const group = useFinishGroupCreation(() => toast.show('Не удалось создать группу. Попробуйте ещё раз'))
  const geo = useGeolocation()
  const userLocation = useMemo(() => (geo.status === 'granted' ? { lat: geo.lat, lon: geo.lon } : null), [geo])
  const coords = userLocation ?? {}
  const centers = useBookingCenters({
    regionId,
    donationType,
    date,
    ...coords,
    pinCenterId: rescheduleId ? center?.id : undefined,
  })
  const regions = useRegions()
  const me = useMe()
  const [view, setView] = useState<View>('list')
  // Открытую карту не размонтируем при переключении на список: пересоздание MapLibre заново качает стиль и тайлы
  const [mapOpened, setMapOpened] = useState(false)

  if (regionId === null || date === null) return <Navigate to="/home" replace />

  // Центр без мест («ваш центр» на занятый день) выбрать нельзя
  const selectedCenter = centers.data?.find((item) => item.id === center?.id && item.free_slots > 0)
  const select = (item: BookingCenter) => {
    if (item.free_slots === 0) return

    setCenter({ id: item.id, name: item.name, address: item.address })
    if (!isGroup) navigate(stepAfterCenter(donationType))
  }
  const usual = centers.data?.find((item) => item.is_usual)
  const day = formatDayMonth(parseISODate(date))
  const region = regions.data?.find((item) => item.id === regionId)

  const renderCenters = () => {
    if (centers.isPending) return [120, 120, 120].map((height, i) => <Skeleton key={i} height={height} />)
    if (centers.isError) {
      return <ErrorState text="Не удалось загрузить центры" retrying={centers.isFetching} onRetry={() => centers.refetch()} />
    }
    if (centers.data.every((item) => item.free_slots === 0)) {
      return (
        <div className={styles['booking-center__empty']}>
          <Typography.Text variant="body" color="secondary">
            На эту дату мест нет
          </Typography.Text>
          <OutlineButton size="medium" onClick={() => navigate('/booking/date')}>
            Выбрать другую дату
          </OutlineButton>
        </div>
      )
    }
    return (
      <>
        {usual && (
          <InfoRow
            icon={usual.free_slots > 0 ? CalendarCheck : CalendarX}
            tone={usual.free_slots > 0 ? 'green' : 'red'}
            title={usual.free_slots > 0 ? `В вашем центре на ${day} есть места` : `В вашем центре на ${day} мест нет`}
            description={usual.free_slots > 0 ? usual.name : 'Выберите другой центр или другую дату'}
          />
        )}
        {view === 'list' && <CenterList centers={centers.data} selectedId={center?.id ?? null} onSelect={select} />}
        {mapOpened && (
          <div className={styles['booking-center__map']} hidden={view !== 'map'}>
            <Suspense fallback={<MapPlaceholder height={420} />}>
              <CenterMap
                regionCode={region?.code ?? null}
                group={me.data?.blood.group ?? null}
                centers={centers.data}
                selectedId={center?.id ?? null}
                onSelect={select}
                userLocation={userLocation}
                onLocateFailed={() => toast.show('Не удалось определить местоположение')}
              />
            </Suspense>
            {selectedCenter && (
              <div className={styles['booking-center__map-card']}>
                <CenterCard center={selectedCenter} selected onSelect={() => undefined} />
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <Screen
      header={
        <StepHeader
          title="Выберите центр"
          step={3}
          total={isGroup ? 3 : bookingSteps(donationType)}
          onBack={() => navigate('/booking/date')}
        />
      }
      footer={isGroup ? (
        <StickyFooter>
          <Button
            size="large"
            stretched
            disabled={!selectedCenter}
            loading={group.isPending}
            onClick={() => group.finish()}
          >
            Создать группу
          </Button>
        </StickyFooter>
      ) : undefined}
    >
      <BookingSummary withDate />
      <SegmentedControl label="Вид списка центров">
        <SegmentedControlItem selected={view === 'list'} onSelect={() => setView('list')}>
          Список
        </SegmentedControlItem>
        <SegmentedControlItem selected={view === 'map'} onSelect={() => {
            setView('map')
            setMapOpened(true)
          }}>
          Карта
        </SegmentedControlItem>
      </SegmentedControl>
      {renderCenters()}
      <Toast message={toast.message} />
    </Screen>
  )
}
