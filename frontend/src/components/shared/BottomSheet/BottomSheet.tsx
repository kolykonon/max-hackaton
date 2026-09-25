import { IconButton, Typography } from '@maxhub/max-ui'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { useSwipe } from '@/hooks/useSwipe'
import { cn } from '@/utils/cn'

import styles from './BottomSheet.module.scss'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /** Произвольная шапка вместо заголовка (картинка + прогресс в шторке вида донации). */
  header?: ReactNode
  subtitle?: ReactNode
  /** Максимальная высота в процентах экрана. */
  maxHeight?: 80 | 90
  children: ReactNode
}

/**
 * Шторка снизу. Закрывается крестиком, тапом по затемнению, свайпом вниз по шапке и Escape.
 * Рендерится внутри провайдера MaxUI, без портала — иначе пропадут токены темы.
 */
export const BottomSheet = ({ open, onClose, title, header, subtitle, maxHeight = 90, children }: BottomSheetProps) => {
  const swipe = useSwipe({ onSwipeDown: onClose })

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles['bottom-sheet']}>
      <div className={styles['bottom-sheet__overlay']} onClick={onClose} aria-hidden />
      <div
        className={cn(styles['bottom-sheet__panel'], styles[`bottom-sheet__panel--max-${maxHeight}`])}
        role="dialog"
        aria-modal
      >
        <div className={styles['bottom-sheet__head']} {...swipe}>
          <span className={styles['bottom-sheet__handle']} aria-hidden />
          <div className={styles['bottom-sheet__header']}>
            <div className={styles['bottom-sheet__heading']}>
              {header ?? (
                <Typography.Text variant="header" className={styles['bottom-sheet__title']}>
                  {title}
                </Typography.Text>
              )}
              {subtitle && <div className={styles['bottom-sheet__subtitle']}>{subtitle}</div>}
            </div>
            <IconButton
              size="medium"
              variant="secondary"
              aria-label="Закрыть"
              className={styles['bottom-sheet__close']}
              onClick={onClose}
            >
              <X size={20} />
            </IconButton>
          </div>
        </div>
        <div className={styles['bottom-sheet__body']}>{children}</div>
      </div>
    </div>
  )
}
