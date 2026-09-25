import { ProgressSegments } from '@/components/shared/ProgressSegments/ProgressSegments'

import { PageHeader } from '../PageHeader/PageHeader'

const TOTAL_STEPS = 5

interface StepHeaderProps {
  title: string
  step: number
  onBack?: () => void
}

/** Шапка шагов 1–5 записи: заголовок, «Шаг N из 5» и прогресс из 5 сегментов. */
export const StepHeader = ({ title, step, onBack }: StepHeaderProps) => (
  <PageHeader title={title} subtitle={`Шаг ${step} из ${TOTAL_STEPS}`} onBack={onBack}>
    <ProgressSegments total={TOTAL_STEPS} current={step} />
  </PageHeader>
)
