import { CellList, Typography } from '@maxhub/max-ui'

import type { Region } from '@/api/types'

import styles from './RegionList.module.scss'
import { RegionListItem } from './RegionListItem'

interface RegionListProps {
  regions: Region[]
  selectedId: number | null
  onSelect: (id: number) => void
}

/** Список регионов по алфавиту. */
export const RegionList = ({ regions, selectedId, onSelect }: RegionListProps) => {
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
          onSelect={() => onSelect(region.id)}
        />
      ))}
    </CellList>
  )
}
