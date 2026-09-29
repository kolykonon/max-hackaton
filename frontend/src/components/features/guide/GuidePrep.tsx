import { Typography } from '@maxhub/max-ui'
import type { ReactNode } from 'react'

import { isInsideMax, openLink } from '@/bridge/max'
import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { Card } from '@/components/shared/Card/Card'
import { OutlineButton } from '@/components/shared/OutlineButton/OutlineButton'
import { PREPARATION_ITEMS } from '@/content/donationTypes'
import { CHECKLIST_PATH, PREP } from '@/content/guide'

import { FindCenter } from './FindCenter'
import styles from './Guide.module.scss'
import { GuideLottie } from './GuideLottie'
import { GuideSection } from './GuideSection'
import type { GuideSheet } from './GuideSheets'

const Term = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" className={styles.term} onClick={onClick}>
    {children}
  </button>
)

const Step = ({ n, children }: { n: number; children: ReactNode }) => (
  <Card className={styles.step}>
    <span className={styles.step__number} aria-hidden>
      {String(n).padStart(2, '0')}
    </span>
    <Typography.Text variant="body" className={styles.step__text}>
      {children}
    </Typography.Text>
  </Card>
)

// В MAX PDF открывает внешний браузер; в обычном браузере скачиваем файл сразу
const downloadChecklist = () => {
  const url = new URL(CHECKLIST_PATH, window.location.origin).href
  if (isInsideMax()) return openLink(url)
  const link = document.createElement('a')
  link.href = url
  link.download = ''
  link.click()
}

export const GuidePrep = ({ onOpen }: { onOpen: (sheet: GuideSheet) => void }) => (
  <GuideSection
    id="prep"
    title={PREP.title}
    subtitle={PREP.subtitle}
    icon={<img className={styles.section__icon} src="/guide/prep-icon.webp" alt="" width={160} height={159} />}
  >
    <div className={styles.cards}>
      <Step n={1}>
        Проверьте, что у вас нет <Term onClick={() => onOpen('criteria')}>противопоказаний.</Term>
      </Step>
      <Step n={2}>
        Выберите удобный центр сдачи крови в своём городе и сверьтесь{' '}
        <Term onClick={() => onOpen('traffic')}>с «Донорским светофором».</Term>
      </Step>
      <Step n={3}>{PREP.planStep}</Step>
      <Card>
        <Typography.Text variant="title" className={styles.card__title}>
          {PREP.listTitle}
        </Typography.Text>
        <BulletList gap="m">
          {PREPARATION_ITEMS.map((item) => (
            <BulletListItem key={item} marker="check">
              {item}
            </BulletListItem>
          ))}
        </BulletList>
        <Term onClick={() => onOpen('diet')}>Почему важна диета</Term>
      </Card>
      <Card onClick={() => onOpen('food')} className={styles.fridge}>
        <GuideLottie name="fridge" className={styles.fridge__image} />
        <Typography.Text variant="title">{PREP.fridge}</Typography.Text>
        <Typography.Text variant="detail" color="secondary">
          {PREP.fridgeHint}
        </Typography.Text>
      </Card>
      <div>
        <Typography.Text variant="subheader" className={styles.card__title}>
          {PREP.breakfastTitle}
        </Typography.Text>
        <ul className={styles.breakfasts}>
          {PREP.breakfasts.map(([title, text], i) => (
            <li key={title}>
              <Card>
                <img src={`/guide/breakfast-${i + 1}.webp`} alt="" width={240} height={192} loading="lazy" />
                <Typography.Text variant="title" className={styles.card__title}>
                  {title}
                </Typography.Text>
                <Typography.Text variant="detail" color="secondary">
                  {text}
                </Typography.Text>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <OutlineButton stretched onClick={downloadChecklist}>
        {PREP.checklist}
      </OutlineButton>
    </div>
    <FindCenter text={PREP.find} />
  </GuideSection>
)
