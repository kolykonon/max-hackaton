import { Switch, Typography } from '@maxhub/max-ui'
import { useId } from 'react'

import { Card } from '@/components/shared/Card/Card'
import { DataField } from '@/components/shared/DataField/DataField'
import { addDays, parseISODate, toISODate } from '@/utils/format'

import { RestDateField } from '../RestDateField/RestDateField'
import styles from './LeaveApplicationForm.module.scss'

export interface LeaveApplicationValues {
  employer_name: string
  head_position: string
  head_name: string
  employee_position: string
  rest_date: string
  attach_to_vacation: boolean
}

type TextKey = 'employer_name' | 'head_position' | 'head_name' | 'employee_position'

interface LeaveApplicationFormProps {
  values: LeaveApplicationValues
  donatedOn: string
  deadline: string
  restDateError?: string
  onChange: <K extends keyof LeaveApplicationValues>(key: K, value: LeaveApplicationValues[K]) => void
}

const TEXT_FIELDS: { key: TextKey; label: string; placeholder: string }[] = [
  { key: 'employer_name', label: 'Организация', placeholder: 'ООО «Ромашка»' },
  { key: 'head_position', label: 'Кому — должность руководителя', placeholder: 'Генеральному директору' },
  { key: 'head_name', label: 'Кому — ФИО руководителя', placeholder: 'Петрову П. П.' },
  { key: 'employee_position', label: 'Ваша должность', placeholder: 'менеджер' },
]

const noop = () => {}

/** Заявление на дополнительный день отдыха. Все поля необязательные: пустые останутся линиями для ручки. */
export const LeaveApplicationForm = ({ values, donatedOn, deadline, restDateError, onChange }: LeaveApplicationFormProps) => {
  const vacationId = useId()

  return (
    <Card padding="l" className={styles['leave-application-form']}>
      <div className={styles['leave-application-form__head']}>
        <Typography.Text variant="subheader">Заявление работодателю</Typography.Text>
        <Typography.Text variant="detail" color="secondary">
          ФИО подставим из ваших данных. Что не заполните — впишете от руки
        </Typography.Text>
      </div>
      {TEXT_FIELDS.map((field) => (
        <DataField
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
          onBlur={noop}
        />
      ))}
      <label htmlFor={vacationId} className={styles['leave-application-form__vacation']}>
        <Typography.Text variant="body">Присоединить к отпуску</Typography.Text>
        <Switch
          id={vacationId}
          checked={values.attach_to_vacation}
          onChange={(event) => onChange('attach_to_vacation', event.target.checked)}
        />
      </label>
      {!values.attach_to_vacation && (
        <RestDateField
          value={values.rest_date}
          min={toISODate(addDays(parseISODate(donatedOn), 1))}
          max={deadline}
          error={restDateError}
          onChange={(value) => onChange('rest_date', value)}
        />
      )}
    </Card>
  )
}
