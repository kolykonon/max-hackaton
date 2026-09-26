import { useRef } from 'react'
import type { TouchEvent } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeDown?: () => void
}

const THRESHOLD = 60

/** Горизонтальные и вертикальные свайпы для онбординга и шторок. */
export const useSwipe = ({ onSwipeLeft, onSwipeRight, onSwipeDown }: SwipeHandlers) => {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    start.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (!start.current) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.current.x
    const dy = touch.clientY - start.current.y
    start.current = null

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx <= -THRESHOLD) onSwipeLeft?.()
      if (dx >= THRESHOLD) onSwipeRight?.()
    } else if (dy >= THRESHOLD) {
      onSwipeDown?.()
    }
  }

  return { onTouchStart, onTouchEnd }
}
