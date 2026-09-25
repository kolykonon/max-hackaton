import { Typography } from '@maxhub/max-ui'

import styles from './Toast.module.scss'

interface ToastProps {
  message: string | null
}

/** Уведомление внизу экрана. Время показа управляется хуком useToast. */
export const Toast = ({ message }: ToastProps) => {
  if (!message) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <Typography.Text variant="detail" color="inherit">
        {message}
      </Typography.Text>
    </div>
  )
}
