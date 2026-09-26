import { Outlet } from 'react-router-dom'

import { TabBar } from '../TabBar/TabBar'

/** Экраны с нижним меню: «Запись» и «Личный кабинет». */
export const TabLayout = () => (
  <>
    <Outlet />
    <TabBar />
  </>
)
