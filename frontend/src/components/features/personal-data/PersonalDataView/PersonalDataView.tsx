import { IdCard, Phone, ShieldPlus } from 'lucide-react'

import { DataRow } from '../DataRow/DataRow'
import { DataSection } from '../DataSection/DataSection'
import { SECTIONS, type PersonalDataValues, type SectionKey } from '../fields'

export const SECTION_ICONS = { passport: IdCard, oms: ShieldPlus, contacts: Phone }

interface PersonalDataViewProps {
  data: PersonalDataValues
  onEdit: (section: SectionKey) => void
}

/** Режим просмотра: три блока с данными, у каждого — «Изменить». */
export const PersonalDataView = ({ data, onEdit }: PersonalDataViewProps) => {
  const fullName = [data.last_name, data.first_name, data.middle_name].filter(Boolean).join(' ')
  const passport = [data.passport_series, data.passport_number].filter(Boolean).join(' ')
  const section = (key: SectionKey) => ({ icon: SECTION_ICONS[key], title: SECTIONS[key].title, onEdit: () => onEdit(key) })

  return (
    <>
      <DataSection {...section('passport')}>
        <DataRow label="ФИО" value={data.last_name && data.first_name ? fullName : ''} />
        <DataRow label="Серия и номер" value={data.passport_series && data.passport_number ? passport : ''} />
        <DataRow label="Кем выдан" value={data.passport_issued_by} />
        <DataRow label="Код подразделения" value={data.passport_division_code} />
      </DataSection>
      <DataSection {...section('oms')}>
        <DataRow label="Номер полиса" value={data.oms_number} />
      </DataSection>
      <DataSection {...section('contacts')}>
        <DataRow label="Телефон" value={data.phone} />
        <DataRow label="Эл. почта" value={data.email} />
      </DataSection>
    </>
  )
}
