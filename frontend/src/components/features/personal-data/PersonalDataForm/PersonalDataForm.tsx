import { IdCard, Phone, ShieldPlus } from 'lucide-react'

import { DataField } from '@/components/shared/DataField/DataField'

import { DataSection } from '../DataSection/DataSection'
import { FIELDS, type FieldErrors, type FieldKey, type PersonalDataValues } from '../fields'
import styles from './PersonalDataForm.module.scss'

interface PersonalDataFormProps {
  data: PersonalDataValues
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
        mask={field.mask}
        onChange={(value) => onChange(key, value)}
        onBlur={() => onBlur(key)}
      />
    )
  }

  return (
    <>
      <DataSection icon={IdCard} title="Паспорт РФ">
        {renderField('last_name', true)}
        {renderField('first_name')}
        {renderField('middle_name')}
        <div className={styles['personal-data-form__row']}>
          {renderField('passport_series')}
          {renderField('passport_number')}
        </div>
        {renderField('passport_issued_by')}
        {renderField('passport_division_code')}
      </DataSection>
      <DataSection icon={ShieldPlus} title="Полис ОМС">
        {renderField('oms_number')}
      </DataSection>
      <DataSection icon={Phone} title="Контакты">
        {renderField('phone')}
        {renderField('email')}
      </DataSection>
    </>
  )
}
