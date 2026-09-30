import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import styles from './ZonePanel.module.scss'

interface ZonePanelProps {
  name: string
  hasData: boolean
  /** Светофор по группам — BloodGroupStrip. */
  children: ReactNode
}

/** Панель данных по выбранной зоне под картой. */
export const ZonePanel = ({ name, hasData, children }: ZonePanelProps) => (
  <section className={styles['zone-panel']}>
    <span className={styles['zone-panel__handle']} aria-hidden />
    <Typography.Text variant="hero">{name}</Typography.Text>
    {children}
    {!hasData && (
      <Typography.Text variant="detail" color="tertiary" className={styles['zone-panel__empty']}>
        Нет данных по этой зоне
      </Typography.Text>
    )}
  </section>
)
