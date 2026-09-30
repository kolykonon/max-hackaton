import { Typography } from '@maxhub/max-ui'

import placeholderUrl from '@/assets/geo/russia-placeholder.svg'
import { cn } from '@/utils/cn'

import styles from './MapPlaceholder.module.scss'

interface MapPlaceholderProps {
  height?: number
  className?: string
}

/** Фейковая карта светофора (scripts/build_map_placeholder.mjs), пока грузятся MapLibre, стиль и тайлы. */
export const MapPlaceholder = ({ height, className }: MapPlaceholderProps) => (
  <div className={cn(styles['map-placeholder'], className)} style={{ height }} role="status" aria-label="Загружаем карту">
    <img src={placeholderUrl} alt="" className={styles['map-placeholder__image']} />
    <Typography.Text variant="subheader" className={styles['map-placeholder__title']}>
      Донорский светофор
    </Typography.Text>
  </div>
)
