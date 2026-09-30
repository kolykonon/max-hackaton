import { Button, IconButton, Typography } from '@maxhub/max-ui'
import { Copy } from 'lucide-react'

import { BottomSheet } from '@/components/shared/BottomSheet/BottomSheet'

import styles from './BloodCard.module.scss'

interface DonorCodeProps {
  code: string
  onOpen: () => void
  onCopy: () => void
}

/** Длинный код не влезает в строку — показываем начало и конец. */
const shortCode = (code: string) => `${code.slice(0, 4)}…${code.slice(-4)}`
/** 13-значный код показываем как в примере; остальные форматы — группами по 4. */
const groupedCode = (code: string) =>
  code.length === 13
    ? [code.slice(0, 4), code.slice(4, 8), code.slice(8)].join(' ')
    : (code.match(/.{1,4}/g)?.join(' ') ?? code)

export const DonorCode = ({ code, onOpen, onCopy }: DonorCodeProps) => (
  <div className={styles['blood-card__code']}>
    <Typography.Text variant="detail" color="tertiary">
      Код донора
    </Typography.Text>
    <button
      type="button"
      className={styles['blood-card__code-value']}
      aria-label={`Код донора ${code}. Показать целиком`}
      onClick={onOpen}
    >
      {shortCode(code)}
    </button>
    <IconButton size="small" variant="ghost" aria-label="Скопировать код донора" onClick={onCopy}>
      <Copy size={20} className={styles['blood-card__copy']} />
    </IconButton>
  </div>
)

interface DonorCodeSheetProps {
  code: string | null
  open: boolean
  onClose: () => void
  onCopy: () => void
}

export const DonorCodeSheet = ({ code, open, onClose, onCopy }: DonorCodeSheetProps) => (
  <BottomSheet open={open && Boolean(code)} onClose={onClose} title="Ваш код донора" maxHeight={80}>
    <div className={styles['donor-code-sheet']}>
      <span className={styles['donor-code-sheet__value']}>{code && groupedCode(code)}</span>
      <Button size="large" stretched onClick={onCopy}>
        Скопировать
      </Button>
    </div>
  </BottomSheet>
)
