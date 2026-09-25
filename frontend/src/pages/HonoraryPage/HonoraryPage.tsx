import { Typography } from '@maxhub/max-ui'

import { HonoraryConditionCard } from '@/components/features/honorary/HonoraryConditionCard/HonoraryConditionCard'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { ProgressBar } from '@/components/shared/ProgressBar/ProgressBar'
import { BENEFITS_FOOTNOTE, HONORARY_BENEFITS } from '@/content/benefits'
import { DEMO_PROGRESS } from '@/content/demo'

import styles from './HonoraryPage.module.scss'

// TODO: тексты экрана — до 4-го дня (ТЗ §13)
const HOW_TO_APPLY = [
  'Возьмите в центре крови справку о количестве донаций',
  'Подайте заявление через Госуслуги или в соцзащите по месту жительства',
  'Удостоверение и нагрудный знак выдадут после проверки',
]

/** Экран «Звание почётного донора»: условия, прогресс и льготы. */
export const HonoraryPage = () => {
  const { whole, plasma, etaText } = DEMO_PROGRESS
  const total = whole + plasma
  const goal = whole >= 25 ? 40 : 60

  return (
    <Screen header={<PageHeader title="Почётный донор России" align="center" />}>
      <section className={styles['honorary-page__section']}>
        <Typography.Text variant="subheader">Ваш прогресс</Typography.Text>
        <Typography.Text variant="body">
          {total} из {goal} донаций · до звания примерно <b>{etaText}</b>
        </Typography.Text>
        <ProgressBar value={total} max={goal} />
      </section>

      <section className={styles['honorary-page__section']}>
        <Typography.Text variant="subheader">Условия звания</Typography.Text>
        <HonoraryConditionCard kind="whole_blood" title="40 донаций крови" description="Только цельная кровь" />
        <HonoraryConditionCard kind="plasma" title="60 донаций плазмы" description="Только плазма" />
        <HonoraryConditionCard
          kind="mixed"
          title="40 или 60 смешанных"
          description="40, если из них не меньше 25 крови, иначе 60"
        />
      </section>

      <section className={styles['honorary-page__section']}>
        <Typography.Text variant="subheader">Что даёт звание</Typography.Text>
        {HONORARY_BENEFITS.map((item) => (
          <InfoRow key={item.title} icon={item.icon} tone={item.tone} size="l" title={item.title} description={item.description} />
        ))}
      </section>

      <section className={styles['honorary-page__section']}>
        <Typography.Text variant="subheader">Как оформить звание</Typography.Text>
        <BulletList ordered gap="m">
          {HOW_TO_APPLY.map((item, index) => (
            <BulletListItem key={item} marker="number" index={index + 1}>
              {item}
            </BulletListItem>
          ))}
        </BulletList>
      </section>

      <Typography.Text variant="description" color="tertiary" className={styles['honorary-page__footnote']}>
        {BENEFITS_FOOTNOTE}
      </Typography.Text>
    </Screen>
  )
}
