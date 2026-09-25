import { StatusDot } from '@/components/shared/StatusDot/StatusDot'
import { BLOOD_GROUP_NAMES } from '@/content/demo'
import { STATUS_A11Y } from '@/content/status'
import type { BloodGroup, StockStatus } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './BloodGroupStrip.module.scss'

interface BloodGroupItemProps {
  group: BloodGroup
  status: StockStatus
  selected: boolean
  isUserGroup: boolean
  onToggle: () => void
}

export const BloodGroupItem = ({ group, status, selected, isUserGroup, onToggle }: BloodGroupItemProps) => (
  <div className={styles['blood-group-strip__cell']}>
    <button
      type="button"
      className={cn(styles['blood-group-strip__item'], selected && styles['blood-group-strip__item--selected'])}
      aria-pressed={selected}
      aria-label={`Группа ${BLOOD_GROUP_NAMES[group]}: ${STATUS_A11Y[status]}`}
      onClick={onToggle}
    >
      <span className={styles['blood-group-strip__label']}>{group.replace('-', '−')}</span>
      <StatusDot status={status} size={selected ? 'l' : 'm'} />
    </button>
    {isUserGroup && <span className={styles['blood-group-strip__mine']}>ваша</span>}
  </div>
)
