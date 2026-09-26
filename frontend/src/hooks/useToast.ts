import { useCallback, useEffect, useRef, useState } from 'react'

const DURATION = 2000

/** Короткое уведомление внизу экрана на 2 секунды. */
export const useToast = () => {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(null), DURATION)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { message, show }
}
