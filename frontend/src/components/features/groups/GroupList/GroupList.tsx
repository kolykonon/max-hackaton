import type { ReactNode } from 'react'

import styles from './GroupList.module.scss'

/** Список карточек групп. */
export const GroupList = ({ children }: { children: ReactNode }) => (
  <ul className={styles['group-list']}>{children}</ul>
)
