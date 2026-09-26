import { Typography } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { SheetSection } from '@/components/shared/SheetSection/SheetSection'
import { BENEFITS_FOOTNOTE, DONATION_BENEFITS, HONORARY_BENEFITS, HONORARY_CONDITION_FULL } from '@/content/benefits'

import styles from './BenefitsSheet.module.scss'

interface BenefitsSheetProps {
  open: boolean
  onClose: () => void
}

/** Шторка «Льготы и привилегии». */
export const BenefitsSheet = ({ open, onClose }: BenefitsSheetProps) => (
  <BottomSheet open={open} onClose={onClose} title="Льготы и привилегии" maxHeight={90}>
    <SheetSection title="При каждой донации">
      {DONATION_BENEFITS.map((item) => (
        <InfoRow key={item.title} icon={item.icon} tone={item.tone} size="l" title={item.title} description={item.description} />
      ))}
    </SheetSection>
    <SheetSection title="Почётный донор России" description={HONORARY_CONDITION_FULL}>
      {HONORARY_BENEFITS.map((item) => (
        <InfoRow key={item.title} icon={item.icon} tone={item.tone} size="l" title={item.title} description={item.description} />
      ))}
    </SheetSection>
    <Typography.Text variant="description" color="tertiary" className={styles['benefits-sheet__footnote']}>
      {BENEFITS_FOOTNOTE}
    </Typography.Text>
  </BottomSheet>
)
