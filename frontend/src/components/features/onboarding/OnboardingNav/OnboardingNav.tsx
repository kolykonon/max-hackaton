import { Button, IconButton } from '@maxhub/max-ui'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import styles from './OnboardingNav.module.scss'

interface OnboardingNavProps {
  onBack?: () => void
  onNext?: () => void
  /** На последнем экране вместо «→» кнопка «Начать». */
  onStart?: () => void
  startDisabled?: boolean
  starting?: boolean
}

/** Нижние кнопки онбординга: круглые «←» и «→» или «Начать». */
export const OnboardingNav = ({ onBack, onNext, onStart, startDisabled, starting }: OnboardingNavProps) => (
  <div className={styles['onboarding-nav']}>
    {onBack && (
      <IconButton size="large" variant="secondary" aria-label="Назад" className={styles['onboarding-nav__back']} onClick={onBack}>
        <ArrowLeft size={26} />
      </IconButton>
    )}
    {onStart ? (
      <Button
        size="large"
        stretched
        className={startDisabled ? styles['onboarding-nav__start--disabled'] : undefined}
        loading={starting}
        disabled={starting}
        aria-disabled={startDisabled}
        onClick={onStart}
      >
        Начать
      </Button>
    ) : (
      <IconButton size="large" aria-label="Далее" className={styles['onboarding-nav__next']} onClick={onNext}>
        <ArrowRight size={26} />
      </IconButton>
    )}
  </div>
)
