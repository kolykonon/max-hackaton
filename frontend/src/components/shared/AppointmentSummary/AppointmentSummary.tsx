import { Typography } from '@maxhub/max-ui'

import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import type { DonationType } from '@/content/types'

import styles from './AppointmentSummary.module.scss'

interface AppointmentSummaryProps {
  dateTime: string
  donationType: DonationType
  centerName: string
  address: string
}

/** Детали записи: экран «Вы записаны» и приглашение друга. */
export const AppointmentSummary = ({ dateTime, donationType, centerName, address }: AppointmentSummaryProps) => (
  <Card variant="filled" padding="l" className={styles['appointment-summary']}>
    <DonationIcon kind={donationType} size={28} framed alt={DONATION_TYPE_LABEL[donationType]} />
    <div className={styles['appointment-summary__text']}>
      <Typography.Text variant="title">{dateTime}</Typography.Text>
      <Typography.Text variant="detail" color="secondary">
        {DONATION_TYPE_LABEL[donationType]}
      </Typography.Text>
      <Typography.Text variant="body-strong" className={styles['appointment-summary__center']}>
        {centerName}
      </Typography.Text>
      <Typography.Text variant="detail" color="secondary">
        {address}
      </Typography.Text>
    </div>
  </Card>
)
