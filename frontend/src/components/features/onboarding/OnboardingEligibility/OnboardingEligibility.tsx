import { Typography } from '@maxhub/max-ui'
import { ClipboardCheck } from 'lucide-react'

import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { Illustration } from '@/components/shared/Illustration/Illustration'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { ADMISSION_DISCLAIMER, ONBOARDING_CHECKLIST } from '@/content/eligibility'

import { ConsentCheckbox } from '../ConsentCheckbox/ConsentCheckbox'
import { OnboardingHeading } from '../OnboardingHeading/OnboardingHeading'
import styles from './OnboardingEligibility.module.scss'

interface OnboardingEligibilityProps {
  consent: boolean
  onConsentChange: (value: boolean) => void
  showConsentHint: boolean
  onOpenContraindications: () => void
}

/** Экран 3 онбординга: кто может сдать кровь и согласие. */
export const OnboardingEligibility = ({
  consent,
  onConsentChange,
  showConsentHint,
  onOpenContraindications,
}: OnboardingEligibilityProps) => (
  <div className={styles['onboarding-eligibility']}>
    <Illustration alt="Иллюстрация: планшет с чек-листом" icon={ClipboardCheck} heightVh={18} />
    <OnboardingHeading title="Кто может сдать кровь" />
    <BulletList gap="m">
      {ONBOARDING_CHECKLIST.map((item) => (
        <BulletListItem key={item} marker="check">
          {item}
        </BulletListItem>
      ))}
    </BulletList>
    <OutlineButton stretched onClick={onOpenContraindications}>
      Список противопоказаний
    </OutlineButton>
    <Typography.Text variant="description" color="tertiary" className={styles['onboarding-eligibility__disclaimer']}>
      {ADMISSION_DISCLAIMER}
    </Typography.Text>
    <ConsentCheckbox checked={consent} onChange={onConsentChange} showHint={showConsentHint} />
  </div>
)
