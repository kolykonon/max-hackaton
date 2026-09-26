import { Typography } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { RESTRICTIONS, RESTRICTIONS_SUMMARY } from '@/content/eligibility'

import { RestrictionCard } from '../RestrictionCard/RestrictionCard'
import styles from './RestrictionsSheet.module.scss'

interface RestrictionsSheetProps {
  open: boolean
  onClose: () => void
}

/** Шторка «Почему такие ограничения». */
export const RestrictionsSheet = ({ open, onClose }: RestrictionsSheetProps) => (
  <BottomSheet open={open} onClose={onClose} title="Почему такие ограничения" maxHeight={80}>
    <ul className={styles['restrictions-sheet__list']}>
      {RESTRICTIONS.map((item) => (
        <li key={item.title}>
          <RestrictionCard item={item} />
        </li>
      ))}
    </ul>
    <Typography.Text variant="description" color="tertiary" className={styles['restrictions-sheet__summary']}>
      {RESTRICTIONS_SUMMARY}
    </Typography.Text>
  </BottomSheet>
)
