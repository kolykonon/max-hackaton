import { BLOOD_GROUPS } from '@/content/demo'
import type { BloodGroup, StockStatus } from '@/content/types'

import styles from './BloodGroupStrip.module.scss'
import { BloodGroupItem } from './BloodGroupItem'

interface BloodGroupStripProps {
  statuses: Record<BloodGroup, StockStatus>
  selected: BloodGroup | null
  userGroup: BloodGroup | null
  onToggle: (group: BloodGroup) => void
}

/** Светофор по 8 группам крови в одну строку. */
export const BloodGroupStrip = ({ statuses, selected, userGroup, onToggle }: BloodGroupStripProps) => (
  <div className={styles['blood-group-strip']} role="group" aria-label="Группы крови">
    {BLOOD_GROUPS.map((group) => (
      <BloodGroupItem
        key={group}
        group={group}
        status={statuses[group]}
        selected={group === selected}
        isUserGroup={group === userGroup}
        onToggle={() => onToggle(group)}
      />
    ))}
  </div>
)
