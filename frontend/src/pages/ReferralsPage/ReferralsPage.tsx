import { Button, Typography } from '@maxhub/max-ui'
import { Share2 } from 'lucide-react'

import { ReferralCounter } from '@/components/features/referrals/ReferralCounter/ReferralCounter'
import { ReferralLink } from '@/components/features/referrals/ReferralLink/ReferralLink'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { Toast } from '@/components/shared/Toast/Toast'
import { DEMO_USER } from '@/content/demo'
import { useToast } from '@/hooks/useToast'

import styles from './ReferralsPage.module.scss'

// TODO: тексты экрана — до 4-го дня (ТЗ §13); «Поделиться» — через shareMaxContent из MAX Bridge
export const ReferralsPage = () => {
  const toast = useToast()
  const link = DEMO_USER.referralLink

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } finally {
      toast.show('Ссылка скопирована')
    }
  }

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Капля', text: 'Стань донором крови вместе со мной', url: link }).catch(() => undefined)
    } else {
      await copy()
    }
  }

  return (
    <Screen
      header={<PageHeader title="Рефералы" align="center" />}
      footer={
        <StickyFooter>
          <Button size="large" stretched iconBefore={<Share2 size={20} />} onClick={share}>
            Поделиться
          </Button>
        </StickyFooter>
      }
    >
      <ReferralCounter count={DEMO_USER.referralsCount} />
      <div className={styles['referrals-page__text']}>
        <Typography.Text variant="subheader">Пригласите друзей стать донорами</Typography.Text>
        <Typography.Text variant="body" color="secondary">
          Отправьте ссылку другу. Когда он откроет приложение по ней, мы посчитаем приглашение.
        </Typography.Text>
      </div>
      <ReferralLink link={link} onCopy={copy} />
      <Toast message={toast.message} />
    </Screen>
  )
}
