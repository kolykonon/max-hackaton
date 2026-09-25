import { Typography } from '@maxhub/max-ui'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BloodCard } from '@/components/features/account/BloodCard/BloodCard'
import { BloodStat } from '@/components/features/account/BloodCard/BloodStat'
import { DonorCode } from '@/components/features/account/BloodCard/DonorCode'
import { DemoMenuSheet } from '@/components/features/account/DemoMenuSheet/DemoMenuSheet'
import { DonationHistorySheet } from '@/components/features/account/DonationHistorySheet/DonationHistorySheet'
import { DonationTypeSheet } from '@/components/features/account/DonationTypeSheet/DonationTypeSheet'
import { DonorLevelsSheet } from '@/components/features/account/DonorLevelsSheet/DonorLevelsSheet'
import { GoalCard } from '@/components/features/account/GoalCard/GoalCard'
import { HistoryButton } from '@/components/features/account/HistoryButton/HistoryButton'
import { HonoraryAchievedCard } from '@/components/features/account/HonoraryAchievedCard/HonoraryAchievedCard'
import { HonoraryEta } from '@/components/features/account/HonoraryEta/HonoraryEta'
import { LevelCard } from '@/components/features/account/LevelCard/LevelCard'
import { ProfileHeader } from '@/components/features/account/ProfileHeader/ProfileHeader'
import { ReferralBanner } from '@/components/features/account/ReferralBanner/ReferralBanner'
import { Screen } from '@/components/layout/Screen/Screen'
import { Toast } from '@/components/shared/Toast/Toast'
import { DEMO_PROGRESS, DEMO_USER, DONATIONS } from '@/content/demo'
import type { DonationKind } from '@/content/types'
import { useToast } from '@/hooks/useToast'

import styles from './AccountPage.module.scss'

type Sheet = 'levels' | 'history' | 'demo' | null

const DEMO_MENU_TAPS = 5

/** Экран «Личный кабинет». */
export const AccountPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [typeSheet, setTypeSheet] = useState<DonationKind | null>(null)
  const avatarTaps = useRef(0)

  const user = DEMO_USER
  const { whole, plasma, etaText } = DEMO_PROGRESS
  const total = whole + plasma
  const mixedGoal = whole >= 25 ? 40 : 60
  const achieved = whole >= 40 || plasma >= 60 || (whole >= 25 && total >= 40) || total >= 60

  const goals: Record<DonationKind, { count: number; goal: number }> = {
    whole_blood: { count: whole, goal: 40 },
    plasma: { count: plasma, goal: 60 },
    mixed: { count: total, goal: mixedGoal },
  }

  const onAvatarClick = () => {
    avatarTaps.current += 1
    if (avatarTaps.current >= DEMO_MENU_TAPS) {
      avatarTaps.current = 0
      setSheet('demo')
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.donorCode)
    } finally {
      toast.show('Код донора скопирован')
    }
  }

  const closeSheet = () => setSheet(null)

  return (
    <Screen withTabBar>
      <ProfileHeader firstName={user.firstName} lastName={user.lastName} photoUrl={user.photoUrl} onAvatarClick={onAvatarClick} />
      <LevelCard total={total} onOpen={() => setSheet('levels')} />
      <ReferralBanner count={user.referralsCount} onOpen={() => navigate('/referrals')} />
      <BloodCard footer={<DonorCode code={user.donorCode} onCopy={copyCode} />}>
        <BloodStat label="Группа крови" value={user.bloodGroupLabel} />
        <BloodStat label="Резус-фактор" value={user.rhesus} />
        <BloodStat label="Kell" value={user.kell} />
        <BloodStat label="Фенотип" value={user.phenotype} />
      </BloodCard>

      <section className={styles['account-page__honorary']}>
        <Typography.Text variant="subheader">Путь к званию «Почётный донор России»</Typography.Text>
        {achieved ? (
          <HonoraryAchievedCard onMore={() => navigate('/honorary')} />
        ) : (
          <>
            <div className={styles['account-page__goals']}>
              <GoalCard kind="whole_blood" {...goals.whole_blood} onOpen={() => setTypeSheet('whole_blood')} />
              <GoalCard kind="plasma" {...goals.plasma} onOpen={() => setTypeSheet('plasma')} />
            </div>
            <GoalCard
              kind="mixed"
              {...goals.mixed}
              hint={mixedGoal === 60 ? `Ещё ${25 - whole} сдач цельной крови — и цель сократится до 40` : undefined}
              onOpen={() => setTypeSheet('mixed')}
            />
            <HonoraryEta eta={etaText} onMore={() => navigate('/honorary')} />
          </>
        )}
      </section>

      <HistoryButton onOpen={() => setSheet('history')} />

      <DonorLevelsSheet open={sheet === 'levels'} total={total} onClose={closeSheet} />
      <DonationHistorySheet open={sheet === 'history'} donations={DONATIONS} onClose={closeSheet} />
      <DemoMenuSheet
        open={sheet === 'demo'}
        onClose={closeSheet}
        onAction={(message) => {
          closeSheet()
          toast.show(message)
        }}
      />
      <DonationTypeSheet
        kind={typeSheet}
        count={typeSheet ? goals[typeSheet].count : 0}
        goal={typeSheet ? goals[typeSheet].goal : 0}
        whole={whole}
        plasma={plasma}
        onClose={() => setTypeSheet(null)}
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
