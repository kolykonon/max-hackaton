import { Button, Typography } from '@maxhub/max-ui'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useEligibility } from '@/api/hooks/me'
import { useLocateRegion, useRegions } from '@/api/hooks/regions'
import { DonationTypeSwitch } from '@/components/features/booking-type-region/DonationTypeSwitch/DonationTypeSwitch'
import { GeoRegionCard } from '@/components/features/booking-type-region/GeoRegionCard/GeoRegionCard'
import { RegionList } from '@/components/features/booking-type-region/RegionList/RegionList'
import { RegionSearch } from '@/components/features/booking-type-region/RegionSearch/RegionSearch'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import type { DonationType } from '@/content/types'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useBookingStore } from '@/store/booking'
import { formatDayMonth, parseISODate } from '@/utils/format'

import styles from './BookingTypeRegionPage.module.scss'

const ACCUSATIVE: Record<DonationType, string> = { whole_blood: 'Цельную кровь', plasma: 'Плазму' }

const normalize = (value: string) => value.trim().toLowerCase().replaceAll('ё', 'е')

/** Шаг 1 — вид донации и регион. */
export const BookingTypeRegionPage = () => {
  const navigate = useNavigate()
  const { donationType, regionId, setDonationType, setRegion } = useBookingStore()
  const regions = useRegions()
  const eligibility = useEligibility()
  const geo = useGeolocation()
  const located = useLocateRegion(geo.status === 'granted' ? { lat: geo.lat, lon: geo.lon } : null)
  const geoRegion = located.data?.region ?? null
  const [query, setQuery] = useState('')

  // Если геопозицию разрешили — регион подставлен и выбран
  useEffect(() => {
    if (geoRegion?.has_centers && regionId === null) setRegion(geoRegion.id)
  }, [geoRegion, regionId, setRegion])

  const filtered = useMemo(
    () => (regions.data ?? []).filter((region) => normalize(region.name).includes(normalize(query))),
    [regions.data, query],
  )

  const hint =
    eligibility.data?.interval_active[donationType]
      ? `${ACCUSATIVE[donationType]} можно сдать с ${formatDayMonth(parseISODate(eligibility.data.next_allowed[donationType]))}`
      : undefined

  const renderRegions = () => {
    if (regions.isPending) return Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={48} radius="s" />)
    if (regions.isError) {
      return <ErrorState compact text="Не удалось загрузить регионы" retrying={regions.isFetching} onRetry={() => regions.refetch()} />
    }
    return <RegionList regions={filtered} selectedId={regionId} onSelect={setRegion} />
  }

  return (
    <Screen
      header={<StepHeader title="Вид донации и регион" step={1} onBack={() => navigate('/personal-data')} />}
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={regionId === null} onClick={() => navigate('/booking/date')}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <DonationTypeSwitch value={donationType} onChange={setDonationType} hint={hint} />
      <section className={styles['booking-type-region__region']}>
        <Typography.Text variant="subheader">Регион</Typography.Text>
        {geoRegion && (
          <GeoRegionCard
            regionName={geoRegion.name}
            selected={regionId === geoRegion.id}
            onSelect={() => setRegion(geoRegion.id)}
          />
        )}
        <RegionSearch value={query} onChange={setQuery} />
        {renderRegions()}
      </section>
    </Screen>
  )
}
