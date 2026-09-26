import { Typography } from '@maxhub/max-ui'

import { CONSENT_DEMO_NOTE, CONSENT_INTRO, CONSENT_SECTIONS } from '@/content/consent'

import { Card } from '../Card/Card'
import { ConsentSection } from './ConsentSection'
import styles from './ConsentText.module.scss'

/** Текст согласия на обработку ПД (docs/legal/consent.md): страница /consent и шторка в онбординге. */
export const ConsentText = () => (
  <div className={styles['consent-text']}>
    <Typography.Text variant="detail" color="secondary" className={styles['consent-text__intro']}>
      {CONSENT_INTRO}
    </Typography.Text>
    {CONSENT_SECTIONS.map((section) => (
      <ConsentSection key={section.title} section={section} />
    ))}
    <Card variant="filled">
      <Typography.Text variant="detail" color="secondary">
        {CONSENT_DEMO_NOTE}
      </Typography.Text>
    </Card>
  </div>
)
