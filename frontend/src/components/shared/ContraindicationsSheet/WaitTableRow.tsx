import styles from './ContraindicationsSheet.module.scss'

interface WaitTableRowProps {
  situation: string
  wait: string
}

export const WaitTableRow = ({ situation, wait }: WaitTableRowProps) => (
  <tr className={styles['wait-table__row']}>
    <td className={styles['wait-table__cell']}>{situation}</td>
    <td className={styles['wait-table__cell']}>{wait}</td>
  </tr>
)
