import { Typography } from '@maxhub/max-ui'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { COVER } from '@/content/guide'
import { cn } from '@/utils/cn'

import styles from './Guide.module.scss'

/**
 * Обложка на всю видимую область (высоту задаёт GuideScreen). Первый жест вниз (колесо/свайп)
 * или круглая кнопка раскрывают «а на самом деле», дальше прокрутка идёт к подготовке как обычно.
 */
export const GuideCover = ({ onNext }: { onNext: () => void }) => {
  const [shown, setShown] = useState(false)
  const [answers, setAnswers] = useState(false)
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Пока ответ не раскрыт, первый жест вниз на самом верху раскрывает его вместо прокрутки
  useEffect(() => {
    if (answers) return
    const scroller = section.current!.parentElement!.parentElement!
    let startY = 0
    const reveal = (event: Event) => {
      if (scroller.scrollTop > 0) return
      event.preventDefault()
      setAnswers(true)
    }
    const onWheel = (event: WheelEvent) => event.deltaY > 0 && reveal(event)
    const onStart = (event: TouchEvent) => (startY = event.touches[0].clientY)
    const onMove = (event: TouchEvent) => startY - event.touches[0].clientY > 10 && reveal(event)
    scroller.addEventListener('wheel', onWheel, { passive: false })
    scroller.addEventListener('touchstart', onStart, { passive: true })
    scroller.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      scroller.removeEventListener('wheel', onWheel)
      scroller.removeEventListener('touchstart', onStart)
      scroller.removeEventListener('touchmove', onMove)
    }
  }, [answers])

  return (
    <section
      ref={section}
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
      <img className={styles.cover__image} src="/guide/lottie/benefit/0.webp" alt="" width={400} height={400} />
      <button type="button" className={styles.cover__button} onClick={answers ? onNext : () => setAnswers(true)}>
        <Typography.Text variant="body-strong" asChild>
          <span>{answers ? COVER.next : COVER.ask}</span>
        </Typography.Text>
        <ChevronDown size={22} aria-hidden />
      </button>
    </section>
  )
}
