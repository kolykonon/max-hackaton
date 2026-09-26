import type { StockStatus } from './types'

export const STATUS_LEGEND: Record<StockStatus, string> = {
  urgent: 'Нужна срочно',
  low: 'Мало',
  enough: 'Достаточно',
  none: 'Нет данных',
}

export const STATUS_A11Y: Record<StockStatus, string> = {
  urgent: 'нужна срочно',
  low: 'мало',
  enough: 'достаточно',
  none: 'нет данных',
}

/** Подпись про группу пользователя в карточке центра. */
export const GROUP_STATUS_TEXT: Record<StockStatus, string> = {
  urgent: 'Ваша группа нужна срочно',
  low: 'Вашей группы мало',
  enough: 'Вашей группы достаточно',
  none: 'Нет данных по вашей группе',
}
