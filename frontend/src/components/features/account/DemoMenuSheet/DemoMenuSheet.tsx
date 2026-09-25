import { Button } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'

import styles from './DemoMenuSheet.module.scss'

interface DemoMenuSheetProps {
  open: boolean
  onClose: () => void
  onAction: (message: string) => void
}

/** Скрытое демо-меню (5 тапов по аватару). TODO: POST /demo/*. */
export const DemoMenuSheet = ({ open, onClose, onAction }: DemoMenuSheetProps) => (
  <BottomSheet open={open} onClose={onClose} title="Демо-меню" maxHeight={80}>
    <div className={styles['demo-menu-sheet']}>
      <Button size="large" stretched onClick={() => onAction('Профиль сброшен к демо-состоянию')}>
        Сбросить демо-профиль
      </Button>
      <OutlineButton stretched onClick={() => onAction('Напоминание отправлено в чат')}>
        Прислать напоминание сейчас
      </OutlineButton>
      <OutlineButton stretched onClick={() => onAction('Донация засчитана')}>
        Засчитать донацию
      </OutlineButton>
    </div>
  </BottomSheet>
)
