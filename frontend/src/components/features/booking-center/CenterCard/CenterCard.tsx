import { Typography } from '@maxhub/max-ui'
import { Check, MapPin } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import type { BookingCenter } from '@/api/types'
import { StatusDot } from '@/components/shared/StatusDot/StatusDot'
import { GROUP_STATUS_TEXT } from '@/content/status'
import { cn } from '@/utils/cn'
import { plural } from '@/utils/format'

import { CenterPhoto } from '../CenterPhoto/CenterPhoto'
import styles from './CenterCard.module.scss'

interface CenterCardProps {
  center: BookingCenter
  selected: boolean
  onSelect: () => void
}

/** Карточка центра крови в списке и под картой. */
/** Без геопозиции расстояния нет (distance_km = null), без группы пользователя — строки светофора. */
export const CenterCard = ({ center, selected, onSelect }: CenterCardProps) => {
  const slots = `${center.free_slots} ${plural(center.free_slots, ['свободное место', 'свободных места', 'свободных мест'])}`
  const meta = center.distance_km !== null ? `${center.distance_km.toLocaleString('ru-RU')} км · ${slots}` : slots
  const status = center.group_status

  return (
    <Card variant={selected ? 'selected' : 'outlined'} padding="s" onClick={onSelect} className={styles['center-card']}>
      <CenterPhoto src={center.photo_url ?? undefined} alt={center.name} />
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
          {meta}
        </Typography.Text>
        {status && (
          <span className={cn(styles['center-card__status'], styles[`center-card__status--${status}`])}>
            <StatusDot status={status} />
            <Typography.Text variant="detail" color="inherit">
              {GROUP_STATUS_TEXT[status]}
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
