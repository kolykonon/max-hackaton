import { Button, Typography } from '@maxhub/max-ui'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'

import styles from './DemoMenuSheet.module.scss'

/** Действия с активной записью: без неё кнопки неактивны. */
export type DemoAppointmentAction = 'remind' | 'ask-donated' | 'complete'
/** Пуши бота, которые в жизни приходят по расписанию. */
export type DemoPushAction = 'interval_open' | 'deficit' | 'rest_day'
export type DemoAction = 'reset' | DemoAppointmentAction | DemoPushAction

interface DemoMenuSheetProps {
  open: boolean
  hasAppointment: boolean
  pending: DemoAction | null
  onClose: () => void
  onAction: (action: DemoAction) => void
}

const APPOINTMENT_ACTIONS: { action: DemoAppointmentAction; label: string }[] = [
  { action: 'remind', label: 'Прислать напоминание сейчас' },
  { action: 'ask-donated', label: 'Спросить «Сдали кровь?»' },
  { action: 'complete', label: 'Засчитать донацию' },
]

const PUSH_ACTIONS: { action: DemoPushAction; label: string }[] = [
  { action: 'interval_open', label: 'Интервал прошёл' },
  { action: 'deficit', label: 'Не хватает вашей группы' },
  { action: 'rest_day', label: 'Напомнить про день отдыха' },
]

/** Скрытое демо-меню (5 тапов по аватару) с кнопками /demo/*: сообщения бота сразу, без ожидания. */
export const DemoMenuSheet = ({ open, hasAppointment, pending, onClose, onAction }: DemoMenuSheetProps) => (
  <BottomSheet open={open} onClose={onClose} title="Демо-меню" maxHeight={90}>
    <div className={styles['demo-menu-sheet']}>
      <Button size="large" stretched loading={pending === 'reset'} onClick={() => onAction('reset')}>
        Сбросить демо-профиль
      </Button>

      <section className={styles['demo-menu-sheet__group']}>
        <Typography.Text variant="subheader">Запись</Typography.Text>
        {!hasAppointment && (
          <Typography.Text variant="detail" color="tertiary">
            Сначала запишитесь на донацию
          </Typography.Text>
        )}
        {APPOINTMENT_ACTIONS.map(({ action, label }) => (
          <OutlineButton
            key={action}
            stretched
            disabled={!hasAppointment}
            loading={pending === action}
            onClick={() => onAction(action)}
          >
            {label}
          </OutlineButton>
        ))}
      </section>

      <section className={styles['demo-menu-sheet__group']}>
        <Typography.Text variant="subheader">Пуши бота</Typography.Text>
        {PUSH_ACTIONS.map(({ action, label }) => (
          <OutlineButton key={action} stretched loading={pending === action} onClick={() => onAction(action)}>
            {label}
          </OutlineButton>
        ))}
      </section>
    </div>
  </BottomSheet>
)
