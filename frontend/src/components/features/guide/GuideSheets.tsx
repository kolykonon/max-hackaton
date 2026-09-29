import { Typography } from '@maxhub/max-ui'
import { useState } from 'react'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { ConsentText } from '@/components/shared/ConsentText/ConsentText'
import { ContraindicationsSheet } from '@/components/shared/ContraindicationsSheet/ContraindicationsSheet'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { SegmentedControl } from '@/components/shared/SegmentedControl/SegmentedControl'
import { SegmentedControlItem } from '@/components/shared/SegmentedControl/SegmentedControlItem'
import { ADMISSION_DISCLAIMER, ONBOARDING_CHECKLIST } from '@/content/eligibility'
import { CIRCLES, FOOD_NO, FOOD_YES, HINTS, type CircleId, type HintId } from '@/content/guide'

import styles from './Guide.module.scss'

export type GuideSheet = HintId | 'food' | `circle-${CircleId}` | 'contraindications' | 'consent'

interface GuideSheetsProps {
  sheet: GuideSheet | null
  onOpen: (sheet: GuideSheet) => void
  onClose: () => void
}

const TEXT_HINTS: Exclude<HintId, 'criteria'>[] = ['traffic', 'diet', 'seronegative']

/** «Накануне донации»: вкладки «Нельзя» / «Можно». Внутри шторки, чтобы вкладка сбрасывалась при закрытии. */
const FoodTabs = () => {
  const [yes, setYes] = useState(false)
  const items = yes ? FOOD_YES : FOOD_NO
  return (
    <div className={styles.sheet}>
      <SegmentedControl label="Что можно есть накануне">
        <SegmentedControlItem selected={!yes} onSelect={() => setYes(false)}>
          Нельзя
        </SegmentedControlItem>
        <SegmentedControlItem selected={yes} onSelect={() => setYes(true)}>
          Можно
        </SegmentedControlItem>
      </SegmentedControl>
      <BulletList gap="m">
        {items.map((item) => (
          <BulletListItem key={item} marker={yes ? 'check' : 'cross'}>
            {item}
          </BulletListItem>
        ))}
      </BulletList>
    </div>
  )
}

/** Все шторки гида. Открытием управляет GuideScreen: системная «Назад» в MAX закрывает открытую шторку. */
export const GuideSheets = ({ sheet, onOpen, onClose }: GuideSheetsProps) => (
  <>
    <BottomSheet open={sheet === 'criteria'} onClose={onClose} title={HINTS.criteria.title} maxHeight={80}>
      <div className={styles.sheet}>
        <BulletList gap="m">
          {ONBOARDING_CHECKLIST.map((item) => (
            <BulletListItem key={item} marker="check">
              {item}
            </BulletListItem>
          ))}
        </BulletList>
        <OutlineButton stretched onClick={() => onOpen('contraindications')}>
          Список противопоказаний
        </OutlineButton>
        <Typography.Text variant="description" color="tertiary">
          {ADMISSION_DISCLAIMER}
        </Typography.Text>
      </div>
    </BottomSheet>
    {TEXT_HINTS.map((id) => (
      <BottomSheet key={id} open={sheet === id} onClose={onClose} title={HINTS[id].title} maxHeight={80}>
        <div className={styles.sheet}>
          {HINTS[id].text?.map((paragraph) => (
            <Typography.Text key={paragraph} variant="body">
              {paragraph}
            </Typography.Text>
          ))}
        </div>
      </BottomSheet>
    ))}
    <BottomSheet open={sheet === 'food'} onClose={onClose} title="Накануне донации крови" maxHeight={80}>
      <FoodTabs />
    </BottomSheet>
    {(Object.keys(CIRCLES) as CircleId[]).map((id) => (
      <BottomSheet key={id} open={sheet === `circle-${id}`} onClose={onClose} title={CIRCLES[id].popupTitle} maxHeight={80}>
        <BulletList gap="m">
          {CIRCLES[id].items.map((item) => (
            <BulletListItem key={item}>{item}</BulletListItem>
          ))}
        </BulletList>
      </BottomSheet>
    ))}
    <ContraindicationsSheet open={sheet === 'contraindications'} onClose={onClose} />
    <BottomSheet open={sheet === 'consent'} onClose={onClose} title="Согласие на обработку персональных данных">
      <ConsentText />
    </BottomSheet>
  </>
)
