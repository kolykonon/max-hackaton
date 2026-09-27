import { Button, Typography } from '@maxhub/max-ui'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useBookingCenters } from '@/api/hooks/booking'
import { useRegions } from '@/api/hooks/regions'
import type { BookingCenter } from '@/api/types'
import { CenterCard } from '@/components/features/booking-center/CenterCard/CenterCard'
import { CenterList } from '@/components/features/booking-center/CenterList/CenterList'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { BookingSummary } from '@/components/shared/BookingSummary/BookingSummary'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { SegmentedControl } from '@/components/shared/SegmentedControl/SegmentedControl'
import { SegmentedControlItem } from '@/components/shared/SegmentedControl/SegmentedControlItem'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useRussiaGeo } from '@/hooks/useRussiaGeo'
import { useToast } from '@/hooks/useToast'
import { useBookingStore } from '@/store/booking'

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
  const { donationType, regionId, date, center, rescheduleId, setCenter } = useBookingStore()
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
  const russia = useRussiaGeo()
  const [view, setView] = useState<View>('list')

  if (regionId === null || date === null) return <Navigate to="/home" replace />

  const selectedCenter = centers.data?.find((item) => item.id === center?.id)
  const select = (item: BookingCenter) => setCenter({ id: item.id, name: item.name, address: item.address })
  const region = regions.data?.find((item) => item.id === regionId)
  const regionFeature = russia.data?.features.find((item) => item.properties.code === region?.code) ?? null
  const regionName = region?.name ?? ''

  const renderCenters = () => {
    if (centers.isPending) return [120, 120, 120].map((height, i) => <Skeleton key={i} height={height} />)
    if (centers.isError) {
      return <ErrorState text="Не удалось загрузить центры" retrying={centers.isFetching} onRetry={() => centers.refetch()} />
    }
    if (centers.data.length === 0) {
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
    if (view === 'list') return <CenterList centers={centers.data} selectedId={center?.id ?? null} onSelect={select} />
    return (
      <div className={styles['booking-center__map']}>
        <Suspense fallback={<Skeleton height={420} radius="s" />}>
          <CenterMap
            region={regionFeature}
            regionName={regionName}
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
    )
  }

  return (
    <Screen
      header={<StepHeader title="Выберите центр" step={3} onBack={() => navigate('/booking/date')} />}
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={!selectedCenter} onClick={() => navigate('/booking/time')}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <BookingSummary withDate />
      <SegmentedControl label="Вид списка центров">
        <SegmentedControlItem selected={view === 'list'} onSelect={() => setView('list')}>
          Список
        </SegmentedControlItem>
        <SegmentedControlItem selected={view === 'map'} onSelect={() => setView('map')}>
          Карта
        </SegmentedControlItem>
      </SegmentedControl>
      {renderCenters()}
      <Toast message={toast.message} />
    </Screen>
  )
}
