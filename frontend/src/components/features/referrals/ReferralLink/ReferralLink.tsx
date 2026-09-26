import { IconButton, Typography } from '@maxhub/max-ui'
import { Copy } from 'lucide-react'

import styles from './ReferralLink.module.scss'

interface ReferralLinkProps {
  link: string
  onCopy: () => void
}

/** Реферальная ссылка с кнопкой копирования. */
export const ReferralLink = ({ link, onCopy }: ReferralLinkProps) => (
  <div className={styles['referral-link']}>
    <div className={styles['referral-link__text']}>
      <Typography.Text variant="description" color="tertiary">
        Ваша ссылка
      </Typography.Text>
      <Typography.Text variant="detail" className={styles['referral-link__url']}>
        {link}
      </Typography.Text>
    </div>
    <IconButton size="medium" variant="ghost" aria-label="Скопировать ссылку" onClick={onCopy}>
      <Copy size={20} className={styles['referral-link__copy']} />
    </IconButton>
  </div>
)
