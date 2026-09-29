import { CellList, Typography } from '@maxhub/max-ui'

import type { Region } from '@/api/types'

import styles from './RegionList.module.scss'
import { RegionListItem } from './RegionListItem'

interface RegionListProps {
  regions: Region[]
  selectedId: number | null
  onSelect: (id: number) => void
  /** Запись — только регионы с центрами; «Мой регион» — любые. */
  requireCenters?: boolean
}

/** Список регионов по алфавиту. */
export const RegionList = ({ regions, selectedId, onSelect, requireCenters = true }: RegionListProps) => {
  if (regions.length === 0) {
    return (
      <Typography.Text variant="body" color="tertiary" className={styles['region-list__empty']}>
        Регион не найден
      </Typography.Text>
    )
  }

  return (
    <CellList mode="full-width" className={styles['region-list']}>
      {regions.map((region) => (
        <RegionListItem
          key={region.id}
          region={region}
          selected={region.id === selectedId}
          disabled={requireCenters && !region.has_centers}
          onSelect={() => onSelect(region.id)}
        />
      ))}
    </CellList>
  )
}
