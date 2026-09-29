import type { AnimationItem } from 'lottie-web'
import { useEffect, useRef, useState } from 'react'

interface GuideLottieProps {
  name: 'fridge' | 'benefit'
  className?: string
}

/**
 * Покадровая lottie из public/guide/lottie/<name>. Пока блок не подъехал к экрану, показываем первый кадр,
 * а сам lottie-web (отдельный чанк) и кадры не грузим. При «уменьшении движения» остаётся первый кадр.
 */
export const GuideLottie = ({ name, className }: GuideLottieProps) => {
  const box = useRef<HTMLSpanElement>(null)
  const [poster, setPoster] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let animation: AnimationItem | undefined
    let cancelled = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        import('lottie-web').then(({ default: lottie }) => {
          if (cancelled) return
          animation = lottie.loadAnimation({
            container: box.current!,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: `/guide/lottie/${name}/data.json`,
            assetsPath: `/guide/lottie/${name}/`,
          })
          animation.addEventListener('loaded_images', () => setPoster(false))
        })
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(box.current!)
    return () => {
      cancelled = true
      observer.disconnect()
      animation?.destroy()
    }
  }, [name])

  return (
    <span ref={box} className={className}>
      {poster && <img src={`/guide/lottie/${name}/0.webp`} alt="" loading="lazy" />}
    </span>
  )
}
