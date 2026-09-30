import { useState } from 'react'

import { useUpdateRegion } from '@/api/hooks/me'
import { useBookingStore } from '@/store/booking'

/**
 * «Изменить» регион прямо из записи: регион один — в профиле, запись берёт его же.
 * Сохраняем в профиль и сбрасываем то, что от региона зависит (дату и центр).
 */
export const useBookingRegion = (onError: (message: string) => void, onChanged?: () => void) => {
  const setRegion = useBookingStore((state) => state.setRegion)
  const updateRegion = useUpdateRegion()
  const [open, setOpen] = useState(false)

  const select = (regionId: number) =>
    updateRegion.mutate(regionId, {
      onSuccess: () => {
        const changed = regionId !== useBookingStore.getState().regionId
        setRegion(regionId)
        setOpen(false)
        if (changed) onChanged?.()
      },
      onError: () => onError('Не удалось сохранить регион. Попробуйте ещё раз'),
    })

  return { open, openSheet: () => setOpen(true), closeSheet: () => setOpen(false), select }
}
