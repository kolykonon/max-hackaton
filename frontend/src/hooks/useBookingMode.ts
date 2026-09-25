import { useSearchParams } from 'react-router-dom'

/** Режим мастера записи: новая запись или перенос (?mode=reschedule). */
export const useBookingMode = () => {
  const [searchParams] = useSearchParams()
  const isReschedule = searchParams.get('mode') === 'reschedule'

  /** Добавляет режим к ссылке на следующий шаг. */
  const withMode = (path: string) => (isReschedule ? `${path}?mode=reschedule` : path)

  return { isReschedule, withMode }
}
