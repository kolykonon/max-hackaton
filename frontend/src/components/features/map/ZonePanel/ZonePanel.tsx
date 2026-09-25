import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'

import styles from './ZonePanel.module.scss'

interface ZonePanelProps {
  name: string
  updatedAt: string
  hasData: boolean
  /** Светофор по группам — BloodGroupStrip. */
  children: ReactNode
}

/** Панель данных по выбранной зоне под картой. */
export const ZonePanel = ({ name, updatedAt, hasData, children }: ZonePanelProps) => (
  <section className={styles['zone-panel']}>
    <span className={styles['zone-panel__handle']} aria-hidden />
    <div className={styles['zone-panel__head']}>
      <div className={styles['zone-panel__titles']}>
        <Typography.Text variant="hero">{name}</Typography.Text>
        <Typography.Text variant="detail" color="tertiary">
          данные на {updatedAt}
        </Typography.Text>
      </div>
      <DemoBadge />
    </div>
    {children}
    {!hasData && (
      <Typography.Text variant="detail" color="tertiary" className={styles['zone-panel__empty']}>
        Нет данных по этой зоне
      </Typography.Text>
    )}
  </section>
)
