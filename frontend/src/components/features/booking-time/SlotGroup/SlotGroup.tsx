import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import styles from './SlotGroup.module.scss'

interface SlotGroupProps {
  title: string
  /** Кнопки слотов — SlotButton. */
  children: ReactNode
}

/** Группа слотов: «Утро», «День», «Вечер». Пустые группы не показываем. */
export const SlotGroup = ({ title, children }: SlotGroupProps) => (
  <section className={styles['slot-group']}>
    <Typography.Text variant="subheader">{title}</Typography.Text>
    <div className={styles['slot-group__grid']}>{children}</div>
  </section>
)
