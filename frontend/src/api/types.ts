import type { components } from './types.gen'

type Schemas = components['schemas']

export type ISODate = string

export type ApiErrorBody = Schemas['ErrorResponse']
export type ErrorCode = Schemas['ErrorCode']

export type Me = Schemas['Me']
export type PersonalData = Schemas['PersonalData']
export type PersonalDataInput = Schemas['PersonalDataInput']
export type PersonalDataFieldName = Schemas['PersonalDataField']
export type Eligibility = Schemas['Eligibility']
export type Progress = Schemas['Progress']
export type DonationHistory = Schemas['DonationHistory']
export type Donation = Schemas['Donation']
export type Referrals = Schemas['Referrals']

export type Region = Schemas['Region']
export type LocateRegionResponse = Schemas['LocateRegionResponse']
export type MapStatus = Schemas['MapStatus']
export type ApiStockStatus = Schemas['StockStatus']

export type BookingDates = Schemas['BookingDates']
export type BookingCenter = Schemas['BookingCenter']
export type BookingSlots = Schemas['BookingSlots']
export type SlotPeriod = Schemas['SlotPeriod']
export type Appointment = Schemas['Appointment']
/** Общий ответ current / create / reschedule / cancel. */
export type AppointmentResponse = Schemas['AppointmentResponse']

// TODO: /map/centers уже описан в docs/openapi.yaml, но бэк его ещё не экспортирует в openapi.json.
// Когда появится — `npm run gen:api` и заменить на Schemas['MapCenter'].
export interface MapCenter {
  id: number
  name: string
  address: string
  lat: number
  lon: number
  region_id: number
  statuses: MapStatus['regions'][number]['statuses']
  worst: ApiStockStatus | null
}
