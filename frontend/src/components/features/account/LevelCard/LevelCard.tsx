import { Typography } from '@maxhub/max-ui'
import { ChevronRight } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { PATIENTS_PER_WHOLE_BLOOD } from '@/content/impact'
import { DONOR_LEVELS, getLevelIndex } from '@/content/levels'
import { useCountUp } from '@/hooks/useCountUp'
import { formatDonations, plural } from '@/utils/format'

import { LevelBadge } from '../LevelBadge/LevelBadge'
import styles from './LevelCard.module.scss'

interface LevelCardProps {
  total: number
  /** Сколько пациентов могли получить помощь — см. getHelpedPatients */
  helped: number
  onOpen: () => void
}

const PEOPLE_FORMS: [string, string, string] = ['человеку', 'людям', 'людям']

const getCaption = (total: number): string => {
  const index = getLevelIndex(total)
  const next = DONOR_LEVELS[index + 1]
  if (total === 0) return 'Сдайте кровь первый раз — и получите уровень «Новичок»'
  if (!next) return `${formatDonations(total)} · максимальный уровень`
  const left = next.threshold - total
  return `${plural(left, ['осталась', 'осталось', 'осталось'])} ${formatDonations(left)} до уровня «${next.name}»`
}

/** Блок «Уровень донора» + сколько людям помогли. Нажимается целиком — открывает шторку уровней. */
export const LevelCard = ({ total, helped, onOpen }: LevelCardProps) => {
  const shown = useCountUp(helped)
  const levelIndex = getLevelIndex(total)

  return (
    <Card onClick={onOpen} className={styles['level-card']}>
      <div className={styles['level-card__head']}>
        <LevelBadge index={levelIndex > 0 ? levelIndex - 1 : undefined} size="medium" />
        <Typography.Text variant="title" className={styles['level-card__title']}>
          Вы: {DONOR_LEVELS[levelIndex].name}
        </Typography.Text>
        <ChevronRight size={22} className={styles['level-card__chevron']} />
      </div>
      <Typography.Text variant="description" color="secondary" className={styles['level-card__caption']}>
        {getCaption(total)}
      </Typography.Text>
      <Typography.Text variant="body" className={styles['level-card__impact']}>
        {helped > 0 ? (
          // Для скринридера — сразу итоговое число, без анимации
          <span aria-label={`Вы помогли до ${helped} ${plural(helped, PEOPLE_FORMS)} своей кровью`}>
            Вы помогли до <b className={styles['level-card__impact-value']}>{shown}</b> {plural(helped, PEOPLE_FORMS)} своей кровью
          </span>
        ) : (
          <>
            Первая донация поможет до{' '}
            <b className={styles['level-card__impact-value']}>{PATIENTS_PER_WHOLE_BLOOD}</b> людям
          </>
        )}
      </Typography.Text>
    </Card>
  )
}
