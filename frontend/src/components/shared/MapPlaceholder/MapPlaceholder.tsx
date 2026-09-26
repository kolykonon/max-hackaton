import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './MapPlaceholder.module.scss'

interface MapPlaceholderProps {
  label?: string
  alt: string
  children?: ReactNode
  className?: string
}

/**
 * Заглушка карты. Настоящая карта — SVG через d3-geo (ТЗ §9, задача FE2).
 * children позиционируются абсолютно поверх: метки, кнопки, бейджи.
 */
export const MapPlaceholder = ({ label, alt, children, className }: MapPlaceholderProps) => (
  <div className={cn(styles['map-placeholder'], className)} role="img" aria-label={alt}>
    {label && (
      <Typography.Text variant="title" className={styles['map-placeholder__label']}>
        {label}
      </Typography.Text>
    )}
    {children}
  </div>
)
