import { IdCard, Phone, ShieldPlus } from 'lucide-react'

import type { PersonalData } from '@/content/demo'

import { DataRow } from '../DataRow/DataRow'
import { DataSection } from '../DataSection/DataSection'

interface PersonalDataViewProps {
  data: PersonalData
}

/** Режим просмотра: три блока с данными. */
export const PersonalDataView = ({ data }: PersonalDataViewProps) => {
  const fullName = [data.lastName, data.firstName, data.middleName].filter(Boolean).join(' ')
  const passport = [data.passportSeries, data.passportNumber].filter(Boolean).join(' ')

  return (
    <>
      <DataSection icon={IdCard} title="Паспорт РФ">
        <DataRow label="ФИО" value={data.lastName && data.firstName ? fullName : ''} />
        <DataRow label="Серия и номер" value={data.passportSeries && data.passportNumber ? passport : ''} />
        <DataRow label="Кем выдан" value={data.passportIssuedBy} />
        <DataRow label="Код подразделения" value={data.passportDivisionCode} />
      </DataSection>
      <DataSection icon={ShieldPlus} title="Полис ОМС">
        <DataRow label="Номер полиса" value={data.omsNumber} />
      </DataSection>
      <DataSection icon={Phone} title="Контакты">
        <DataRow label="Телефон" value={data.phone} />
        <DataRow label="Эл. почта" value={data.email} />
      </DataSection>
    </>
  )
}
