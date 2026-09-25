import { Typography } from '@maxhub/max-ui'

import styles from './OnboardingHeading.module.scss'

interface OnboardingHeadingProps {
  title: string
  text?: string
}

/** Крупный заголовок экрана онбординга и текст под ним, по центру. */
export const OnboardingHeading = ({ title, text }: OnboardingHeadingProps) => (
  <div className={styles['onboarding-heading']}>
    <Typography.Text variant="hero" asChild>
      <h1 className={styles['onboarding-heading__title']}>{title}</h1>
    </Typography.Text>
    {text && (
      <Typography.Text variant="body" color="secondary" asChild>
        <p className={styles['onboarding-heading__text']}>{text}</p>
      </Typography.Text>
    )}
  </div>
)
