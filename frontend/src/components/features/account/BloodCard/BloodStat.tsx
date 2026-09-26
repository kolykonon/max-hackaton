import styles from './BloodCard.module.scss'

interface BloodStatProps {
  label: string
  value?: string
}

/** Один показатель крови. Неизвестное значение — «—». */
export const BloodStat = ({ label, value }: BloodStatProps) => (
  <div className={styles['blood-card__stat']}>
    <dt className={styles['blood-card__stat-label']}>{label}</dt>
    <dd className={styles['blood-card__stat-value']}>{value || '—'}</dd>
  </div>
)
