import { Typography } from '@maxhub/max-ui'
import { ChevronRight, MapPin } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'

import styles from './RegionRow.module.scss'

interface RegionRowProps {
  regionName?: string
  onOpen: () => void
  label?: string
  /** «Изменить» вместо шеврона — в записи. */
  actionText?: string
}

/** «Мой регион» в кабинете: по нему бот сообщает, когда в регионе не хватает группы крови. */
export const RegionRow = ({ regionName, onOpen, label = 'Мой регион', actionText }: RegionRowProps) => (
  <Card padding="m" onClick={onOpen} className={styles['region-row']}>
    <IconBadge icon={MapPin} tone="red" />
    <span className={styles['region-row__text']}>
      <Typography.Text variant="detail" color="secondary">
        {label}
      </Typography.Text>
      {regionName ? (
        <Typography.Text variant="body-strong">{regionName}</Typography.Text>
      ) : (
        <Typography.Text variant="body" className={styles['region-row__hint']}>
          Укажите регион, чтобы узнавать, когда в нём не хватает вашей группы крови
        </Typography.Text>
      )}
    </span>
    {actionText ? (
      // Вся карточка — кнопка, поэтому «Изменить» — текст, а не вложенная кнопка
      <Typography.Text variant="body-strong" className={styles['region-row__action']}>
        {actionText}
      </Typography.Text>
    ) : (
      <ChevronRight size={20} className={styles['region-row__chevron']} />
    )}
  </Card>
)
