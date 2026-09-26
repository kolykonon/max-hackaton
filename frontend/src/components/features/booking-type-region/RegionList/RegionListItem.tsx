import { CellSimple } from '@maxhub/max-ui'
import { Check } from 'lucide-react'

import type { Region } from '@/api/types'

import styles from './RegionList.module.scss'

interface RegionListItemProps {
  region: Region
  selected: boolean
  onSelect: () => void
}

export const RegionListItem = ({ region, selected, onSelect }: RegionListItemProps) => (
  <CellSimple
    as="button"
    title={region.name}
    subtitle={region.has_centers ? undefined : 'Нет центров для записи'}
    disabled={!region.has_centers}
    after={selected ? <Check size={22} className={styles['region-list__check']} /> : undefined}
    showChevron={!selected && region.has_centers}
    separator
    aria-pressed={selected}
    className={styles['region-list__item']}
    onClick={region.has_centers ? onSelect : undefined}
  />
)
