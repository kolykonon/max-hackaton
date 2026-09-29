import { Typography } from '@maxhub/max-ui'
import { ChevronDown } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'

import { cn } from '@/utils/cn'

import styles from './PastGroups.module.scss'

interface PastGroupsProps {
  count: number
  children: ReactNode
}

/** Свёрнутый блок «Прошедшие · N»: раскрывается по нажатию. */
export const PastGroups = ({ count, children }: PastGroupsProps) => {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  return (
    <section className={styles['past-groups']}>
      <button
        type="button"
        className={styles['past-groups__toggle']}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <Typography.Text variant="subheader">Прошедшие · {count}</Typography.Text>
        <ChevronDown size={22} className={cn(styles['past-groups__chevron'], open && styles['past-groups__chevron--open'])} />
      </button>
      <div id={contentId} hidden={!open}>
        {children}
      </div>
    </section>
  )
}
