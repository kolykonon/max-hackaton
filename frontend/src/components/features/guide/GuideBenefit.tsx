import { Typography } from '@maxhub/max-ui'

import { BenefitCard } from '@/components/features/onboarding/BenefitCard/BenefitCard'
import { HonoraryPromoCard } from '@/components/features/onboarding/HonoraryPromoCard/HonoraryPromoCard'
import { Card } from '@/components/shared/Card/Card'
import { DONATION_BENEFITS } from '@/content/benefits'
import { BENEFIT } from '@/content/guide'

import { FindCenter } from './FindCenter'
import styles from './Guide.module.scss'
import { GuideLottie } from './GuideLottie'
import { GuideSection } from './GuideSection'

export const GuideBenefit = () => (
  <GuideSection
    id="benefit"
    title={BENEFIT.title}
    subtitle={BENEFIT.subtitle}
    icon={<GuideLottie name="benefit" className={styles.section__icon} />}
  >
    <ul className={styles.cards}>
      {DONATION_BENEFITS.map((benefit) => (
        <li key={benefit.title}>
          <BenefitCard icon={benefit.icon} title={benefit.title} description={benefit.description ?? ''} />
        </li>
      ))}
    </ul>
    <HonoraryPromoCard />
    <div className={styles.cards}>
      {BENEFIT.extra.map(([title, text]) => (
        <Card key={title}>
          <Typography.Text variant="title" className={styles.card__title}>
            {title}
          </Typography.Text>
          <Typography.Text variant="body" color="secondary">
            {text}
          </Typography.Text>
        </Card>
      ))}
    </div>
    <FindCenter text={BENEFIT.find} />
  </GuideSection>
)
