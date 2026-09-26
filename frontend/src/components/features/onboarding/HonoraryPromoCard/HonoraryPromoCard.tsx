import { Typography } from '@maxhub/max-ui'
import { Medal } from 'lucide-react'

import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { Card } from '@/components/shared/Card/Card'
import { HONORARY_CONDITION, HONORARY_SHORT_BENEFITS } from '@/content/benefits'

import styles from './HonoraryPromoCard.module.scss'

/** Выделенный блок «Почётный донор России» на экране 2 онбординга. */
export const HonoraryPromoCard = () => (
  <Card variant="promo" className={styles['honorary-promo']}>
    <div className={styles['honorary-promo__head']}>
      <span className={styles['honorary-promo__icon']} aria-hidden>
        <Medal size={28} />
      </span>
      <div className={styles['honorary-promo__text']}>
        <Typography.Text variant="title" className={styles['honorary-promo__title']}>
          Почётный донор России
        </Typography.Text>
        <Typography.Text variant="detail" color="secondary" className={styles['honorary-promo__condition']}>
          {HONORARY_CONDITION}
        </Typography.Text>
      </div>
    </div>
    <Typography.Text variant="body-strong" className={styles['honorary-promo__subtitle']}>
      Что даёт звание:
    </Typography.Text>
    <BulletList>
      {HONORARY_SHORT_BENEFITS.map((item) => (
        <BulletListItem key={item} size="detail">
          {item}
        </BulletListItem>
      ))}
    </BulletList>
  </Card>
)
