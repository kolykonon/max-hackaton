import { Button, Typography } from '@maxhub/max-ui'
import { useNavigate } from 'react-router-dom'

import { FIND_CENTER_PATH } from '@/content/guide'

import styles from './Guide.module.scss'

/** «Теперь вы знаете…» и кнопка в запись на донацию. */
export const FindCenter = ({ text }: { text: string }) => {
  const navigate = useNavigate()
  return (
    <div className={styles.find}>
      <Typography.Text variant="header">{text}</Typography.Text>
      <Button size="large" stretched onClick={() => navigate(FIND_CENTER_PATH)}>
        Найти свой центр сдачи крови
      </Button>
    </div>
  )
}
