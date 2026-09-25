// Контракт API из ТЗ §6. Когда бэк отдаст /api/openapi.json, заменить на types.gen.ts из openapi-typescript.

import type { BloodGroup, DonationType, StockStatus } from '@/content/types'

/** Дата в формате YYYY-MM-DD. */
export type ISODate = string
/** Дата и время в ISO 8601. */
export type ISODateTime = string

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

// Профиль

export interface Me {
  id: number
  first_name: string
  last_name: string
  photo_url: string | null
  onboarding_completed: boolean
  blood: {
    group: BloodGroup | null
    kell: string | null
    phenotype: string | null
    donor_code: string | null
  }
  referrals_count: number
}

export interface PersonalDataFields {
  last_name: string
  first_name: string
  middle_name: string
  passport_series: string
  passport_number: string
  passport_issued_by: string
  passport_division_code: string
  oms_number: string
  phone: string
  email: string
}

export interface PersonalData extends PersonalDataFields {
  is_demo: boolean
  missing_fields: (keyof PersonalDataFields)[]
}

export interface Eligibility {
  next_allowed: Record<DonationType, ISODate>
  interval_active: Record<DonationType, boolean>
}

export interface Progress {
  total: number
  level: {
    code: string
    name: string
    threshold: number
    next: { name: string; threshold: number; remaining: number } | null
    is_max: boolean
  }
  honorary: {
    whole: { count: number; goal: number }
    plasma: { count: number; goal: number }
    mixed: { count: number; goal: number; whole_needed_for_40: number }
    achieved: boolean
    eta: { date: ISODate; years: number; months: number } | null
  }
}

export interface DonationItem {
  id: number
  donation_type: DonationType
  donated_on: ISODate
  center_name: string
}

export interface Donations {
  total: number
  years: { year: number; count: number; items: DonationItem[] }[]
}

export interface Referrals {
  count: number
  link: string
}

// Регионы и карта

export interface Region {
  id: number
  code: string
  name: string
  has_centers: boolean
}

export interface LocateResult {
  region: Region | null
}

export interface MapStatus {
  updated_at: ISODateTime
  regions: { code: string; statuses: Partial<Record<BloodGroup, StockStatus>>; worst: StockStatus }[]
}

// Запись

export interface BookingDates {
  from: ISODate
  to: ISODate
  earliest_allowed: ISODate
  first_available: ISODate | null
  days: { date: ISODate; available: boolean }[]
}

export interface BookingCenter {
  id: number
  name: string
  address: string
  lat: number
  lon: number
  photo_url: string | null
  free_slots: number
  distance_km: number | null
  group_status: StockStatus | null
}

export type SlotPeriod = 'morning' | 'day' | 'evening'

export interface BookingSlots {
  center: { id: number; name: string; address: string }
  date: ISODate
  groups: { period: SlotPeriod; slots: { id: number; local_time: string; is_free: boolean }[] }[]
}

export interface Appointment {
  id: number
  donation_type: DonationType
  starts_at: ISODateTime
  local_date: ISODate
  local_time: string
  center: { id: number; name: string; address: string; region_id: number }
}

export interface CurrentAppointment {
  appointment: Appointment | null
}
