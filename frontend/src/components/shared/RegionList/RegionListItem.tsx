import { CellSimple } from '@maxhub/max-ui'
import { Check } from 'lucide-react'

import type { Region } from '@/api/types'

import styles from './RegionList.module.scss'

interface RegionListItemProps {
  region: Region
  selected: boolean
  /** Регион без центров, а нужен регион для записи. */
  disabled: boolean
  onSelect: () => void
}

export const RegionListItem = ({ region, selected, disabled, onSelect }: RegionListItemProps) => (
  <CellSimple
    as="button"
    title={region.name}
    subtitle={disabled ? 'Нет центров для записи' : undefined}
    disabled={disabled}
    after={selected ? <Check size={22} className={styles['region-list__check']} /> : undefined}
    showChevron={!selected && !disabled}
    separator
    aria-pressed={selected}
    className={styles['region-list__item']}
    onClick={disabled ? undefined : onSelect}
  />
)
