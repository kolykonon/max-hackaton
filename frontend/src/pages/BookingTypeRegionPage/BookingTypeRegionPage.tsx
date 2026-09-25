import { Button, Typography } from '@maxhub/max-ui'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { DonationTypeSwitch } from '@/components/features/booking-type-region/DonationTypeSwitch/DonationTypeSwitch'
import { GeoRegionCard } from '@/components/features/booking-type-region/GeoRegionCard/GeoRegionCard'
import { RegionList } from '@/components/features/booking-type-region/RegionList/RegionList'
import { RegionSearch } from '@/components/features/booking-type-region/RegionSearch/RegionSearch'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { DEMO_REGION, NEXT_ALLOWED_WHOLE, REGIONS } from '@/content/demo'
import type { DonationType } from '@/content/types'
import { formatDayMonth } from '@/utils/format'

import styles from './BookingTypeRegionPage.module.scss'

/** Шаг 1 — вид донации и регион. */
export const BookingTypeRegionPage = () => {
  const navigate = useNavigate()
  const [type, setType] = useState<DonationType>('whole_blood')
  // Демо: геопозиция разрешена и определила Москву
  const geoRegion = DEMO_REGION
  const [regionId, setRegionId] = useState<number | null>(geoRegion.id)
  const [query, setQuery] = useState('')

  const regions = useMemo(() => {
    const normalized = query.trim().toLowerCase().replaceAll('ё', 'е')
    return REGIONS.filter((region) => region.name.toLowerCase().replaceAll('ё', 'е').includes(normalized))
  }, [query])

  const hint = type === 'whole_blood' ? `Цельную кровь можно сдать с ${formatDayMonth(NEXT_ALLOWED_WHOLE)}` : undefined

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
      <DonationTypeSwitch value={type} onChange={setType} hint={hint} />
      <section className={styles['booking-type-region__region']}>
        <Typography.Text variant="subheader">Регион</Typography.Text>
        <GeoRegionCard
          regionName={geoRegion.name}
          selected={regionId === geoRegion.id}
          onSelect={() => setRegionId(geoRegion.id)}
        />
        <RegionSearch value={query} onChange={setQuery} />
        <RegionList regions={regions} selectedId={regionId} onSelect={setRegionId} />
      </section>
    </Screen>
  )
}
