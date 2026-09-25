import { Typography } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { ProgressBar } from '@/components/shared/ProgressBar/ProgressBar'
import { SheetSection } from '@/components/shared/SheetSection/SheetSection'
import { DONATION_TYPE_INFO } from '@/content/donationTypes'
import type { DonationKind } from '@/content/types'

import styles from './DonationTypeSheet.module.scss'

interface DonationTypeSheetProps {
  kind: DonationKind | null
  count: number
  goal: number
  /** Для смешанных: «У вас сейчас: цельная кровь — X, плазма — Y». */
  whole: number
  plasma: number
  onClose: () => void
}

/** Шторка вида донации: цельная кровь, плазма или смешанные. */
export const DonationTypeSheet = ({ kind, count, goal, whole, plasma, onClose }: DonationTypeSheetProps) => {
  if (!kind) return null
  const info = DONATION_TYPE_INFO[kind]

  const header = (
    <div className={styles['donation-type-sheet__header']}>
      <DonationIcon kind={kind} size={56} alt={info.alt} />
      <div className={styles['donation-type-sheet__progress']}>
        <Typography.Text variant="header">{info.title}</Typography.Text>
        <Typography.Text variant="detail" color="secondary">
          {count} из {goal} к званию
        </Typography.Text>
        <ProgressBar value={count} max={goal} />
      </div>
    </div>
  )

  return (
    <BottomSheet open onClose={onClose} header={header}>
      {info.sections.map((section) => {
        const items = kind === 'mixed' && section.title === 'Сколько нужно'
          ? [...(section.items ?? []), `У вас сейчас: цельная кровь — ${whole}, плазма — ${plasma}`]
          : section.items
        return (
          <SheetSection key={section.title} title={section.title}>
            {section.text && (
              <Typography.Text variant="body" color="secondary">
                {section.text}
              </Typography.Text>
            )}
            {items && (
              <BulletList>
                {items.map((item) => (
                  <BulletListItem key={item}>{item}</BulletListItem>
                ))}
              </BulletList>
            )}
          </SheetSection>
        )
      })}
    </BottomSheet>
  )
}
