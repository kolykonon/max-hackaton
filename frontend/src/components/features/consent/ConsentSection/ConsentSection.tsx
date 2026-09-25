import { Typography } from '@maxhub/max-ui'

import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import type { InfoSection } from '@/content/donationTypes'

import styles from './ConsentSection.module.scss'

interface ConsentSectionProps {
  section: InfoSection
}

/** Раздел текста согласия: заголовок, нумерованный список и абзац. */
export const ConsentSection = ({ section }: ConsentSectionProps) => (
  <section className={styles['consent-section']}>
    <Typography.Text variant="title">{section.title}</Typography.Text>
    {section.items && (
      <BulletList ordered>
        {section.items.map((item, index) => (
          <BulletListItem key={item} marker="number" index={index + 1} size="detail">
            {item}
          </BulletListItem>
        ))}
      </BulletList>
    )}
    {section.text && (
      <Typography.Text variant="detail" color="secondary">
        {section.text}
      </Typography.Text>
    )}
  </section>
)
