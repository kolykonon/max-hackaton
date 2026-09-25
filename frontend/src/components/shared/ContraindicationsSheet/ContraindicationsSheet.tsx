import { Typography } from '@maxhub/max-ui'

import {
  CONTRAINDICATIONS_FORBIDDEN,
  CONTRAINDICATIONS_SOURCE,
  CONTRAINDICATIONS_WAIT,
  YADONOR_URL,
} from '@/content/eligibility'

import { BottomSheet } from '../BottomSheet/BottomSheet'
import { BulletList } from '../BulletList/BulletList'
import { BulletListItem } from '../BulletList/BulletListItem'
import { SheetSection } from '../SheetSection/SheetSection'
import { TextLink } from '../TextLink/TextLink'
import styles from './ContraindicationsSheet.module.scss'
import { WaitTable } from './WaitTable'
import { WaitTableRow } from './WaitTableRow'

interface ContraindicationsSheetProps {
  open: boolean
  onClose: () => void
}

/** Шторка «Противопоказания»: общая для онбординга и экрана «Запись на донорство». */
export const ContraindicationsSheet = ({ open, onClose }: ContraindicationsSheetProps) => (
  <BottomSheet open={open} onClose={onClose} title="Противопоказания" maxHeight={80}>
    <SheetSection title="Нельзя сдавать кровь">
      <BulletList gap="m">
        {CONTRAINDICATIONS_FORBIDDEN.map((item) => (
          <BulletListItem key={item} marker="cross">
            {item}
          </BulletListItem>
        ))}
      </BulletList>
    </SheetSection>
    <SheetSection title="Нужно подождать">
      <WaitTable>
        {CONTRAINDICATIONS_WAIT.map((row) => (
          <WaitTableRow key={row.situation} situation={row.situation} wait={row.wait} />
        ))}
      </WaitTable>
    </SheetSection>
    <SheetSection>
      <Typography.Text variant="description" color="tertiary" className={styles['contraindications-sheet__source']}>
        {CONTRAINDICATIONS_SOURCE}
      </Typography.Text>
      <TextLink href={YADONOR_URL}>Полный список на сайте Службы крови</TextLink>
    </SheetSection>
  </BottomSheet>
)
