import { Avatar, Typography } from '@maxhub/max-ui'
import { Check } from 'lucide-react'

import type { GroupMember } from '@/api/types'

import styles from './GroupMemberItem.module.scss'

interface GroupMemberItemProps {
  member: GroupMember
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)

/** Участник группы: аватар, имя и время записи, если уже записался. */
export const GroupMemberItem = ({ member }: GroupMemberItemProps) => {
  const initials = initialsOf(member.name)

  return (
    <li className={styles['group-member-item']}>
      <Avatar.Container size={40} form="circle">
        {member.photo_url ? (
          <Avatar.Image src={member.photo_url} alt="" fallback={initials} fallbackGradient="blue" />
        ) : (
          <Avatar.Text gradient="blue">{initials}</Avatar.Text>
        )}
      </Avatar.Container>
      <div className={styles['group-member-item__text']}>
        <Typography.Text variant="body-strong">
          {member.name}
          {member.is_owner && (
            <span className={styles['group-member-item__owner']}> · собирает группу</span>
          )}
        </Typography.Text>
        <Typography.Text variant="detail" color="secondary">
          {member.booked_time ? `Придёт в ${member.booked_time}` : 'Ещё выбирает время'}
        </Typography.Text>
      </div>
      {member.is_booked && <Check size={20} className={styles['group-member-item__check']} aria-label="Есть запись" />}
    </li>
  )
}
