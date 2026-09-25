import { CalendarDays, UserRound } from 'lucide-react'

import styles from './TabBar.module.scss'
import { TabBarItem } from './TabBarItem'

/** Нижнее меню: «Запись» и «Личный кабинет». */
export const TabBar = () => (
  <nav className={styles['tab-bar']} aria-label="Нижнее меню">
    <TabBarItem to="/home" icon={CalendarDays} label="Запись" />
    <TabBarItem to="/account" icon={UserRound} label="Личный кабинет" />
  </nav>
)
