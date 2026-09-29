import { Typography } from '@maxhub/max-ui'
import { CalendarCheck, ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { IconBadge } from '@/components/shared/IconBadge/IconBadge'
import { formatDayMonthYear, parseISODate } from '@/utils/format'

import styles from './RestDayCard.module.scss'

interface RestDayCardProps {
  /** До какой даты можно взять день отдыха. */
  deadline: string
  onOpen: () => void
}

/** «Вам положен день отдыха»: после засчитанной донации, пока день не использован. */
export const RestDayCard = ({ deadline, onOpen }: RestDayCardProps) => (
  <Card padding="m" onClick={onOpen} className={styles['rest-day-card']}>
    <IconBadge icon={CalendarCheck} tone="green" />
    <span className={styles['rest-day-card__text']}>
      <Typography.Text variant="body-strong">Вам положен день отдыха</Typography.Text>
      <Typography.Text variant="detail" color="secondary">
        До {formatDayMonthYear(parseISODate(deadline))} · заявление для работодателя уже готово
      </Typography.Text>
    </span>
    <ChevronRight size={20} className={styles['rest-day-card__chevron']} />
  </Card>
)
