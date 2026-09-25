import { Typography } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import type { Donation } from '@/content/demo'
import { formatDonations } from '@/utils/format'

import styles from './DonationHistorySheet.module.scss'
import { HistoryItem } from './HistoryItem'
import { HistoryYear } from './HistoryYear'

interface DonationHistorySheetProps {
  open: boolean
  donations: Donation[]
  onClose: () => void
}

/** Группы по годам от нового к старому, внутри — донации от новой к старой. */
const groupByYear = (donations: Donation[]) => {
  const sorted = [...donations].sort((a, b) => b.date.getTime() - a.date.getTime())
  const years = new Map<number, Donation[]>()
  sorted.forEach((donation) => {
    const year = donation.date.getFullYear()
    years.set(year, [...(years.get(year) ?? []), donation])
  })
  return [...years.entries()]
}

/** Шторка «История донаций». */
export const DonationHistorySheet = ({ open, donations, onClose }: DonationHistorySheetProps) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    title="История донаций"
    subtitle={
      <>
        <Typography.Text variant="detail" color="secondary">
          Всего {formatDonations(donations.length)}
        </Typography.Text>
        <DemoBadge variant="neutral" />
      </>
    }
  >
    {donations.length === 0 ? (
      <div className={styles['donation-history-sheet__empty']}>
        <DonationIcon kind="whole_blood" size={40} framed />
        <Typography.Text variant="body" color="secondary">
          Здесь появятся ваши донации
        </Typography.Text>
      </div>
    ) : (
      groupByYear(donations).map(([year, items]) => (
        <HistoryYear key={year} year={year} count={items.length}>
          {items.map((donation) => (
            <HistoryItem key={donation.id} donation={donation} />
          ))}
        </HistoryYear>
      ))
    )}
  </BottomSheet>
)
