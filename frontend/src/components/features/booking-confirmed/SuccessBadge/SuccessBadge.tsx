import { Check } from 'lucide-react'

import styles from './SuccessBadge.module.scss'

/** Большая зелёная галочка в круге. */
export const SuccessBadge = () => (
  <span className={styles['success-badge']} aria-hidden>
    <Check size={52} strokeWidth={3} />
  </span>
)
