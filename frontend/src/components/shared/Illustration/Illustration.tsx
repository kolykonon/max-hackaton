import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utils/cn'

import styles from './Illustration.module.scss'

interface IllustrationProps {
  alt: string
  src?: string
  /** Иконка внутри заглушки, пока нет настоящей картинки. */
  icon?: LucideIcon
  /** Высота в процентах от высоты экрана. */
  heightVh?: number
  className?: string
}

/**
 * Иллюстрация экрана. Пока картинок нет (ТЗ §1), показываем заглушку нужного размера.
 * Если картинка не загрузилась, блок пропадает, остальное без изменений.
 */
export const Illustration = ({ alt, src, icon: Icon, heightVh = 30, className }: IllustrationProps) => {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <div className={cn(styles.illustration, className)} style={{ height: `${heightVh}vh` }}>
      {src ? (
        <img src={src} alt={alt} className={styles.illustration__image} onError={() => setFailed(true)} />
      ) : (
        <div className={styles.illustration__placeholder} role="img" aria-label={alt}>
          {Icon && <Icon className={styles.illustration__icon} strokeWidth={1.5} />}
        </div>
      )}
    </div>
  )
}
