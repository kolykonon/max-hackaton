import { Typography } from '@maxhub/max-ui'

import { TextLink } from '@/components/shared/TextLink/TextLink'

import styles from './SummaryCard.module.scss'

interface SummarySectionProps {
  label: string
  value: string
  caption?: string
  /** Без обработчика ссылки «Изменить» нет. */
  onEdit?: () => void
}

export const SummarySection = ({ label, value, caption, onEdit }: SummarySectionProps) => (
  <div className={styles['summary-card__section']}>
    <div className={styles['summary-card__head']}>
      <Typography.Text variant="detail" color="tertiary">
        {label}
      </Typography.Text>
      {onEdit && (
        <TextLink withChevron={false} onClick={onEdit}>
          Изменить
        </TextLink>
      )}
    </div>
    <Typography.Text variant="title" className={styles['summary-card__value']}>
      {value}
    </Typography.Text>
    {caption && (
      <Typography.Text variant="detail" color="secondary" className={styles['summary-card__caption']}>
        {caption}
      </Typography.Text>
    )}
  </div>
)
