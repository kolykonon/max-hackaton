import { Typography } from '@maxhub/max-ui'
import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

import type { Donation, DonationType } from '@/api/types'
import { Card } from '@/components/shared/Card/Card'
import { DonationIcon } from '@/components/shared/DonationIcon/DonationIcon'
import { cn } from '@/utils/cn'

import styles from './DonationHistorySheet.module.scss'

interface HistoryItemProps {
  donation: Donation
}

const TYPE_LABEL: Record<DonationType, string> = {
  whole_blood: 'Кровь',
  plasma: 'Плазма',
  platelets: 'Тромбоциты',
}

const numericDate = (date: string) => date.split('-').reverse().join('.')

/** Карточка раскрывает все доступные сведения о донации внутри истории. */
export const HistoryItem = ({ donation }: HistoryItemProps) => {
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const label = TYPE_LABEL[donation.donation_type]
  const iconKind = donation.donation_type === 'platelets' ? 'plasma' : donation.donation_type

  return (
    <li>
      <Card padding="none" className={styles['history-item']}>
        <button
          type="button"
          className={styles['history-item__toggle']}
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((value) => !value)}
        >
          <DonationIcon kind={iconKind} size={26} framed />
          <span className={styles['history-item__summary']}>
            <Typography.Text variant="title">{label}</Typography.Text>
            <Typography.Text variant="body" color="secondary">
              {numericDate(donation.donated_on)}
            </Typography.Text>
          </span>
          <ChevronDown
            size={22}
            className={cn(styles['history-item__chevron'], open && styles['history-item__chevron--open'])}
            aria-hidden
          />
        </button>

        <div id={detailsId} hidden={!open} className={styles['history-item__details']}>
          <Typography.Text variant="subheader">
            {donation.has_analysis ? 'Анализ крови' : 'Информация о донации'}
          </Typography.Text>
          <dl className={styles['history-item__facts']}>
            {donation.donation_code && (
              <div>
                <dt>Код донации</dt>
                <dd className={styles['history-item__code']}>{donation.donation_code}</dd>
              </div>
            )}
            <div>
              <dt>Дата донации</dt>
              <dd>{numericDate(donation.donated_on)}</dd>
            </div>
            <div>
              <dt>Тип донации</dt>
              <dd>{label}</dd>
            </div>
            {donation.center_name && (
              <div>
                <dt>Место донации</dt>
                <dd>{donation.center_name}</dd>
              </div>
            )}
            {donation.is_completed !== undefined && (
              <div>
                <dt>Донация совершена</dt>
                <dd>{donation.is_completed ? 'Да' : 'Нет'}</dd>
              </div>
            )}
          </dl>
          {(donation.has_analysis || donation.has_certificate) && (
            <div className={styles['history-item__documents']} aria-label="Доступные документы">
              {donation.has_analysis && <span>Анализ</span>}
              {donation.has_certificate && <span>Справка</span>}
            </div>
          )}
        </div>
      </Card>
    </li>
  )
}
