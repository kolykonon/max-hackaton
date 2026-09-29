import { Typography } from '@maxhub/max-ui'
import { ChevronRight } from 'lucide-react'

import type { Group } from '@/api/types'
import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { cn } from '@/utils/cn'
import { formatDayMonthWeekday, parseISODate } from '@/utils/format'

import styles from './GroupCard.module.scss'

interface GroupCardProps {
  group: Group
  onOpen: () => void
}

/** Предстоящая группа: дата, центр, сколько участников записались и записан ли я. */
export const GroupCard = ({ group, onOpen }: GroupCardProps) => {
  const booked = group.members.filter((member) => member.is_booked).length

  return (
    <li>
      <Card padding="m" onClick={onOpen} className={styles['group-card']}>
        <DonationIcon kind={group.donation_type} size={24} framed alt={DONATION_TYPE_LABEL[group.donation_type]} />
        <span className={styles['group-card__text']}>
          <Typography.Text variant="body-strong">{formatDayMonthWeekday(parseISODate(group.date))}</Typography.Text>
          <Typography.Text variant="detail" color="secondary" className={styles['group-card__center']}>
            {group.center.name}
          </Typography.Text>
          <Typography.Text variant="detail" color="tertiary">
            Участники: {group.members_count} · записались: {booked}
          </Typography.Text>
          <span className={cn(styles['group-card__status'], group.is_booked && styles['group-card__status--booked'])}>
            {group.is_booked ? 'Вы записаны' : 'Вы ещё не выбрали время'}
          </span>
        </span>
        <ChevronRight size={20} className={styles['group-card__chevron']} />
      </Card>
    </li>
  )
}
