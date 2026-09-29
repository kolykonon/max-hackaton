import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import type { GuideSectionId } from '@/content/guide'

import styles from './Guide.module.scss'

interface GuideSectionProps {
  id: GuideSectionId
  title: string
  subtitle?: string
  /** Иконка над заголовком: картинка из public/guide или lottie. */
  icon?: ReactNode
  children: ReactNode
}

/** Раздел ленты гида. data-guide-section читает наблюдатель в GuideScreen, чтобы обновлять шапку. */
export const GuideSection = ({ id, title, subtitle, icon, children }: GuideSectionProps) => (
  <section className={styles.section} data-guide-section={id}>
    <header className={styles.section__header}>
      {icon}
      <Typography.Text variant="hero" asChild>
        <h2>{title}</h2>
      </Typography.Text>
      {subtitle && (
        <Typography.Text variant="body" color="secondary">
          {subtitle}
        </Typography.Text>
      )}
    </header>
    {children}
  </section>
)
