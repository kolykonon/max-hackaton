import { getGroupCode, getRestDonationId } from '@/bridge/max'

/** Куда вести после входа по параметру запуска: группа, «После донации» или главная. */
export const getStartRoute = (): string => {
  const groupCode = getGroupCode()
  if (groupCode) return `/group/${groupCode}`
  const donationId = getRestDonationId()
  if (donationId) return `/after-donation/${donationId}`
  return '/home'
}
