import { Typography } from '@maxhub/max-ui'

import type { Group } from '@/api/types'
import { Card } from '@/components/shared/Card/Card'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { getHelpedPatients } from '@/content/impact'
import { formatDayMonth, parseISODate, plural } from '@/utils/format'

import styles from './PastGroupCard.module.scss'

interface PastGroupCardProps {
  group: Group
  onOpen: () => void
  onAgain: () => void
}

const PATIENT_FORMS: [string, string, string] = ['пациенту', 'пациентам', 'пациентам']

const resultText = (group: Group) => {
  if (group.donated_count === 0) return 'Донации ещё не засчитаны'
  const helped =
    group.donation_type === 'plasma'
      ? getHelpedPatients(0, group.donated_count)
      : getHelpedPatients(group.donated_count, 0)
  return `Сдали ${group.donated_count} из ${group.members_count} · помогли до ${helped} ${plural(helped, PATIENT_FORMS)}`
}

/** Прошедшая группа: итог и «Собрать снова» в тот же центр. */
export const PastGroupCard = ({ group, onOpen, onAgain }: PastGroupCardProps) => (
  <li>
    <Card padding="m" className={styles['past-group-card']}>
      <Typography.Text variant="body-strong">
        {formatDayMonth(parseISODate(group.date))} · {group.center.name}
      </Typography.Text>
      <Typography.Text variant="detail" color="secondary">
        {resultText(group)}
      </Typography.Text>
      <div className={styles['past-group-card__actions']}>
        <OutlineButton size="small" stretched onClick={onOpen}>
          Участники
        </OutlineButton>
        <OutlineButton size="small" stretched onClick={onAgain}>
          Собрать снова
        </OutlineButton>
      </div>
    </Card>
  </li>
)
