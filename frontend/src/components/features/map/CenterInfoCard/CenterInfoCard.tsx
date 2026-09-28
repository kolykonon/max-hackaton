import { Button, IconButton, Typography } from '@maxhub/max-ui'
import { MapPin, X } from 'lucide-react'

import type { MapCenter } from '@/api/types'
import { StatusDot } from '@/components/shared/StatusDot/StatusDot'
import { STATUS_LEGEND } from '@/content/status'
import type { BloodGroup } from '@/content/types'

import styles from './CenterInfoCard.module.scss'

interface CenterInfoCardProps {
  center: MapCenter
  group: BloodGroup | null
  onBook: () => void
  onClose: () => void
}

/** Карточка центра поверх карты: адрес, запас выбранной группы и переход к записи. */
export const CenterInfoCard = ({ center, group, onBook, onClose }: CenterInfoCardProps) => {
  const status = (group ? center.statuses[group] : center.worst) ?? 'none'
  const statusText = group
    ? `Группа ${group.replace('-', '−')}: ${STATUS_LEGEND[status].toLowerCase()}`
    : `Самый низкий запас: ${STATUS_LEGEND[status].toLowerCase()}`

  return (
    <div className={styles['center-info-card']} role="dialog" aria-label={center.name}>
      <div className={styles['center-info-card__head']}>
        <Typography.Text variant="title" className={styles['center-info-card__name']}>
          {center.name}
        </Typography.Text>
        <IconButton size="small" variant="secondary" aria-label="Закрыть" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      <span className={styles['center-info-card__row']}>
        <MapPin size={16} />
        <Typography.Text variant="detail" color="secondary">
          {center.address}
        </Typography.Text>
      </span>
      <span className={styles['center-info-card__row']}>
        <StatusDot status={status} />
        <Typography.Text variant="detail">{statusText}</Typography.Text>
      </span>
      <Button size="medium" stretched onClick={onBook}>
        Записаться
      </Button>
    </div>
  )
}
