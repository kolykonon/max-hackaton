import { Button } from '@maxhub/max-ui'
import { Gift, ShieldPlus, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BenefitsSheet } from '@/components/features/donation-info/BenefitsSheet/BenefitsSheet'
import { InfoZoneCard } from '@/components/features/donation-info/InfoZoneCard/InfoZoneCard'
import { RestrictionsSheet } from '@/components/features/donation-info/RestrictionsSheet/RestrictionsSheet'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { ContraindicationsSheet } from '@/components/shared/ContraindicationsSheet/ContraindicationsSheet'
import { INTRO_BENEFITS, INTRO_CONTRAINDICATIONS, INTRO_ELIGIBILITY } from '@/content/eligibility'
import { useBookingStore } from '@/store/booking'

type Sheet = 'benefits' | 'restrictions' | 'contraindications' | null

/** Справка «Запись на донорство»: льготы, ограничения и противопоказания. В маршрут записи не входит — открывается с главной. */
export const DonationInfoPage = () => {
  const navigate = useNavigate()
  const startNew = useBookingStore((state) => state.startNew)
  const [sheet, setSheet] = useState<Sheet>(null)
  const closeSheet = () => setSheet(null)

  return (
    <Screen
      header={<PageHeader title="Запись на донорство" align="center" onBack={() => navigate('/home')} />}
      footer={
        <StickyFooter>
          <Button
            size="large"
            stretched
            onClick={() => {
              startNew()
              navigate('/booking/type')
            }}
          >
            Записаться
          </Button>
        </StickyFooter>
      }
    >
      <InfoZoneCard
        icon={Gift}
        tone="red"
        title="Воспользуйтесь льготами донора"
        linkText="Все льготы и привилегии"
        onLinkClick={() => setSheet('benefits')}
      >
        <BulletList>
          {INTRO_BENEFITS.map((item) => (
            <BulletListItem key={item}>{item}</BulletListItem>
          ))}
        </BulletList>
      </InfoZoneCard>
      <InfoZoneCard
        icon={UserCheck}
        tone="blue"
        title="Кто может сдавать кровь"
        linkText="Почему такие ограничения?"
        onLinkClick={() => setSheet('restrictions')}
      >
        <BulletList>
          {INTRO_ELIGIBILITY.map((item) => (
            <BulletListItem key={item} marker="check">
              {item}
            </BulletListItem>
          ))}
        </BulletList>
      </InfoZoneCard>
      <InfoZoneCard
        icon={ShieldPlus}
        tone="red"
        title="Противопоказания"
        linkText="Полный список противопоказаний"
        onLinkClick={() => setSheet('contraindications')}
      >
        <BulletList>
          {INTRO_CONTRAINDICATIONS.map((item) => (
            <BulletListItem key={item} marker="dot-red">
              {item}
            </BulletListItem>
          ))}
        </BulletList>
      </InfoZoneCard>

      <BenefitsSheet open={sheet === 'benefits'} onClose={closeSheet} />
      <RestrictionsSheet open={sheet === 'restrictions'} onClose={closeSheet} />
      <ContraindicationsSheet open={sheet === 'contraindications'} onClose={closeSheet} />
    </Screen>
  )
}
