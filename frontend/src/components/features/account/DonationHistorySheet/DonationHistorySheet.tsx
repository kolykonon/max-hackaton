import { Typography } from '@maxhub/max-ui'

import { useDonations } from '@/api/hooks/me'
import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { formatDonations } from '@/utils/format'

import styles from './DonationHistorySheet.module.scss'
import { HistoryItem } from './HistoryItem'
import { HistoryYear } from './HistoryYear'

interface DonationHistorySheetProps {
  open: boolean
  onClose: () => void
}

/** Шторка «История донаций». Годы и донации уже отсортированы бэком от новых к старым. */
export const DonationHistorySheet = ({ open, onClose }: DonationHistorySheetProps) => {
  const donations = useDonations(open)

  const renderBody = () => {
    if (donations.isPending) {
      return (
        <div className={styles['donation-history-sheet__loading']}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} />
          ))}
        </div>
      )
    }
    if (donations.isError) {
      return <ErrorState text="Не удалось загрузить историю" retrying={donations.isFetching} onRetry={() => donations.refetch()} />
    }
    if (donations.data.total === 0) {
      return (
        <div className={styles['donation-history-sheet__empty']}>
          <DonationIcon kind="whole_blood" size={40} framed />
          <Typography.Text variant="body" color="secondary">
            Здесь появятся ваши донации
          </Typography.Text>
        </div>
      )
    }
    return donations.data.years.map((year) => (
      <HistoryYear key={year.year} year={year.year} count={year.count}>
        {year.items.map((item) => (
          <HistoryItem key={item.id} donation={item} />
        ))}
      </HistoryYear>
    ))
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="История донаций"
      subtitle={
        donations.data && (
          <>
            <Typography.Text variant="detail" color="secondary">
              Всего {formatDonations(donations.data.total)}
            </Typography.Text>
            <DemoBadge variant="neutral" />
          </>
        )
      }
    >
      {renderBody()}
    </BottomSheet>
  )
}
