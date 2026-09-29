import { Button, Typography } from '@maxhub/max-ui'
import { HeartHandshake } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Illustration } from '@/components/shared/Illustration/Illustration'
import { COVER } from '@/content/guide'
import { cn } from '@/utils/cn'

import styles from './Guide.module.scss'

/**
 * Обложка. Прокрутка не блокируется: кнопка сначала раскрывает «а на самом деле», потом ведёт к подготовке.
 * Плавно выезжает после первого кадра, чтобы не дёргаться на старте.
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
      <Illustration alt="Иллюстрация: сердце и рукопожатие" icon={HeartHandshake} heightVh={14} />
      <div className={cn(styles.swap, styles.cover__chip)}>
        <span aria-hidden={answers}>{COVER.doubtsChip}</span>
        <span aria-hidden={!answers}>{COVER.answersChip}</span>
      </div>
      <Typography.Text variant="hero" asChild>
        <h1 className={styles.cover__title}>{COVER.title}</h1>
      </Typography.Text>
      <div className={cn(styles.swap, styles.cover__text)}>
        <Typography.Text variant="hero" aria-hidden={answers}>
          {COVER.doubts}
        </Typography.Text>
        <Typography.Text variant="hero" aria-hidden={!answers}>
          {COVER.answers}
        </Typography.Text>
      </div>
      <Button size="large" stretched className={styles.cover__button} onClick={answers ? onNext : () => setAnswers(true)}>
        {answers ? COVER.next : COVER.ask}
      </Button>
    </section>
  )
}
