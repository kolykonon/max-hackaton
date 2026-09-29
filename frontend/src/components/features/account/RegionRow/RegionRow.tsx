import { Typography } from '@maxhub/max-ui'
import { ChevronRight, MapPin } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'

import styles from './RegionRow.module.scss'

interface RegionRowProps {
  regionName?: string
  onOpen: () => void
}

/** «Мой регион» в кабинете: по нему бот сообщает, когда в регионе не хватает группы крови. */
export const RegionRow = ({ regionName, onOpen }: RegionRowProps) => (
  <Card padding="m" onClick={onOpen} className={styles['region-row']}>
    <IconBadge icon={MapPin} tone="red" />
    <span className={styles['region-row__text']}>
      <Typography.Text variant="detail" color="secondary">
        Мой регион
      </Typography.Text>
      {regionName ? (
        <Typography.Text variant="body-strong">{regionName}</Typography.Text>
      ) : (
        <Typography.Text variant="body" className={styles['region-row__hint']}>
          Укажите регион, чтобы узнавать, когда в нём не хватает вашей группы крови
        </Typography.Text>
      )}
    </span>
    <ChevronRight size={20} className={styles['region-row__chevron']} />
  </Card>
)
