import { Typography } from '@maxhub/max-ui'
import { Link } from 'react-router-dom'

import { Checkbox } from '@/components/shared/Checkbox/Checkbox'

import styles from './ConsentCheckbox.module.scss'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  showHint: boolean
}

/** Чекбокс согласия на обработку ПД с подсказкой, если пытаются продолжить без него. */
export const ConsentCheckbox = ({ checked, onChange, showHint }: ConsentCheckboxProps) => (
  <div className={styles['consent-checkbox']}>
    <Checkbox checked={checked} onChange={onChange} invalid={showHint}>
      Я соглашаюсь на{' '}
      <Link to="/consent" className={styles['consent-checkbox__link']} onClick={(event) => event.stopPropagation()}>
        обработку персональных данных
      </Link>
    </Checkbox>
    {showHint && (
      <Typography.Text variant="description" className={styles['consent-checkbox__hint']} role="alert">
        Чтобы продолжить, дайте согласие
      </Typography.Text>
    )}
  </div>
)
