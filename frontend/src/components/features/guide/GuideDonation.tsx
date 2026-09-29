import { Typography } from '@maxhub/max-ui'

import { Card } from '@/components/shared/Card/Card'
import { CIRCLES, DONATION, type CircleId } from '@/content/guide'

import styles from './Guide.module.scss'
import { GuideSection } from './GuideSection'
import type { GuideSheet } from './GuideSheets'

export const GuideDonation = ({ onOpen }: { onOpen: (sheet: GuideSheet) => void }) => (
  <GuideSection
    id="donation"
    title={DONATION.title}
    subtitle={DONATION.subtitle}
    icon={<img className={styles.section__icon} src="/guide/donation-icon.webp" alt="" width={103} height={123} loading="lazy" />}
  >
    <div className={styles.cards}>
      {DONATION.steps.map(([title, text]) => (
        <Card key={text}>
          {title && (
            <Typography.Text variant="title" className={styles.card__title}>
              {title}
            </Typography.Text>
          )}
          <Typography.Text variant="body" color="secondary">
            {text}
          </Typography.Text>
        </Card>
      ))}
    </div>
    <div className={styles.cards}>
      <Typography.Text variant="subheader">{DONATION.afterTitle}</Typography.Text>
      <Typography.Text variant="detail" color="secondary">
        {DONATION.afterHint}
      </Typography.Text>
      {(Object.keys(CIRCLES) as CircleId[]).map((id) => (
        <Card key={id} onClick={() => onOpen(`circle-${id}`)}>
          <Typography.Text variant="title">{CIRCLES[id].title}</Typography.Text>
        </Card>
      ))}
    </div>
  </GuideSection>
)
