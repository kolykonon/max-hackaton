import { IdCard, Phone, ShieldPlus } from 'lucide-react'

import type { PersonalData } from '@/content/demo'

import { DataField } from '../DataField/DataField'
import { DataSection } from '../DataSection/DataSection'
import { FIELDS, type FieldErrors, type FieldKey } from '../fields'
import styles from './PersonalDataForm.module.scss'

interface PersonalDataFormProps {
  data: PersonalData
  errors: FieldErrors
  onChange: (key: FieldKey, value: string) => void
  onBlur: (key: FieldKey) => void
}

/** Режим редактирования: те же блоки, но с полями ввода. ФИО разбито на три поля. */
export const PersonalDataForm = ({ data, errors, onChange, onBlur }: PersonalDataFormProps) => {
  const renderField = (key: FieldKey, autoFocus = false) => {
    const field = FIELDS[key]
    return (
      <DataField
        key={key}
        label={field.label}
        value={data[key]}
        error={errors[key]}
        inputMode={field.inputMode}
        placeholder={field.placeholder}
        autoFocus={autoFocus}
        onChange={(value) => onChange(key, field.mask ? field.mask(value) : value)}
        onBlur={() => onBlur(key)}
      />
    )
  }

  return (
    <>
      <DataSection icon={IdCard} title="Паспорт РФ">
        {renderField('lastName', true)}
        {renderField('firstName')}
        {renderField('middleName')}
        <div className={styles['personal-data-form__row']}>
          {renderField('passportSeries')}
          {renderField('passportNumber')}
        </div>
        {renderField('passportIssuedBy')}
        {renderField('passportDivisionCode')}
      </DataSection>
      <DataSection icon={ShieldPlus} title="Полис ОМС">
        {renderField('omsNumber')}
      </DataSection>
      <DataSection icon={Phone} title="Контакты">
        {renderField('phone')}
        {renderField('email')}
      </DataSection>
    </>
  )
}
