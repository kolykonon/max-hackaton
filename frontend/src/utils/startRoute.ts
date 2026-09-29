import { getGroupCode, getRestDonationId, getStartParam } from '@/bridge/max'

/** Кнопка бота «Записаться» из пушей про интервал и дефицит. */
const BOOK_PARAM = 'book'

/** Куда вести после входа по параметру запуска: запись, группа, «После донации» или главная. */
export const getStartRoute = (): string => {
  // Как кнопка «Записаться» на главной: льготы → личные данные → вид и регион
  if (getStartParam() === BOOK_PARAM) return '/donation-info'
  const groupCode = getGroupCode()
  if (groupCode) return `/group/${groupCode}`
  const donationId = getRestDonationId()
  if (donationId) return `/after-donation/${donationId}`
  return '/home'
}
