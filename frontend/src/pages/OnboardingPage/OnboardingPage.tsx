import { Typography } from '@maxhub/max-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCompleteOnboarding } from '@/api/hooks/me'
import { getGroupCode } from '@/bridge/max'
import { OnboardingBenefits } from '@/components/features/onboarding/OnboardingBenefits/OnboardingBenefits'
import { OnboardingEligibility } from '@/components/features/onboarding/OnboardingEligibility/OnboardingEligibility'
import { OnboardingGreeting } from '@/components/features/onboarding/OnboardingGreeting/OnboardingGreeting'
import { OnboardingNav } from '@/components/features/onboarding/OnboardingNav/OnboardingNav'
import { Screen } from '@/components/layout/Screen/Screen'
import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { ConsentText } from '@/components/shared/ConsentText/ConsentText'
import { ContraindicationsSheet } from '@/components/shared/ContraindicationsSheet/ContraindicationsSheet'
import { ProgressSegments } from '@/components/shared/ProgressSegments/ProgressSegments'
import { useSwipe } from '@/hooks/useSwipe'

import styles from './OnboardingPage.module.scss'

const SLIDES_COUNT = 3

type Sheet = 'contraindications' | 'consent' | null

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(1)
  const [consent, setConsent] = useState(false)
  const [showConsentHint, setShowConsentHint] = useState(false)
  // Шторки, а не переходы: иначе онбординг теряет экран и галочку согласия
  const [sheet, setSheet] = useState<Sheet>(null)
  const completeOnboarding = useCompleteOnboarding()

  const next = () => setSlide((current) => Math.min(current + 1, SLIDES_COUNT))
  const back = () => setSlide((current) => Math.max(current - 1, 1))
  const swipe = useSwipe({ onSwipeLeft: next, onSwipeRight: back })

  const onConsentChange = (value: boolean) => {
    setConsent(value)
    if (value) setShowConsentHint(false)
  }

  const start = () => {
    if (!consent) {
      setShowConsentHint(true)
      return
    }
    const groupCode = getGroupCode()
    completeOnboarding.mutate(undefined, {
      onSuccess: () => navigate(groupCode ? `/group/${groupCode}` : '/home', { replace: true }),
    })
  }

  const isLast = slide === SLIDES_COUNT

  return (
    <Screen
      header={<ProgressSegments total={SLIDES_COUNT} current={slide} className={styles['onboarding-page__progress']} />}
      footer={
        <>
          {isLast && completeOnboarding.isError && (
            <Typography.Text variant="description" className={styles['onboarding-page__error']} role="alert">
              Не удалось сохранить. Проверьте интернет и попробуйте ещё раз
            </Typography.Text>
          )}
          <OnboardingNav
            onBack={slide > 1 ? back : undefined}
            onNext={isLast ? undefined : next}
            onStart={isLast ? start : undefined}
            startDisabled={!consent}
            starting={completeOnboarding.isPending}
          />
        </>
      }
    >
      <div className={styles['onboarding-page__slide']} {...swipe}>
        {slide === 1 && <OnboardingGreeting />}
        {slide === 2 && <OnboardingBenefits />}
        {slide === 3 && (
          <OnboardingEligibility
            consent={consent}
            onConsentChange={onConsentChange}
            showConsentHint={showConsentHint}
            onOpenContraindications={() => setSheet('contraindications')}
            onOpenConsent={() => setSheet('consent')}
          />
        )}
      </div>
      <ContraindicationsSheet open={sheet === 'contraindications'} onClose={() => setSheet(null)} />
      <BottomSheet open={sheet === 'consent'} onClose={() => setSheet(null)} title="Согласие на обработку персональных данных">
        <ConsentText />
      </BottomSheet>
    </Screen>
  )
}
