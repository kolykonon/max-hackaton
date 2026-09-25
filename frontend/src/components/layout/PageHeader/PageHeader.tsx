import { IconButton, Typography } from '@maxhub/max-ui'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/utils/cn'

import styles from './PageHeader.module.scss'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Без обработчика «←» возвращает на предыдущий экран. */
  onBack?: () => void
  hideBack?: boolean
  align?: 'left' | 'center'
  size?: 'm' | 'l'
  after?: ReactNode
  children?: ReactNode
  className?: string
}

/** Шапка экрана: «←» и заголовок. children — то, что под заголовком (прогресс шагов). */
export const PageHeader = ({
  title,
  subtitle,
  onBack,
  hideBack,
  align = 'left',
  size = 'm',
  after,
  children,
  className,
}: PageHeaderProps) => {
  const navigate = useNavigate()

  return (
    <header className={cn(styles['page-header'], styles[`page-header--${align}`], className)}>
      <div className={styles['page-header__row']}>
        {!hideBack && (
          <IconButton
            size="medium"
            variant="ghost"
            aria-label="Назад"
            className={styles['page-header__back']}
            onClick={onBack ?? (() => navigate(-1))}
          >
            <ArrowLeft size={24} />
          </IconButton>
        )}
        <div className={styles['page-header__titles']}>
          <Typography.Text variant={size === 'l' ? 'header' : 'subheader'} className={styles['page-header__title']}>
            {title}
          </Typography.Text>
          {subtitle && (
            <Typography.Text variant="detail" color="tertiary" className={styles['page-header__subtitle']}>
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {after && <div className={styles['page-header__after']}>{after}</div>}
      </div>
      {children}
    </header>
  )
}
