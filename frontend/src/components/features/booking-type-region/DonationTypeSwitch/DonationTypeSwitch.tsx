import { Typography } from '@maxhub/max-ui'

import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { SegmentedControl } from '@/components/shared/SegmentedControl/SegmentedControl'
import { SegmentedControlItem } from '@/components/shared/SegmentedControl/SegmentedControlItem'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import type { DonationType } from '@/content/types'

import styles from './DonationTypeSwitch.module.scss'

interface DonationTypeSwitchProps {
  value: DonationType
  onChange: (value: DonationType) => void
  /** «Цельную кровь можно сдать с 12 октября» — только если интервал не прошёл. */
  hint?: string
}

const TYPES: DonationType[] = ['whole_blood', 'plasma']

export const DonationTypeSwitch = ({ value, onChange, hint }: DonationTypeSwitchProps) => (
  <section className={styles['donation-type-switch']}>
    <Typography.Text variant="subheader">Что будете сдавать</Typography.Text>
    <SegmentedControl label="Вид донации">
      {TYPES.map((type) => (
        <SegmentedControlItem
          key={type}
          selected={value === type}
          onSelect={() => onChange(type)}
          before={<DonationIcon kind={type} size={16} />}
        >
          {DONATION_TYPE_LABEL[type]}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
    {hint && (
      <Typography.Text variant="description" color="tertiary">
        {hint}
      </Typography.Text>
    )}
  </section>
)
