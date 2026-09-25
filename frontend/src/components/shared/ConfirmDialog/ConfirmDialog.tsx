import { Button, Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { OutlineButton } from '../OutlineButton/OutlineButton'
import styles from './ConfirmDialog.module.scss'

interface ConfirmDialogProps {
  open: boolean
  title: string
  text?: ReactNode
  confirmText: string
  cancelText: string
  /** Красная кнопка подтверждения — для отмены записи и выхода без сохранения. */
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Диалог по центру экрана с затемнением. */
export const ConfirmDialog = ({
  open,
  title,
  text,
  confirmText,
  cancelText,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null

  return (
    <div className={styles['confirm-dialog']}>
      <div className={styles['confirm-dialog__overlay']} onClick={onCancel} aria-hidden />
      <div className={styles['confirm-dialog__window']} role="alertdialog" aria-modal aria-labelledby="confirm-dialog-title">
        <Typography.Text id="confirm-dialog-title" variant="subheader" className={styles['confirm-dialog__title']}>
          {title}
        </Typography.Text>
        {text && (
          <Typography.Text variant="body" color="secondary" className={styles['confirm-dialog__text']}>
            {text}
          </Typography.Text>
        )}
        <div className={styles['confirm-dialog__actions']}>
          <Button
            size="large"
            stretched
            variant={destructive ? 'destructive' : 'primary'}
            loading={loading}
            disabled={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          <OutlineButton stretched onClick={onCancel}>
            {cancelText}
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}
