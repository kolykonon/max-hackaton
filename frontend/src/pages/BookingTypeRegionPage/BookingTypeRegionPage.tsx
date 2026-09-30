import { Typography } from '@maxhub/max-ui'
import { ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useEligibility, useMe } from '@/api/hooks/me'
import { RegionRow } from '@/components/features/account/RegionRow/RegionRow'
import { RegionSheet } from '@/components/features/account/RegionSheet/RegionSheet'
import { useBookingRegion } from '@/components/features/booking-type-region/useBookingRegion'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { Toast } from '@/components/shared/Toast/Toast'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import type { DonationType } from '@/content/types'
import { useToast } from '@/hooks/useToast'
import { bookingSteps, useBookingStore } from '@/store/booking'
import { formatDayMonth, parseISODate } from '@/utils/format'

import styles from './BookingTypeRegionPage.module.scss'

const TYPES: { type: DonationType; caption: string }[] = [
  { type: 'whole_blood', caption: 'Около часа. Приходите в любое время работы центра' },
  { type: 'plasma', caption: 'Около полутора часов. Запись на конкретное время' },
]

/** Шаг 1 — вид донации. Регион берём из профиля, поменять можно прямо здесь. */
export const BookingTypeRegionPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { mode, donationType, regionId, presetCenter, center, setDonationType, setRegion } = useBookingStore()
  const isGroup = mode === 'group'
  const me = useMe()
  const eligibility = useEligibility()
  const region = useBookingRegion(toast.show)
  const profileRegion = me.data?.region ?? null

  // Регион по умолчанию — из профиля (у новых пользователей там Москва)
  useEffect(() => {
    if (regionId === null && profileRegion) setRegion(profileRegion.id)
  }, [regionId, profileRegion, setRegion])

  // Центр выбран на карте — показываем его регион, а не профильный
  const regionName = presetCenter && center ? center.name : profileRegion?.id === regionId ? profileRegion?.name : undefined

  const choose = (type: DonationType) => {
    setDonationType(type)
    navigate('/booking/date')
  }

  const hint = (type: DonationType) =>
    eligibility.data?.interval_active[type]
      ? `Можно с ${formatDayMonth(parseISODate(eligibility.data.next_allowed[type]))}`
      : undefined

  return (
    <Screen
      header={
        <StepHeader
          title="Что будете сдавать"
          step={1}
          total={isGroup ? 3 : bookingSteps(donationType)}
          onBack={() => navigate(isGroup ? '/groups' : '/home')}
        />
      }
    >
      <div className={styles['booking-type-region__types']}>
        {TYPES.map(({ type, caption }) => (
          <Card
            key={type}
            padding="l"
            variant={regionId !== null && donationType === type ? 'selected' : 'outlined'}
            onClick={regionId === null ? undefined : () => choose(type)}
            className={styles['booking-type-region__type']}
          >
            <DonationIcon kind={type} size={24} framed />
            <span className={styles['booking-type-region__type-text']}>
              <Typography.Text variant="title">{DONATION_TYPE_LABEL[type]}</Typography.Text>
              <Typography.Text variant="detail" color="secondary">
                {caption}
              </Typography.Text>
              {hint(type) && (
                <Typography.Text variant="detail" color="tertiary">
                  {hint(type)}
                </Typography.Text>
              )}
            </span>
            <ChevronRight size={20} className={styles['booking-type-region__chevron']} />
          </Card>
        ))}
      </div>
      {me.isPending ? (
        <Skeleton height={72} />
      ) : (
        <RegionRow
          label={presetCenter && center ? 'Центр с карты' : 'Регион'}
          regionName={regionName}
          actionText="Изменить"
          onOpen={region.openSheet}
        />
      )}
      <RegionSheet
        open={region.open}
        selectedId={regionId}
        onSelect={region.select}
        onClose={region.closeSheet}
        requireCenters
      />
      <Toast message={toast.message} />
    </Screen>
  )
}
