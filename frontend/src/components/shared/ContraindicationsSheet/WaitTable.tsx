import type { ReactNode } from 'react'

import styles from './ContraindicationsSheet.module.scss'

interface WaitTableProps {
  children: ReactNode
}

/** Таблица «Ситуация — Сколько ждать». Строки — WaitTableRow. */
export const WaitTable = ({ children }: WaitTableProps) => (
  <table className={styles['wait-table']}>
    <thead>
      <tr>
        <th className={styles['wait-table__head']}>Ситуация</th>
        <th className={styles['wait-table__head']}>Сколько ждать</th>
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
)
