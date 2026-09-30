import { Typography } from '@maxhub/max-ui'
import { Check, MapPin } from 'lucide-react'
import { useState } from 'react'

import { Card } from '@/components/shared/Card/Card'
import type { BookingCenter } from '@/api/types'
import { StatusDot } from '@/components/shared/StatusDot/StatusDot'
import { GROUP_STATUS_TEXT } from '@/content/status'
import { cn } from '@/utils/cn'
import { plural } from '@/utils/format'

import styles from './CenterCard.module.scss'

interface CenterCardProps {
  center: BookingCenter
  selected: boolean
  onSelect: () => void
}

/** Карточка центра крови в списке и под картой. */
/** Без геопозиции расстояния нет (distance_km = null), без группы пользователя — строки светофора. */
export const CenterCard = ({ center, selected, onSelect }: CenterCardProps) => {
  const [statusOpen, setStatusOpen] = useState(false)
  const full = center.free_slots === 0
  const slots = full
    ? 'На эту дату мест нет'
    : `${center.free_slots} ${plural(center.free_slots, ['свободное место', 'свободных места', 'свободных мест'])}`
  const distance = center.distance_km !== null ? `${center.distance_km.toLocaleString('ru-RU')} км` : null
  const meta = [center.is_usual && 'Ваш центр', distance, slots].filter(Boolean).join(' · ')
  const status = center.group_status

  return (
    <Card
      variant={selected ? 'selected' : 'outlined'}
      padding="s"
      aria-disabled={full}
      className={cn(styles['center-card'], full && styles['center-card--full'])}
    >
      {!full && (
        <button
          type="button"
          className={styles['center-card__select']}
          aria-label={`Выбрать центр «${center.name}»`}
          aria-pressed={selected}
          onClick={onSelect}
        />
      )}
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
          <button
            type="button"
            className={cn(
              styles['center-card__status'],
              styles[`center-card__status--${status}`],
              statusOpen && styles['center-card__status--open'],
            )}
            aria-label={GROUP_STATUS_TEXT[status]}
            aria-expanded={statusOpen}
            onClick={() => setStatusOpen((open) => !open)}
            onBlur={() => setStatusOpen(false)}
          >
            <StatusDot status={status} size="m" />
            <span className={styles['center-card__tooltip']} role="tooltip">
              {GROUP_STATUS_TEXT[status]}
            </span>
          </button>
        )}
      </div>
      <span className={cn(styles['center-card__radio'], selected && styles['center-card__radio--checked'])} aria-hidden>
        {selected && <Check size={16} strokeWidth={3} />}
      </span>
    </Card>
  )
}
