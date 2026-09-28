import { useEffect, useState } from 'react'

const DURATION_MS = 900

/** Плавно считает от 0 до target. Без анимации, если в системе включено «Уменьшить движение». */
export const useCountUp = (target: number): number => {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(reduceMotion ? target : 0)

  useEffect(() => {
    if (reduceMotion) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS)
      // ease-out: быстро вначале, плавно в конце
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, reduceMotion])

  return reduceMotion ? target : value
}
