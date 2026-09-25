import { Typography } from '@maxhub/max-ui'
import { Bell, CalendarDays, Trash2 } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import type { DonationType } from '@/content/types'

import styles from './AppointmentCard.module.scss'

interface AppointmentCardProps {
  dateTime: string
  donationType: DonationType
  centerName: string
  address: string
  onReschedule: () => void
  onCancel: () => void
}

/** Карточка записи, вариант Б: «Вы записаны». */
export const AppointmentCard = ({ dateTime, donationType, centerName, address, onReschedule, onCancel }: AppointmentCardProps) => (
  <Card padding="l" className={styles['appointment-card']}>
    <span className={styles['appointment-card__label']}>Вы записаны</span>
    <Typography.Text variant="header" className={styles['appointment-card__date']}>
      {dateTime}
    </Typography.Text>
    <div className={styles['appointment-card__details']}>
      <span className={styles['appointment-card__type']}>
        <DonationIcon kind={donationType} size={20} />
        <Typography.Text variant="body">{DONATION_TYPE_LABEL[donationType]}</Typography.Text>
      </span>
      <Typography.Text variant="body" className={styles['appointment-card__center']}>
        {centerName}
      </Typography.Text>
      <Typography.Text variant="detail" color="tertiary" className={styles['appointment-card__address']}>
        {address}
      </Typography.Text>
    </div>
    <div className={styles['appointment-card__reminder']}>
      <Bell size={20} />
      <Typography.Text variant="detail" color="secondary">
        Напомним в чате за день до донации
      </Typography.Text>
    </div>
    <div className={styles['appointment-card__actions']}>
      <OutlineButton size="medium" stretched iconBefore={<CalendarDays size={20} />} onClick={onReschedule}>
        Перенести
      </OutlineButton>
      <OutlineButton size="medium" stretched tone="negative" iconBefore={<Trash2 size={20} />} onClick={onCancel}>
        Отменить
      </OutlineButton>
    </div>
  </Card>
)
