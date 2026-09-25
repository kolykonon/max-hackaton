import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OnboardingBenefits } from '@/components/features/onboarding/OnboardingBenefits/OnboardingBenefits'
import { OnboardingEligibility } from '@/components/features/onboarding/OnboardingEligibility/OnboardingEligibility'
import { OnboardingGreeting } from '@/components/features/onboarding/OnboardingGreeting/OnboardingGreeting'
import { OnboardingNav } from '@/components/features/onboarding/OnboardingNav/OnboardingNav'
import { Screen } from '@/components/layout/Screen/Screen'
import { ContraindicationsSheet } from '@/components/shared/ContraindicationsSheet/ContraindicationsSheet'
import { ProgressSegments } from '@/components/shared/ProgressSegments/ProgressSegments'
import { useSwipe } from '@/hooks/useSwipe'

import styles from './OnboardingPage.module.scss'

const SLIDES_COUNT = 3

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(1)
  const [consent, setConsent] = useState(false)
  const [showConsentHint, setShowConsentHint] = useState(false)
  const [contraindicationsOpen, setContraindicationsOpen] = useState(false)
  const [starting, setStarting] = useState(false)

  const next = () => setSlide((current) => Math.min(current + 1, SLIDES_COUNT))
  const back = () => setSlide((current) => Math.max(current - 1, 1))
  const swipe = useSwipe({ onSwipeLeft: next, onSwipeRight: back })

  const onConsentChange = (value: boolean) => {
    setConsent(value)
    if (value) setShowConsentHint(false)
  }

  // TODO: POST /me/onboarding; ошибка — «Не удалось сохранить…» над кнопками
  const start = () => {
    if (!consent) {
      setShowConsentHint(true)
      return
    }
    setStarting(true)
    window.setTimeout(() => navigate('/home', { replace: true }), 600)
  }

  const isLast = slide === SLIDES_COUNT

  return (
    <Screen
      header={<ProgressSegments total={SLIDES_COUNT} current={slide} className={styles['onboarding-page__progress']} />}
      footer={
        <OnboardingNav
          onBack={slide > 1 ? back : undefined}
          onNext={isLast ? undefined : next}
          onStart={isLast ? start : undefined}
          startDisabled={!consent}
          starting={starting}
        />
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
            onOpenContraindications={() => setContraindicationsOpen(true)}
          />
        )}
      </div>
      <ContraindicationsSheet open={contraindicationsOpen} onClose={() => setContraindicationsOpen(false)} />
    </Screen>
  )
}
