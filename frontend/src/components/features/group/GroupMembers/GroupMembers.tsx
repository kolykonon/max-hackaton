import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { Card } from '@/components/shared/Card/Card'

import styles from './GroupMembers.module.scss'

interface GroupMembersProps {
  title: string
  /** Под списком: сколько свободных мест. */
  caption?: string
  children: ReactNode
}

/** Карточка со списком участников группы. */
export const GroupMembers = ({ title, caption, children }: GroupMembersProps) => (
  <Card padding="l" className={styles['group-members']}>
    <Typography.Text variant="subheader">{title}</Typography.Text>
    <ul className={styles['group-members__list']}>{children}</ul>
    {caption && (
      <Typography.Text variant="detail" color="tertiary">
        {caption}
      </Typography.Text>
    )}
  </Card>
)
