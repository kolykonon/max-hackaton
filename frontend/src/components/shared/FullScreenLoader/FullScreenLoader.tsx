import { Spinner } from '@maxhub/max-ui'

import styles from './FullScreenLoader.module.scss'

/** Спиннер по центру экрана без текста — старт приложения (онбординг, общие правила). */
export const FullScreenLoader = () => (
  <div className={styles['full-screen-loader']}>
    <Spinner size={32} appearance="themed" />
  </div>
)
