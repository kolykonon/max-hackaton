import { Typography } from '@maxhub/max-ui'
import { ChevronRight, Users } from 'lucide-react'

import type { Group } from '@/api/types'
import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import { formatDayMonth, parseISODate } from '@/utils/format'

import styles from './MyGroupsBanner.module.scss'

interface MyGroupsBannerProps {
  /** Предстоящие группы; пока не загрузились — показываем «Собрать группу». */
  groups?: Group[]
  onOpen: () => void
}

/** Плашка «Мои группы» на главной. Без групп — приглашение собрать свою. */
export const MyGroupsBanner = ({ groups, onOpen }: MyGroupsBannerProps) => {
  const nearest = groups?.[0]

  return (
    <Card padding="m" onClick={onOpen} className={styles['my-groups-banner']}>
      <IconBadge icon={Users} tone="blue" />
      <span className={styles['my-groups-banner__text']}>
        <Typography.Text variant="body-strong">
          {nearest ? `Мои группы · ${groups.length}` : 'Собрать группу'}
        </Typography.Text>
        <Typography.Text variant="detail" color="secondary">
          {nearest
            ? `Ближайшая ${formatDayMonth(parseISODate(nearest.date))} · ${nearest.center.name}`
            : 'Сдать кровь с друзьями или коллегами'}
        </Typography.Text>
      </span>
      <ChevronRight size={20} className={styles['my-groups-banner__chevron']} />
    </Card>
  )
}
