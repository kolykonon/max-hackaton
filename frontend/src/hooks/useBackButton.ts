import { useEffect, useRef } from 'react'

import { backButton } from '@/bridge/max'

/** Системная кнопка «Назад» в MAX ведёт туда же, что и «←» в шапке. */
export const useBackButton = (onBack: (() => void) | null) => {
  const handler = useRef(onBack)

  useEffect(() => {
    handler.current = onBack
  })

  const enabled = onBack !== null
  useEffect(() => {
    if (!enabled) return
    return backButton.show(() => handler.current?.())
  }, [enabled])
}
