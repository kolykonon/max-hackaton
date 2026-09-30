import { DataField } from '@/components/shared/DataField/DataField'

import { DataSection } from '../DataSection/DataSection'
import { FIELDS, SECTIONS, type FieldErrors, type FieldKey, type PersonalDataValues, type SectionKey } from '../fields'
import { SECTION_ICONS } from '../PersonalDataView/PersonalDataView'
import styles from './PersonalDataForm.module.scss'

interface PersonalDataFormProps {
  section: SectionKey
  data: PersonalDataValues
  errors: FieldErrors
  onChange: (key: FieldKey, value: string) => void
  onBlur: (key: FieldKey) => void
}

/** Редактирование одного раздела настроек. ФИО разбито на три поля, серия и номер — в одну строку. */
export const PersonalDataForm = ({ section, data, errors, onChange, onBlur }: PersonalDataFormProps) => {
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
    <DataSection icon={SECTION_ICONS[section]} title={SECTIONS[section].title}>
      {section === 'passport' ? (
        <>
          {renderField('last_name', true)}
          {renderField('first_name')}
          {renderField('middle_name')}
          <div className={styles['personal-data-form__row']}>
            {renderField('passport_series')}
            {renderField('passport_number')}
          </div>
          {renderField('passport_issued_by')}
          {renderField('passport_division_code')}
        </>
      ) : (
        SECTIONS[section].fields.map((key, i) => renderField(key, i === 0))
      )}
    </DataSection>
  )
}
