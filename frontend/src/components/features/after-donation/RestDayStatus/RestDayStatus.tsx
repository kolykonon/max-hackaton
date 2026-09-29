import { Typography } from '@maxhub/max-ui'

import type { AfterDonation } from '@/api/types'
import { Card } from '@/components/shared/Card/Card'
import { formatDayMonth, formatDayMonthYear, parseISODate, plural } from '@/utils/format'

import styles from './RestDayStatus.module.scss'

interface RestDayStatusProps {
  restDay: AfterDonation['rest_day']
}

const DAY_FORMS: [string, string, string] = ['день', 'дня', 'дней']

const deadlineText = ({ deadline, days_left: daysLeft, used, used_at: usedAt }: RestDayStatusProps['restDay']) => {
  if (used) {
    return usedAt ? `Вы отметили, что взяли его ${formatDayMonth(new Date(usedAt))}` : 'Вы отметили, что уже взяли его'
  }
  if (daysLeft < 0) return `Срок прошёл ${formatDayMonthYear(parseISODate(deadline))}`
  return `Взять можно до ${formatDayMonthYear(parseISODate(deadline))} — осталось ${daysLeft} ${plural(daysLeft, DAY_FORMS)}`
}

/** Дополнительный день отдыха по ст. 186 ТК РФ: до какого числа и использован ли. */
export const RestDayStatus = ({ restDay }: RestDayStatusProps) => (
  <Card variant="filled" padding="l" className={styles['rest-day-status']}>
    <Typography.Text variant="subheader">Дополнительный день отдыха</Typography.Text>
    <Typography.Text variant="body" color="secondary">
      По статье 186 Трудового кодекса за донацию положены два оплачиваемых дня: сам день донации и ещё
      один на выбор. Его можно взять в течение года или присоединить к отпуску.
    </Typography.Text>
    <Typography.Text variant="body-strong" className={styles['rest-day-status__deadline']}>
      {deadlineText(restDay)}
    </Typography.Text>
  </Card>
)
