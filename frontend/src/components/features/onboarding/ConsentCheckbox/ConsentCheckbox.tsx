import { Typography } from '@maxhub/max-ui'

import { Checkbox } from '@/components/shared/Checkbox/Checkbox'

import styles from './ConsentCheckbox.module.scss'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  showHint: boolean
  onOpenConsent: () => void
}

/** Чекбокс согласия на обработку ПД с подсказкой, если пытаются продолжить без него. */
export const ConsentCheckbox = ({ checked, onChange, showHint, onOpenConsent }: ConsentCheckboxProps) => (
  <div className={styles['consent-checkbox']}>
    <Checkbox checked={checked} onChange={onChange} invalid={showHint}>
      Я соглашаюсь на{' '}
      {/* Кнопка внутри label: клик открывает текст согласия и не переключает галочку */}
      <button
        type="button"
        className={styles['consent-checkbox__link']}
        onClick={(event) => {
          event.preventDefault()
          onOpenConsent()
        }}
      >
        обработку персональных данных
      </button>
    </Checkbox>
    {showHint && (
      <Typography.Text variant="description" className={styles['consent-checkbox__hint']} role="alert">
        Чтобы продолжить, дайте согласие
      </Typography.Text>
    )}
  </div>
)
