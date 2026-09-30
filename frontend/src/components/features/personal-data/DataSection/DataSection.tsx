import { Typography } from '@maxhub/max-ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import { TextLink } from '@/components/shared/TextLink/TextLink'

import styles from './DataSection.module.scss'

interface DataSectionProps {
  icon: LucideIcon
  title: string
  children: ReactNode
  onEdit?: () => void
}

/** Блок «Паспорт РФ» / «Полис ОМС» / «Контакты». */
export const DataSection = ({ icon, title, children, onEdit }: DataSectionProps) => (
  <Card padding="l" className={styles['data-section']}>
    <div className={styles['data-section__head']}>
      <IconBadge icon={icon} size="l" tone="blue" />
      <Typography.Text variant="subheader" className={styles['data-section__title']}>
        {title}
      </Typography.Text>
      {onEdit && (
        <TextLink withChevron={false} onClick={onEdit}>
          Изменить
        </TextLink>
      )}
    </div>
    <div className={styles['data-section__body']}>{children}</div>
  </Card>
)
