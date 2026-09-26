import { IconButton } from '@maxhub/max-ui'
import { LocateFixed, Minus, Plus } from 'lucide-react'

import styles from './MapControls.module.scss'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onLocate: () => void
}

/** Кнопки «+», «−» и «Моё местоположение». */
export const MapControls = ({ onZoomIn, onZoomOut, onLocate }: MapControlsProps) => (
  <div className={styles['map-controls']}>
    <IconButton size="medium" variant="primary-contrast" aria-label="Приблизить" className={styles['map-controls__button']} onClick={onZoomIn}>
      <Plus size={22} />
    </IconButton>
    <IconButton size="medium" variant="primary-contrast" aria-label="Отдалить" className={styles['map-controls__button']} onClick={onZoomOut}>
      <Minus size={22} />
    </IconButton>
    <IconButton
      size="medium"
      variant="primary-contrast"
      aria-label="Показать моё местоположение"
      className={styles['map-controls__button']}
      onClick={onLocate}
    >
      <LocateFixed size={22} className={styles['map-controls__locate']} />
    </IconButton>
  </div>
)
