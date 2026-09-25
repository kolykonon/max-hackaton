import { Typography } from '@maxhub/max-ui'

import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import type { Donation } from '@/content/demo'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { formatDayMonth } from '@/utils/format'

import styles from './DonationHistorySheet.module.scss'

interface HistoryItemProps {
  donation: Donation
}

/** Карточка донации. Год не пишем — он в заголовке. */
export const HistoryItem = ({ donation }: HistoryItemProps) => (
  <li>
    <Card className={styles['history-item']}>
      <DonationIcon kind={donation.type} size={26} framed />
      <div className={styles['history-item__text']}>
        <Typography.Text variant="title">{DONATION_TYPE_LABEL[donation.type]}</Typography.Text>
        <Typography.Text variant="body">{formatDayMonth(donation.date)}</Typography.Text>
        <Typography.Text variant="detail" color="tertiary" className={styles['history-item__center']}>
          {donation.centerName}
        </Typography.Text>
      </div>
    </Card>
  </li>
)
