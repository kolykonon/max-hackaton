import { Typography } from '@maxhub/max-ui'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { COVER } from '@/content/guide'
import { cn } from '@/utils/cn'

import styles from './Guide.module.scss'

/**
 * Обложка на всю видимую область (высоту задаёт GuideScreen). Прокрутка не блокируется:
 * круглая кнопка сначала раскрывает «а на самом деле», потом ведёт к подготовке.
 */
export const GuideCover = ({ onNext }: { onNext: () => void }) => {
  const [shown, setShown] = useState(false)
  const [answers, setAnswers] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section
      className={cn(styles.cover, shown && styles['cover--shown'], answers && styles['cover--answers'])}
      data-guide-section="cover"
    >
      <div className={cn(styles.swap, styles.cover__chip)}>
        <span aria-hidden={answers}>{COVER.doubtsChip}</span>
        <span aria-hidden={!answers}>{COVER.answersChip}</span>
      </div>
      <h1 className={styles.cover__title}>{COVER.title}</h1>
      <div className={cn(styles.swap, styles.cover__text)}>
        <p aria-hidden={answers}>{COVER.doubts}</p>
        <p aria-hidden={!answers}>{COVER.answers}</p>
      </div>
      <button type="button" className={styles.cover__button} onClick={answers ? onNext : () => setAnswers(true)}>
        <Typography.Text variant="body-strong" asChild>
          <span>{answers ? COVER.next : COVER.ask}</span>
        </Typography.Text>
        <ChevronDown size={22} aria-hidden />
      </button>
    </section>
  )
}
