import { Typography } from '@maxhub/max-ui'

import { useProgress } from '@/api/hooks/me'
import { HonoraryConditionCard } from '@/components/features/honorary/HonoraryConditionCard/HonoraryConditionCard'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import { ProgressBar } from '@/components/shared/ProgressBar/ProgressBar'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { BENEFITS_FOOTNOTE, HONORARY_BENEFITS } from '@/content/benefits'
import { formatYearsMonths } from '@/utils/format'

import styles from './HonoraryPage.module.scss'

// TODO: тексты экрана — до 4-го дня (ТЗ §13)
const HOW_TO_APPLY = [
  'Возьмите в центре крови справку о количестве донаций',
  'Подайте заявление через Госуслуги или в соцзащите по месту жительства',
  'Удостоверение и нагрудный знак выдадут после проверки',
]

/** Экран «Звание почётного донора»: условия, прогресс и льготы. */
export const HonoraryPage = () => {
  const progress = useProgress()

  const renderProgress = () => {
    if (progress.isPending) return <Skeleton height={64} />
    if (progress.isError) {
      return <ErrorState compact text="Не удалось загрузить прогресс" onRetry={() => progress.refetch()} />
    }
    const { total, honorary } = progress.data
    if (honorary.achieved) {
      return <Typography.Text variant="body">🏅 Вы набрали донации для звания. Как его оформить — ниже.</Typography.Text>
    }
    return (
      <>
        <Typography.Text variant="body">
          {total} из {honorary.mixed.goal} донаций
          {honorary.eta && (
            <>
              {' '}· до звания примерно <b>{formatYearsMonths(honorary.eta.years, honorary.eta.months)}</b>
            </>
          )}
        </Typography.Text>
        <ProgressBar value={total} max={honorary.mixed.goal} />
      </>
    )
  }

  return (
    <Screen header={<PageHeader title="Почётный донор России" align="center" />}>
      <section className={styles['honorary-page__section']}>
        <Typography.Text variant="subheader">Ваш прогресс</Typography.Text>
        {renderProgress()}
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
