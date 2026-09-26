import { CalendarDays, MapPin } from 'lucide-react'

import { useRegions } from '@/api/hooks/regions'
import { DONATION_TYPE_LABEL } from '@/content/donationTypes'
import { useBookingStore } from '@/store/booking'
import { formatDayMonth, parseISODate } from '@/utils/format'

import { DonationIcon } from '../DonationIcon/DonationIcon'
import { SelectionSummary } from '../SelectionSummary/SelectionSummary'
import { SelectionSummaryItem } from '../SelectionSummary/SelectionSummaryItem'

interface BookingSummaryProps {
  withDate?: boolean
}

/** «Цельная кровь · Москва · 14 октября» из текущего выбора мастера записи. */
export const BookingSummary = ({ withDate }: BookingSummaryProps) => {
  const { donationType, regionId, date } = useBookingStore()
  const regions = useRegions()
  const regionName = regions.data?.find((region) => region.id === regionId)?.name

  return (
    <SelectionSummary>
      <SelectionSummaryItem icon={<DonationIcon kind={donationType} size={18} />}>
        {DONATION_TYPE_LABEL[donationType]}
      </SelectionSummaryItem>
      {regionName && <SelectionSummaryItem icon={<MapPin size={18} />}>{regionName}</SelectionSummaryItem>}
      {withDate && date && (
        <SelectionSummaryItem icon={<CalendarDays size={18} />}>{formatDayMonth(parseISODate(date))}</SelectionSummaryItem>
      )}
    </SelectionSummary>
  )
}
