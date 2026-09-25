import { IdCard, Phone, ShieldPlus } from 'lucide-react'

import type { PersonalDataFields as PersonalData } from '@/api/types'

import { DataRow } from '../DataRow/DataRow'
import { DataSection } from '../DataSection/DataSection'

interface PersonalDataViewProps {
  data: PersonalData
}

/** Режим просмотра: три блока с данными. */
export const PersonalDataView = ({ data }: PersonalDataViewProps) => {
  const fullName = [data.last_name, data.first_name, data.middle_name].filter(Boolean).join(' ')
  const passport = [data.passport_series, data.passport_number].filter(Boolean).join(' ')

  return (
    <>
      <DataSection icon={IdCard} title="Паспорт РФ">
        <DataRow label="ФИО" value={data.last_name && data.first_name ? fullName : ''} />
        <DataRow label="Серия и номер" value={data.passport_series && data.passport_number ? passport : ''} />
        <DataRow label="Кем выдан" value={data.passport_issued_by} />
        <DataRow label="Код подразделения" value={data.passport_division_code} />
      </DataSection>
      <DataSection icon={ShieldPlus} title="Полис ОМС">
        <DataRow label="Номер полиса" value={data.oms_number} />
      </DataSection>
      <DataSection icon={Phone} title="Контакты">
        <DataRow label="Телефон" value={data.phone} />
        <DataRow label="Эл. почта" value={data.email} />
      </DataSection>
    </>
  )
}
