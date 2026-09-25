import { http, HttpResponse } from 'msw'


import type { Donations, Me, PersonalData, PersonalDataFields } from '../../types'
import { db } from '../db'
import { DEMO_USER } from '../fixtures'
import { getEligibility, getProgress } from '../logic'
import { apiError, BASE, latency } from '../utils'

const REQUIRED_FIELDS: (keyof PersonalDataFields)[] = [
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
  is_demo: db.state.isDemoData,
  missing_fields: REQUIRED_FIELDS.filter((key) => !db.state.personalData[key].trim()),
})

/** Проверки как в confirming.md. Бэк отдаёт то же в 422 с fields. */
const validate = (data: PersonalDataFields): Record<string, string> => {
  const digits = (value: string) => value.replace(/\D/g, '').length
  const errors: Record<string, string> = {}
  if (!data.last_name.trim()) errors.last_name = 'Введите фамилию'
  if (!data.first_name.trim()) errors.first_name = 'Введите имя'
  if (digits(data.passport_series) !== 4) errors.passport_series = 'Серия — 4 цифры'
  if (digits(data.passport_number) !== 6) errors.passport_number = 'Номер — 6 цифр'
  if (!data.passport_issued_by.trim()) errors.passport_issued_by = 'Укажите, кем выдан паспорт'
  if (digits(data.passport_division_code) !== 6) errors.passport_division_code = 'Код подразделения — 6 цифр'
  if (digits(data.oms_number) !== 16) errors.oms_number = 'Номер полиса — 16 цифр'
  if (digits(data.phone) !== 11) errors.phone = 'Введите номер телефона полностью'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Проверьте адрес почты'
  return errors
}

export const meHandlers = [
  http.get(`${BASE}/me`, async () => {
    await latency()
    const me: Me = {
      id: 1,
      first_name: DEMO_USER.firstName,
      last_name: DEMO_USER.lastName,
      photo_url: null,
      onboarding_completed: db.state.onboardingCompleted,
      blood: { group: DEMO_USER.bloodGroup, kell: DEMO_USER.kell, phenotype: DEMO_USER.phenotype, donor_code: DEMO_USER.donorCode },
      referrals_count: DEMO_USER.referralsCount,
    }
    return HttpResponse.json(me)
  }),

  http.post(`${BASE}/me/onboarding`, async ({ request }) => {
    await latency()
    const body = (await request.json()) as { consent?: boolean }
    if (!body.consent) return apiError(422, 'consent_required', 'Нужно согласие на обработку персональных данных')
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
    const body = (await request.json()) as PersonalDataFields
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
    const years = new Map<number, Donations['years'][number]>()
    sorted.forEach((d) => {
      const year = new Date(d.date).getFullYear()
      const group = years.get(year) ?? { year, count: 0, items: [] }
      group.count += 1
      group.items.push({ id: d.id, donation_type: d.type, donated_on: d.date.slice(0, 10), center_name: d.centerName })
      years.set(year, group)
    })
    const result: Donations = { total: sorted.length, years: [...years.values()] }
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/me/referrals`, async () => {
    await latency()
    return HttpResponse.json({ count: DEMO_USER.referralsCount, link: DEMO_USER.referralLink })
  }),
]
