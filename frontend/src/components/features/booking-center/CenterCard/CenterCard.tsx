import { Typography } from '@maxhub/max-ui'
import { Check, MapPin } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { StatusDot } from '@/components/shared/StatusDot/StatusDot'
import type { Center } from '@/content/demo'
import { GROUP_STATUS_TEXT } from '@/content/status'
import { cn } from '@/utils/cn'

import { CenterPhoto } from '../CenterPhoto/CenterPhoto'
import styles from './CenterCard.module.scss'

interface CenterCardProps {
  center: Center
  selected: boolean
  /** Без геопозиции расстояние не показываем. */
  showDistance?: boolean
  /** Если группа пользователя неизвестна, строки светофора нет. */
  showGroupStatus?: boolean
  onSelect: () => void
}

/** Карточка центра крови в списке и под картой. */
export const CenterCard = ({ center, selected, showDistance = true, showGroupStatus = true, onSelect }: CenterCardProps) => {
  const distance = `${center.distanceKm.toLocaleString('ru-RU')} км`
  const slots = `${center.freeSlots} свободных мест`

  return (
    <Card variant={selected ? 'selected' : 'outlined'} padding="s" onClick={onSelect} className={styles['center-card']}>
      <CenterPhoto alt={center.name} />
      <div className={styles['center-card__info']}>
        <Typography.Text variant="title" className={styles['center-card__name']}>
          {center.name}
        </Typography.Text>
        <span className={styles['center-card__address']}>
          <MapPin size={16} />
          <Typography.Text variant="detail" color="secondary">
            {center.address}
          </Typography.Text>
        </span>
        <Typography.Text variant="detail" color="tertiary" className={styles['center-card__meta']}>
          {showDistance ? `${distance} · ${slots}` : slots}
        </Typography.Text>
        {showGroupStatus && (
          <span className={cn(styles['center-card__status'], styles[`center-card__status--${center.groupStatus}`])}>
            <StatusDot status={center.groupStatus} />
            <Typography.Text variant="detail" color="inherit">
              {GROUP_STATUS_TEXT[center.groupStatus]}
            </Typography.Text>
          </span>
        )}
      </div>
      <span className={cn(styles['center-card__radio'], selected && styles['center-card__radio--checked'])} aria-hidden>
        {selected && <Check size={16} strokeWidth={3} />}
      </span>
    </Card>
  )
}
