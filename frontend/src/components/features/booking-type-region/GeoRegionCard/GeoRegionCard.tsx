import { Typography } from '@maxhub/max-ui'
import { Check, MapPin } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'

import styles from './GeoRegionCard.module.scss'

interface GeoRegionCardProps {
  regionName: string
  selected: boolean
  onSelect: () => void
}

/** Регион, определённый по геопозиции. Показывается, только если доступ дали. */
export const GeoRegionCard = ({ regionName, selected, onSelect }: GeoRegionCardProps) => (
  <Card variant={selected ? 'selected' : 'outlined'} onClick={onSelect} className={styles['geo-region-card']}>
    <MapPin size={24} className={styles['geo-region-card__icon']} fill="currentColor" stroke="white" />
    <Typography.Text variant="body" className={styles['geo-region-card__text']}>
      {regionName} · по вашей геопозиции
    </Typography.Text>
    {selected && <Check size={22} className={styles['geo-region-card__check']} />}
  </Card>
)
