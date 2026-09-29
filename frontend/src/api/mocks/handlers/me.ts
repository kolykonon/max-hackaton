import { http, HttpResponse } from 'msw'

import type { DonationHistory, Me, PersonalData, PersonalDataFieldName, PersonalDataInput } from '../../types'
import { db } from '../db'
import { DEMO_USER, REGIONS } from '../fixtures'
import { getEligibility, getProgress } from '../logic'
import { apiError, BASE, latency } from '../utils'

const REQUIRED_FIELDS: PersonalDataFieldName[] = [
  'last_name',
  'first_name',
  'passport_series',
  'passport_number',
  'passport_issued_by',
  'passport_division_code',
  'oms_number',
  'phone',
  'email',
]

const personalData = (): PersonalData => ({
  ...db.state.personalData,
  middle_name: db.state.personalData.middle_name ?? null,
  is_demo: db.state.isDemoData,
  missing_fields: REQUIRED_FIELDS.filter((key) => !db.state.personalData[key]?.trim()),
})

/** Правила — паттерны PersonalDataInput из openapi.yaml, тексты — из confirming.md. */
const validate = (data: PersonalDataInput): Record<string, string> => {
  const name = /^[A-Za-zА-Яа-яЁё-]+$/
  const errors: Record<string, string> = {}
  if (!name.test(data.last_name ?? '')) errors.last_name = 'Введите фамилию'
  if (!name.test(data.first_name ?? '')) errors.first_name = 'Введите имя'
  if (!/^\d{4}$/.test(data.passport_series ?? '')) errors.passport_series = 'Серия — 4 цифры'
  if (!/^\d{6}$/.test(data.passport_number ?? '')) errors.passport_number = 'Номер — 6 цифр'
  if (!data.passport_issued_by?.trim()) errors.passport_issued_by = 'Укажите, кем выдан паспорт'
  if (!/^\d{3}-\d{3}$/.test(data.passport_division_code ?? '')) errors.passport_division_code = 'Код подразделения — 6 цифр'
  if (!/^\d{16}$/.test(data.oms_number ?? '')) errors.oms_number = 'Номер полиса — 16 цифр'
  if (!/^\+7\d{10}$/.test(data.phone ?? '')) errors.phone = 'Введите номер телефона полностью'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) errors.email = 'Проверьте адрес почты'
  return errors
}

const toMe = (): Me => {
  const region = REGIONS.find((r) => r.id === db.state.regionId)
  return {
    id: 1,
    first_name: DEMO_USER.firstName,
    last_name: DEMO_USER.lastName,
    photo_url: null,
    onboarding_completed: db.state.onboardingCompleted,
    blood: { group: DEMO_USER.bloodGroup, kell: DEMO_USER.kell, phenotype: DEMO_USER.phenotype, donor_code: DEMO_USER.donorCode },
    referrals_count: DEMO_USER.referralsCount,
    region: region ? { id: region.id, name: region.name } : null,
  }
}

export const meHandlers = [
  http.get(`${BASE}/me`, async () => {
    await latency()
    return HttpResponse.json(toMe())
  }),

  http.put(`${BASE}/me/region`, async ({ request }) => {
    await latency()
    const { region_id: regionId } = (await request.json()) as { region_id: number }
    if (!REGIONS.some((r) => r.id === regionId)) return apiError(404, 'not_found', 'Регион не найден')
    db.state.regionId = regionId
    db.save()
    return HttpResponse.json(toMe())
  }),

  http.post(`${BASE}/me/onboarding`, async ({ request }) => {
    await latency()
    const body = (await request.json()) as { consent?: boolean }
    if (body.consent !== true) return apiError(422, 'validation_error', 'Нужно согласие на обработку персональных данных')
    db.state.onboardingCompleted = true
    db.save()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/me/personal-data`, async () => {
    await latency()
    return HttpResponse.json(personalData())
  }),

  http.put(`${BASE}/me/personal-data`, async ({ request }) => {
    await latency()
    const body = (await request.json()) as PersonalDataInput
    const fields = validate(body)
    if (Object.keys(fields).length > 0) return apiError(422, 'validation_error', 'Проверьте данные', fields)
    db.state.personalData = body
    db.state.isDemoData = false
    db.save()
    return HttpResponse.json(personalData())
  }),

  http.get(`${BASE}/me/eligibility`, async () => {
    await latency()
    return HttpResponse.json(getEligibility(db.state.donations))
  }),

  http.get(`${BASE}/me/progress`, async () => {
    await latency()
    return HttpResponse.json(getProgress(db.state.donations))
  }),

  http.get(`${BASE}/me/donations`, async () => {
    await latency()
    const sorted = [...db.state.donations].sort((a, b) => b.date.localeCompare(a.date))
    const years = new Map<number, DonationHistory['years'][number]>()
    sorted.forEach((d) => {
      const year = new Date(d.date).getFullYear()
      const group = years.get(year) ?? { year, count: 0, items: [] }
      group.count += 1
      group.items.push({ id: d.id, donation_type: d.type, donated_on: d.date.slice(0, 10), center_name: d.centerName })
      years.set(year, group)
    })
    const result: DonationHistory = { total: sorted.length, years: [...years.values()] }
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/me/referrals`, async () => {
    await latency()
    return HttpResponse.json({ count: DEMO_USER.referralsCount, link: DEMO_USER.referralLink })
  }),
]
