import { cn } from '@/utils/cn'

import styles from './SlotButton.module.scss'

interface SlotButtonProps {
  time: string
  isFree: boolean
  selected: boolean
  onSelect: () => void
}

/** Кнопка слота: свободен, занят или выбран. */
export const SlotButton = ({ time, isFree, selected, onSelect }: SlotButtonProps) => (
  <button
    type="button"
    className={cn(styles['slot-button'], !isFree && styles['slot-button--busy'], selected && styles['slot-button--selected'])}
    disabled={!isFree}
    aria-pressed={selected}
    aria-label={isFree ? time : `${time}, занято`}
    onClick={onSelect}
  >
    {time}
  </button>
)
