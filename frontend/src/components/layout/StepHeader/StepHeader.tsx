import { ProgressSegments } from '@/components/shared/ProgressSegments/ProgressSegments'

import { PageHeader } from '../PageHeader/PageHeader'

const TOTAL_STEPS = 5

interface StepHeaderProps {
  title: string
  step: number
  /** Шагов всего: 5 у записи, 3 у создания группы. */
  total?: number
  onBack?: () => void
}

/** Шапка шагов записи: заголовок, «Шаг N из M» и прогресс из M сегментов. */
export const StepHeader = ({ title, step, total = TOTAL_STEPS, onBack }: StepHeaderProps) => (
  <PageHeader title={title} subtitle={`Шаг ${step} из ${total}`} onBack={onBack}>
    <ProgressSegments total={total} current={step} />
  </PageHeader>
)
