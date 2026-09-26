import { Typography } from '@maxhub/max-ui'
import { CalendarDays } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'

import styles from './NoAppointmentCard.module.scss'

interface NoAppointmentCardProps {
  /** «12 октября» — только если интервал после прошлой донации ещё идёт. */
  nextAllowed?: string
}

/** Карточка записи, вариант А: записи нет. */
export const NoAppointmentCard = ({ nextAllowed }: NoAppointmentCardProps) => (
  <Card padding="l" className={styles['no-appointment-card']}>
    <IconBadge icon={CalendarDays} size="xl" />
    <Typography.Text variant="header" className={styles['no-appointment-card__title']}>
      У вас нет записи
    </Typography.Text>
    {nextAllowed && (
      <Typography.Text variant="body" color="secondary" className={styles['no-appointment-card__hint']}>
        Сдать кровь можно с {nextAllowed}
      </Typography.Text>
    )}
  </Card>
)
