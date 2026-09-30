import { useMemo, useState } from 'react'

import { useLocateRegion, useRegions } from '@/api/hooks/regions'
import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { GeoRegionCard } from '@/components/shared/GeoRegionCard/GeoRegionCard'
import { RegionList } from '@/components/shared/RegionList/RegionList'
import { RegionSearch } from '@/components/shared/RegionSearch/RegionSearch'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { useGeolocation } from '@/hooks/useGeolocation'
import { matchesQuery } from '@/utils/search'

import styles from './RegionSheet.module.scss'

interface RegionSheetProps {
  open: boolean
  selectedId: number | null
  onSelect: (regionId: number) => void
  onClose: () => void
  /** В записи — только регионы, где есть центры крови. */
  requireCenters?: boolean
}

/** Выбор «Моего региона»: по геопозиции или поиском по списку. Подходит любой регион, не только с центрами. */
export const RegionSheet = ({ open, selectedId, onSelect, onClose, requireCenters = false }: RegionSheetProps) => {
  const regions = useRegions()
  // Геопозицию спрашиваем, только когда шторку открыли
  const geo = useGeolocation(open)
  const located = useLocateRegion(geo.status === 'granted' ? { lat: geo.lat, lon: geo.lon } : null)
  const geoRegion = located.data?.region ?? null
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => (regions.data ?? []).filter((region) => matchesQuery(region.name, query)),
    [regions.data, query],
  )

  const renderRegions = () => {
    if (regions.isPending) return Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={48} radius="s" />)
    if (regions.isError) {
      return <ErrorState compact text="Не удалось загрузить регионы" retrying={regions.isFetching} onRetry={() => regions.refetch()} />
    }
    return <RegionList regions={filtered} selectedId={selectedId} onSelect={onSelect} requireCenters={requireCenters} />
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Мой регион"
      subtitle="Покажем центры крови региона и напишем в чат, когда здесь не хватает вашей группы крови"
    >
      <div className={styles['region-sheet']}>
        {geoRegion && (
          <GeoRegionCard
            regionName={geoRegion.name}
            selected={selectedId === geoRegion.id}
            onSelect={() => onSelect(geoRegion.id)}
          />
        )}
        <RegionSearch value={query} onChange={setQuery} />
        {renderRegions()}
      </div>
    </BottomSheet>
  )
}
