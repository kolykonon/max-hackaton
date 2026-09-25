import { Gift } from 'lucide-react'

import { Illustration } from '@/components/shared/Illustration/Illustration'
import { DONATION_BENEFITS } from '@/content/benefits'

import { BenefitCard } from '../BenefitCard/BenefitCard'
import { HonoraryPromoCard } from '../HonoraryPromoCard/HonoraryPromoCard'
import { OnboardingHeading } from '../OnboardingHeading/OnboardingHeading'
import styles from './OnboardingBenefits.module.scss'

/** Экран 2 онбординга: льготы донора. */
export const OnboardingBenefits = () => (
  <div className={styles['onboarding-benefits']}>
    <Illustration alt="Иллюстрация: подарок и капля крови" icon={Gift} heightVh={20} />
    <OnboardingHeading title="Что вы получаете при каждой донации" />
    <ul className={styles['onboarding-benefits__list']}>
      {DONATION_BENEFITS.map((benefit) => (
        <li key={benefit.title}>
          <BenefitCard icon={benefit.icon} title={benefit.title} description={benefit.description ?? ''} />
        </li>
      ))}
    </ul>
    <HonoraryPromoCard />
  </div>
)
