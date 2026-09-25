import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

import styles from './TextLink.module.scss'

interface TextLinkProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  withChevron?: boolean
  underline?: boolean
  className?: string
}

/** Ссылка фирменного цвета: «Все льготы и привилегии ›». С href открывается во внешнем браузере. */
export const TextLink = ({ children, onClick, href, withChevron = true, underline, className }: TextLinkProps) => {
  const classes = cn(styles['text-link'], underline && styles['text-link--underline'], className)
  const content = (
    <>
      {children}
      {withChevron && <ChevronRight size={18} strokeWidth={2.5} className={styles['text-link__chevron']} />}
    </>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  )
}
