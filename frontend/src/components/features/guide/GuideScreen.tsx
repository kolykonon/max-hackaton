import { Typography } from '@maxhub/max-ui'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCompleteOnboarding } from '@/api/hooks/me'
import { OnboardingEligibility } from '@/components/features/onboarding/OnboardingEligibility/OnboardingEligibility'
import { OnboardingNav } from '@/components/features/onboarding/OnboardingNav/OnboardingNav'
import { Screen } from '@/components/layout/Screen/Screen'
import { ProgressSegments } from '@/components/shared/ProgressSegments/ProgressSegments'
import { TextLink } from '@/components/shared/TextLink/TextLink'
import { GUIDE_SECTIONS, type GuideSectionId } from '@/content/guide'
import { useBackButton } from '@/hooks/useBackButton'

import { GuideBenefit } from './GuideBenefit'
import { GuideCover } from './GuideCover'
import { GuideDonation } from './GuideDonation'
import { GuidePrep } from './GuidePrep'
import { GuideSheets, type GuideSheet } from './GuideSheets'
import { GuideTest } from './GuideTest'
import styles from './Guide.module.scss'

interface GuideScreenProps {
  /** Онбординг: в конце экран «Кто может сдать кровь» с согласием, «Пропустить» ведёт к нему. Без флага — гид на /guide. */
  onboarding?: boolean
}

/** Гид «Быть донором»: одна лента разделов, шапка с прогрессом, шторки-подсказки. */
export const GuideScreen = ({ onboarding }: GuideScreenProps) => {
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState<GuideSectionId>('cover')
  const [sheet, setSheet] = useState<GuideSheet | null>(null)
  const [consent, setConsent] = useState(false)
  const [showConsentHint, setShowConsentHint] = useState(false)
  const completeOnboarding = useCompleteOnboarding()

  // Раздел, который пересекает полосу в верхней трети экрана, попадает в шапку
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length) setCurrent((visible[visible.length - 1].target as HTMLElement).dataset.guideSection as GuideSectionId)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    root.current!.querySelectorAll('[data-guide-section]').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  // Обложка должна ровно занимать видимую область main: считаем её и на повороте/смене панелей MAX
  useEffect(() => {
    const scroller = root.current!.parentElement!
    const measure = () => {
      const style = getComputedStyle(scroller)
      const height = scroller.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      root.current!.style.setProperty('--guide-view', `${height}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [])

  const closeSheet = () => setSheet(null)
  // history.state.idx ставит react-router: 0 — гид открыт первым экраном, назад некуда
  const leave = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/home', { replace: true }))
  useBackButton(sheet ? closeSheet : onboarding ? null : leave)

  const scrollTo = (id: GuideSectionId) =>
    root.current!.querySelector(`[data-guide-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const onConsentChange = (value: boolean) => {
    setConsent(value)
    if (value) setShowConsentHint(false)
  }

  const start = () => {
    if (!consent) {
      setShowConsentHint(true)
      return
    }
    completeOnboarding.mutate(undefined, { onSuccess: () => navigate('/home', { replace: true }) })
  }

  const title = GUIDE_SECTIONS.find((section) => section.id === current)!.title
  const step = GUIDE_SECTIONS.findIndex((section) => section.id === current)

  return (
    <Screen
      header={
        <div className={styles.header}>
          <div className={styles.header__row}>
            <Typography.Text variant="header" className={styles.header__title}>
              {title}
            </Typography.Text>
            <TextLink withChevron={false} onClick={onboarding ? () => scrollTo('final') : leave}>
              {onboarding ? 'Пропустить' : 'Закрыть'}
            </TextLink>
          </div>
          <ProgressSegments total={onboarding ? 5 : 4} current={step} />
        </div>
      }
      footer={
        onboarding &&
        current === 'final' && (
          <>
            {completeOnboarding.isError && (
              <Typography.Text variant="description" className={styles.error} role="alert">
                Не удалось сохранить. Проверьте интернет и попробуйте ещё раз
              </Typography.Text>
            )}
            <OnboardingNav onStart={start} startDisabled={!consent} starting={completeOnboarding.isPending} />
          </>
        )
      }
    >
      <div ref={root} className={styles.guide}>
        <GuideCover onNext={() => scrollTo('prep')} />
        <GuidePrep onOpen={setSheet} />
        <GuideDonation onOpen={setSheet} />
        <GuideTest onOpen={setSheet} />
        <GuideBenefit />
        {onboarding && (
          <section className={styles.final} data-guide-section="final">
            <OnboardingEligibility
              consent={consent}
              onConsentChange={onConsentChange}
              showConsentHint={showConsentHint}
              onOpenContraindications={() => setSheet('contraindications')}
              onOpenConsent={() => setSheet('consent')}
            />
          </section>
        )}
      </div>
      <GuideSheets sheet={sheet} onOpen={setSheet} onClose={closeSheet} />
    </Screen>
  )
}
