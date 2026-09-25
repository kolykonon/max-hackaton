import { Button, Typography } from '@maxhub/max-ui'
import { Share2 } from 'lucide-react'

import { useReferrals } from '@/api/hooks/me'
import { shareContent } from '@/bridge/max'
import { ReferralCounter } from '@/components/features/referrals/ReferralCounter/ReferralCounter'
import { ReferralLink } from '@/components/features/referrals/ReferralLink/ReferralLink'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { useToast } from '@/hooks/useToast'

import styles from './ReferralsPage.module.scss'

const SHARE_TEXT = 'Стань донором крови вместе со мной — запишись в «Капле» в MAX'

// TODO: тексты экрана — до 4-го дня (ТЗ §13)
export const ReferralsPage = () => {
  const toast = useToast()
  const referrals = useReferrals()

  const copy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
    } finally {
      toast.show('Ссылка скопирована')
    }
  }

  const share = async (link: string) => {
    try {
      const result = await shareContent({ text: SHARE_TEXT, link })
      if (result === 'copied') toast.show('Ссылка скопирована')
    } catch {
      // пользователь закрыл меню «Поделиться»
    }
  }

  const renderContent = () => {
    if (referrals.isPending) return [200, 80, 64].map((height) => <Skeleton key={height} height={height} />)
    if (referrals.isError) {
      return <ErrorState text="Не удалось загрузить данные" retrying={referrals.isFetching} onRetry={() => referrals.refetch()} />
    }
    return (
      <>
        <ReferralCounter count={referrals.data.count} />
        <div className={styles['referrals-page__text']}>
          <Typography.Text variant="subheader">Пригласите друзей стать донорами</Typography.Text>
          <Typography.Text variant="body" color="secondary">
            Отправьте ссылку другу. Когда он откроет приложение по ней, мы посчитаем приглашение.
          </Typography.Text>
        </div>
        <ReferralLink link={referrals.data.link} onCopy={() => copy(referrals.data.link)} />
      </>
    )
  }

  return (
    <Screen
      header={<PageHeader title="Рефералы" align="center" />}
      footer={
        <StickyFooter>
          <Button
            size="large"
            stretched
            disabled={!referrals.data}
            iconBefore={<Share2 size={20} />}
            onClick={() => referrals.data && share(referrals.data.link)}
          >
            Поделиться
          </Button>
        </StickyFooter>
      }
    >
      {renderContent()}
      <Toast message={toast.message} />
    </Screen>
  )
}
