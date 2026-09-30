import { http, HttpResponse } from 'msw'

import type { DonationHistory, Me, PersonalData, PersonalDataFieldName, PersonalDataInput } from '../../types'
import { db } from '../db'
import { DEMO_DONATION_HISTORY, DEMO_USER, REGIONS } from '../fixtures'
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

export const missingFields = () => REQUIRED_FIELDS.filter((key) => !db.state.personalData[key]?.trim())

const personalData = (): PersonalData => ({
  last_name: null,
  first_name: null,
  passport_series: null,
  passport_number: null,
  passport_issued_by: null,
  passport_division_code: null,
  oms_number: null,
  phone: null,
  email: null,
  ...db.state.personalData,
  middle_name: db.state.personalData.middle_name ?? null,
  is_demo: db.state.isDemoData,
  missing_fields: missingFields(),
})

/** Правила — паттерны PersonalDataInput из openapi, тексты — из confirming.md. */
const RULES: Partial<Record<PersonalDataFieldName, [RegExp, string]>> = {
  last_name: [/^[A-Za-zА-Яа-яЁё-]+$/, 'Введите фамилию'],
  first_name: [/^[A-Za-zА-Яа-яЁё-]+$/, 'Введите имя'],
  passport_series: [/^\d{4}$/, 'Серия — 4 цифры'],
  passport_number: [/^\d{6}$/, 'Номер — 6 цифр'],
  passport_issued_by: [/\S/, 'Укажите, кем выдан паспорт'],
  passport_division_code: [/^\d{3}-\d{3}$/, 'Код подразделения — 6 цифр'],
  oms_number: [/^\d{16}$/, 'Номер полиса — 16 цифр'],
  phone: [/^\+7\d{10}$/, 'Введите номер телефона полностью'],
  email: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Проверьте адрес почты'],
}

/** Сохраняем по разделам: проверяем и меняем только пришедшие поля. */
const validate = (data: PersonalDataInput): Record<string, string> =>
  Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) => {
      const rule = RULES[key as PersonalDataFieldName]
      return rule && !rule[0].test(String(value ?? '')) ? [[key, rule[1]]] : []
    }),
  )

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
    db.state.personalData = { ...db.state.personalData, ...body }
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
    const result: DonationHistory = {
      total: DEMO_DONATION_HISTORY.length,
      years: [{ year: 2026, count: DEMO_DONATION_HISTORY.length, items: DEMO_DONATION_HISTORY }],
    }
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/me/referrals`, async () => {
    await latency()
    return HttpResponse.json({ count: DEMO_USER.referralsCount, link: DEMO_USER.referralLink })
  }),
]
