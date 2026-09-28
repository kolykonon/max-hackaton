import { Typography } from '@maxhub/max-ui'
import { HeartHandshake } from 'lucide-react'

import { Card } from '@/components/shared/Card/Card'
import { getHelpedPatients, IMPACT_EXPLANATION, PATIENTS_PER_WHOLE_BLOOD } from '@/content/impact'
import { useCountUp } from '@/hooks/useCountUp'
import { plural } from '@/utils/format'

import styles from './ImpactCard.module.scss'

interface ImpactCardProps {
  whole: number
  plasma: number
}

const PATIENT_FORMS: [string, string, string] = ['пациенту', 'пациентам', 'пациентам']

/** «Ваши донации помогли до N пациентам» — со счётчиком, который плавно набирает число. */
export const ImpactCard = ({ whole, plasma }: ImpactCardProps) => {
  const helped = getHelpedPatients(whole, plasma)
  const shown = useCountUp(helped)
  const hasDonations = helped > 0

  return (
    <Card variant="filled" padding="l" className={styles['impact-card']}>
      <span className={styles['impact-card__icon']} aria-hidden>
        <HeartHandshake size={28} />
      </span>
      <div className={styles['impact-card__text']}>
        {hasDonations ? (
          <>
            <Typography.Text variant="body" color="secondary">
              Ваши донации помогли
            </Typography.Text>
            {/* Для скринридера — сразу итоговое число, без анимации */}
            <span className={styles['impact-card__value']} aria-label={`до ${helped} ${plural(helped, PATIENT_FORMS)}`}>
              до {shown} <span className={styles['impact-card__unit']}>{plural(helped, PATIENT_FORMS)}</span>
            </span>
          </>
        ) : (
          <Typography.Text variant="title">
            Первая донация поможет до {PATIENTS_PER_WHOLE_BLOOD} пациентам
          </Typography.Text>
        )}
        <Typography.Text variant="description" color="tertiary" className={styles['impact-card__hint']}>
          {IMPACT_EXPLANATION}
        </Typography.Text>
      </div>
    </Card>
  )
}
