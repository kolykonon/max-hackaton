import { Typography } from '@maxhub/max-ui'

import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import type { DonationKind } from '@/content/types'

import styles from './HonoraryConditionCard.module.scss'

interface HonoraryConditionCardProps {
  kind: DonationKind
  title: string
  description: string
}

/** Один из путей к званию: только кровь, только плазма или смешанные. */
export const HonoraryConditionCard = ({ kind, title, description }: HonoraryConditionCardProps) => (
  <Card className={styles['honorary-condition']}>
    <DonationIcon kind={kind} size={24} framed />
    <div className={styles['honorary-condition__text']}>
      <Typography.Text variant="title">{title}</Typography.Text>
      <Typography.Text variant="detail" color="secondary">
        {description}
      </Typography.Text>
    </div>
  </Card>
)
