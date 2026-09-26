import { Typography } from '@maxhub/max-ui'

import type { Donation } from '@/api/types'
import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { formatDayMonth, parseISODate } from '@/utils/format'

import styles from './DonationHistorySheet.module.scss'

interface HistoryItemProps {
  donation: Donation
}

/** Карточка донации. Год не пишем — он в заголовке. */
export const HistoryItem = ({ donation }: HistoryItemProps) => (
  <li>
    <Card className={styles['history-item']}>
      <DonationIcon kind={donation.donation_type} size={26} framed />
      <div className={styles['history-item__text']}>
        <Typography.Text variant="title">{DONATION_TYPE_LABEL[donation.donation_type]}</Typography.Text>
        <Typography.Text variant="body">{formatDayMonth(parseISODate(donation.donated_on))}</Typography.Text>
        {donation.center_name && (
          <Typography.Text variant="detail" color="tertiary" className={styles['history-item__center']}>
            {donation.center_name}
          </Typography.Text>
        )}
      </div>
    </Card>
  </li>
)
