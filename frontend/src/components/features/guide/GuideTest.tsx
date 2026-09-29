import { Typography } from '@maxhub/max-ui'
import { ChevronDown } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { TEST } from '@/content/guide'

import { FindCenter } from './FindCenter'
import styles from './Guide.module.scss'
import { GuideSection } from './GuideSection'
import type { GuideSheet } from './GuideSheets'

const Item = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <Typography.Text variant="title" className={styles.card__title}>
      {title}
    </Typography.Text>
    {children}
  </Card>
)

export const GuideTest = ({ onOpen }: { onOpen: (sheet: GuideSheet) => void }) => (
  <GuideSection
    id="test"
    title={TEST.title}
    subtitle={TEST.subtitle}
    icon={<img className={styles.section__icon} src="/guide/test-icon.webp" alt="" width={159} height={141} loading="lazy" />}
  >
    <div className={styles.cards}>
      {TEST.items.map(([title, text]) => (
        <Item key={title} title={title}>
          <Typography.Text variant="body" color="secondary">
            {text}
          </Typography.Text>
        </Item>
      ))}
      <Item title={TEST.quarantineTitle}>
        <Typography.Text variant="body" color="secondary">
          {TEST.quarantineBefore}{' '}
          <button type="button" className={styles.term} onClick={() => onOpen('seronegative')}>
            {TEST.quarantineTerm}
          </button>{' '}
          {TEST.quarantineAfter}
        </Typography.Text>
      </Item>
      <Card>
        {TEST.afterQuarantine.map((text) => (
          <Typography.Text key={text} variant="body" color="secondary" className={styles.paragraph}>
            {text}
          </Typography.Text>
        ))}
      </Card>
      <Item title={TEST.hospitalTitle}>
        <Typography.Text variant="body" color="secondary">
          {TEST.hospital}
        </Typography.Text>
      </Item>
    </div>
    {/* details с общим name сворачивают друг друга сами, без состояния */}
    <div className={styles.cards}>
      {TEST.uses.map(([title, text], i) => (
        <details key={title} name="guide-uses" className={styles.use} open={i === 0}>
          <summary className={styles.use__summary}>
            <Typography.Text variant="title">{title}</Typography.Text>
            <ChevronDown size={20} className={styles.use__chevron} aria-hidden />
          </summary>
          <div className={styles.use__body}>
            <Typography.Text variant="body" color="secondary">
              {text}
            </Typography.Text>
            <img src={`/guide/use-${i + 1}.webp`} alt="" loading="lazy" />
          </div>
        </details>
      ))}
    </div>
    <FindCenter text={TEST.find} />
  </GuideSection>
)
