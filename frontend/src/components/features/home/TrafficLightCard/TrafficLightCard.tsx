import { Typography } from '@maxhub/max-ui'
import { ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { DemoBadge } from '@/components/shared/DemoBadge/DemoBadge'
import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import { StatusLegend } from '@/components/shared/StatusLegend/StatusLegend'

import styles from './TrafficLightCard.module.scss'

interface TrafficLightCardProps {
  onOpen: () => void
}

/** Карточка «Донорский светофор» с превью карты. Нажимается целиком. */
export const TrafficLightCard = ({ onOpen }: TrafficLightCardProps) => (
  <Card padding="none" onClick={onOpen} className={styles['traffic-light-card']}>
    <MapPlaceholder label="Москва" alt="Карта станций переливания крови" className={styles['traffic-light-card__map']}>
      <DemoBadge variant="overlay" className={styles['traffic-light-card__badge']} />
    </MapPlaceholder>
    <div className={styles['traffic-light-card__body']}>
      <div className={styles['traffic-light-card__title-row']}>
        <Typography.Text variant="subheader">Донорский светофор</Typography.Text>
        <ChevronRight size={22} className={styles['traffic-light-card__chevron']} />
      </div>
      <StatusLegend />
    </div>
  </Card>
)
