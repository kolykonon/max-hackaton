import { useEffect, useState } from 'react'

export type GeoState =
  | { status: 'pending' }
  | { status: 'granted'; lat: number; lon: number }
  | { status: 'denied' }

/** Запрос геолокации при открытии экрана. Координаты не храним (согласие, п. 8). */
export const useGeolocation = (enabled = true): GeoState => {
  const [state, setState] = useState<GeoState>(() =>
    enabled && 'geolocation' in navigator ? { status: 'pending' } : { status: 'denied' },
  )

  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setState({ status: 'granted', lat: coords.latitude, lon: coords.longitude }),
      () => setState({ status: 'denied' }),
      { timeout: 8000, maximumAge: 600_000 },
    )
  }, [enabled])

  return state
}
