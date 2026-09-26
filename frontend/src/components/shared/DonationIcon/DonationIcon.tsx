import { useId } from 'react'

import type { DonationKind } from '@/content/types'
import { cn } from '@/utils/cn'

import styles from './DonationIcon.module.scss'

interface DonationIconProps {
  kind: DonationKind
  size?: number
  /** Капля в мягком круге — для карточек истории и «Вы записаны». */
  framed?: boolean
  alt?: string
  className?: string
}

const DROP_PATH = 'M12 2.5c0 0-7 7.7-7 12.5a7 7 0 0 0 14 0c0-4.8-7-12.5-7-12.5Z'

/** Капля вида донации: красная — кровь, жёлтая — плазма, половинки — смешанные. */
export const DonationIcon = ({ kind, size = 24, framed, alt, className }: DonationIconProps) => {
  const gradientId = useId()
  const fill = kind === 'mixed' ? `url(#${gradientId})` : undefined

  return (
    <span
      className={cn(styles['donation-icon'], styles[`donation-icon--${kind}`], framed && styles['donation-icon--framed'], className)}
      style={framed ? { width: size * 1.75, height: size * 1.75 } : undefined}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        {kind === 'mixed' && (
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="50%" className={styles['donation-icon__stop-blood']} />
              <stop offset="50%" className={styles['donation-icon__stop-plasma']} />
            </linearGradient>
          </defs>
        )}
        <path d={DROP_PATH} className={styles['donation-icon__drop']} fill={fill} />
        <path d="M9 12.5c-.8 1.2-1.2 2.3-1.2 3.3" className={styles['donation-icon__shine']} />
      </svg>
    </span>
  )
}
