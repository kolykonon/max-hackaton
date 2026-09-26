import { Button } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'

import styles from './DemoMenuSheet.module.scss'

export type DemoAction = 'reset' | 'remind' | 'complete'

interface DemoMenuSheetProps {
  open: boolean
  /** Напоминание и «засчитать» работают только при активной записи. */
  hasAppointment: boolean
  pending: DemoAction | null
  onClose: () => void
  onAction: (action: DemoAction) => void
}

/** Скрытое демо-меню (5 тапов по аватару) с кнопками /demo/*. */
export const DemoMenuSheet = ({ open, hasAppointment, pending, onClose, onAction }: DemoMenuSheetProps) => (
  <BottomSheet open={open} onClose={onClose} title="Демо-меню" maxHeight={80}>
    <div className={styles['demo-menu-sheet']}>
      <Button size="large" stretched loading={pending === 'reset'} onClick={() => onAction('reset')}>
        Сбросить демо-профиль
      </Button>
      <OutlineButton stretched disabled={!hasAppointment} loading={pending === 'remind'} onClick={() => onAction('remind')}>
        Прислать напоминание сейчас
      </OutlineButton>
      <OutlineButton stretched disabled={!hasAppointment} loading={pending === 'complete'} onClick={() => onAction('complete')}>
        Засчитать донацию
      </OutlineButton>
    </div>
  </BottomSheet>
)
