import { Typography } from '@maxhub/max-ui'

import { ConsentSection } from '@/components/features/consent/ConsentSection/ConsentSection'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { Card } from '@/components/shared/Card/Card'
import { CONSENT_DEMO_NOTE, CONSENT_INTRO, CONSENT_SECTIONS } from '@/content/consent'

import styles from './ConsentPage.module.scss'

/** Экран «Согласие на обработку персональных данных». Текст — docs/legal/consent.md. */
export const ConsentPage = () => (
  <Screen header={<PageHeader title="Согласие на обработку ПД" align="center" />} contentClassName={styles['consent-page']}>
    <Typography.Text variant="detail" color="secondary" className={styles['consent-page__intro']}>
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
  </Screen>
)
