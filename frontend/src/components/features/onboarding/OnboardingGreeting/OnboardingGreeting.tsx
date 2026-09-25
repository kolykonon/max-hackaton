import { HandHeart } from 'lucide-react'

import { Illustration } from '@/components/shared/Illustration/Illustration'

import { OnboardingHeading } from '../OnboardingHeading/OnboardingHeading'
import styles from './OnboardingGreeting.module.scss'

/** Экран 1 онбординга. */
export const OnboardingGreeting = () => (
  <div className={styles['onboarding-greeting']}>
    <Illustration alt="Иллюстрация: капля крови в ладонях" icon={HandHeart} heightVh={36} />
    <OnboardingHeading
      title="Спасибо, что решили стать донором"
      text="Сдать кровь — значит помочь тому, кто прямо сейчас в ней нуждается. Мы расскажем, как подготовиться, и поможем на каждом шаге."
    />
  </div>
)
