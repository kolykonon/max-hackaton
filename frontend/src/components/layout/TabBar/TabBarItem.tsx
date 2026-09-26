import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { cn } from '@/utils/cn'

import styles from './TabBar.module.scss'

interface TabBarItemProps {
  to: string
  icon: LucideIcon
  label: string
}

export const TabBarItem = ({ to, icon: Icon, label }: TabBarItemProps) => {
  const location = useLocation()

  const onClick = () => {
    if (location.pathname === to) {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => cn(styles['tab-bar__item'], isActive && styles['tab-bar__item--active'])}
    >
      <Icon size={26} strokeWidth={2} />
      <Typography.Text variant="label" color="inherit">
        {label}
      </Typography.Text>
    </NavLink>
  )
}
