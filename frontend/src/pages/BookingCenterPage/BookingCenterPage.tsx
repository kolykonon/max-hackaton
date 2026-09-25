import { Button } from '@maxhub/max-ui'
import { CalendarDays, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CenterCard } from '@/components/features/booking-center/CenterCard/CenterCard'
import { CenterList } from '@/components/features/booking-center/CenterList/CenterList'
import { CenterMap } from '@/components/features/booking-center/CenterMap/CenterMap'
import { Screen } from '@/components/layout/Screen/Screen'
import { StepHeader } from '@/components/layout/StepHeader/StepHeader'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { SegmentedControl } from '@/components/shared/SegmentedControl/SegmentedControl'
import { SegmentedControlItem } from '@/components/shared/SegmentedControl/SegmentedControlItem'
import { SelectionSummary } from '@/components/shared/SelectionSummary/SelectionSummary'
import { SelectionSummaryItem } from '@/components/shared/SelectionSummary/SelectionSummaryItem'
import { Toast } from '@/components/shared/Toast/Toast'
import { CENTERS, DEMO_APPOINTMENT, DEMO_REGION } from '@/content/demo'
import { useBookingMode } from '@/hooks/useBookingMode'
import { useToast } from '@/hooks/useToast'
import { formatDayMonth } from '@/utils/format'

import styles from './BookingCenterPage.module.scss'

type View = 'list' | 'map'

/** Шаг 3 — центр крови. */
export const BookingCenterPage = () => {
  const navigate = useNavigate()
  const { isReschedule, withMode } = useBookingMode()
  const toast = useToast()
  const [view, setView] = useState<View>('list')
  // При переносе текущий центр стоит первым и уже выбран
  const [selectedId, setSelectedId] = useState<number | null>(isReschedule ? DEMO_APPOINTMENT.center.id : null)
  const selectedCenter = CENTERS.find((center) => center.id === selectedId)

  return (
    <Screen
      header={<StepHeader title="Выберите центр" step={3} onBack={() => navigate(withMode('/booking/date'))} />}
      footer={
        <StickyFooter>
          <Button size="large" stretched disabled={!selectedId} onClick={() => navigate(withMode('/booking/time'))}>
            Далее
          </Button>
        </StickyFooter>
      }
    >
      <SelectionSummary>
        <SelectionSummaryItem icon={<DonationIcon kind="whole_blood" size={18} />}>Цельная кровь</SelectionSummaryItem>
        <SelectionSummaryItem icon={<MapPin size={18} />}>{DEMO_REGION.name}</SelectionSummaryItem>
        <SelectionSummaryItem icon={<CalendarDays size={18} />}>{formatDayMonth(DEMO_APPOINTMENT.date)}</SelectionSummaryItem>
      </SelectionSummary>
      <SegmentedControl label="Вид списка центров">
        <SegmentedControlItem selected={view === 'list'} onSelect={() => setView('list')}>
          Список
        </SegmentedControlItem>
        <SegmentedControlItem selected={view === 'map'} onSelect={() => setView('map')}>
          Карта
        </SegmentedControlItem>
      </SegmentedControl>
      {view === 'list' ? (
        <CenterList centers={CENTERS} selectedId={selectedId} onSelect={setSelectedId} />
      ) : (
        <div className={styles['booking-center__map']}>
          <CenterMap
            regionName={DEMO_REGION.name}
            centers={CENTERS}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onLocate={() => toast.show('Не удалось определить местоположение')}
          />
          {selectedCenter && (
            <div className={styles['booking-center__map-card']}>
              <CenterCard center={selectedCenter} selected onSelect={() => undefined} />
            </div>
          )}
        </div>
      )}
      <Toast message={toast.message} />
    </Screen>
  )
}
