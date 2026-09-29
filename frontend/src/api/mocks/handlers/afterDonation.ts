import { http, HttpResponse } from 'msw'

import { addDays, startOfDay, toISODate } from '@/utils/format'

import type { AfterDonation, AfterDonationResponse, LeaveApplicationInput } from '../../types'
import { db, type MockDonation } from '../db'
import { apiError, BASE, latency } from '../utils'

const DOCUMENTS = [
  'Справку о донации (форма № 402/у) — для отдела кадров: по ней оплачивают день донации и дают дополнительный день отдыха',
  'Справку о медосмотре (форма № 401/у), если медосмотр был в другой день — в день медосмотра работник тоже освобождается от работы',
]

const DAY_MS = 86_400_000

/** День отдыха можно взять в течение года после донации (ст. 186 ТК РФ). */
const deadlineOf = (donatedOn: Date) => {
  const deadline = new Date(donatedOn)
  deadline.setFullYear(deadline.getFullYear() + 1)
  return deadline
}

const toAfter = (donation: MockDonation): AfterDonation => {
  const donatedOn = startOfDay(new Date(donation.date))
  const deadline = deadlineOf(donatedOn)
  return {
    donation_id: donation.id,
    donation_type: donation.type,
    donated_on: toISODate(donatedOn),
    center_name: donation.centerName || null,
    documents: DOCUMENTS,
    rest_day: {
      deadline: toISODate(deadline),
      days_left: Math.round((deadline.getTime() - startOfDay(new Date()).getTime()) / DAY_MS),
      used: Boolean(donation.restUsedAt),
      used_at: donation.restUsedAt ?? null,
    },
  }
}

const findDonation = (id: number) => db.state.donations.find((d) => d.id === id && d.fromApp) ?? null

/** Проверка даты отдыха как на бэке: после дня донации и не позже срока. */
const restDateError = (donation: MockDonation, input: LeaveApplicationInput) => {
  if (!input.rest_date || input.attach_to_vacation) return null
  const { donated_on: donatedOn, rest_day: restDay } = toAfter(donation)
  if (input.rest_date > donatedOn && input.rest_date <= restDay.deadline) return null
  return apiError(422, 'validation_error', 'Проверьте данные', {
    rest_date: `Выберите день после донации и не позже ${restDay.deadline.split('-').reverse().join('.')}`,
  })
}

// Минимальный PDF: вместо настоящего заявления, чтобы проверить скачивание без бэка
const MOCK_PDF = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF'

export const afterDonationHandlers = [
  http.get(`${BASE}/me/after-donation`, async () => {
    await latency()
    const yearAgo = addDays(startOfDay(new Date()), -365)
    const latest = db.state.donations
      .filter((d) => d.fromApp && new Date(d.date) >= yearAgo)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    const result: AfterDonationResponse = { after_donation: latest ? toAfter(latest) : null }
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/me/donations/:id/after`, async ({ params }) => {
    await latency()
    const donation = findDonation(Number(params.id))
    if (!donation) return apiError(404, 'donation_not_found', 'Донация не найдена')
    return HttpResponse.json(toAfter(donation))
  }),

  http.put(`${BASE}/me/donations/:id/rest-day`, async ({ params, request }) => {
    await latency()
    const donation = findDonation(Number(params.id))
    if (!donation) return apiError(404, 'donation_not_found', 'Донация не найдена')
    const { used } = (await request.json()) as { used: boolean }
    donation.restUsedAt = used ? new Date().toISOString() : null
    db.save()
    return HttpResponse.json(toAfter(donation))
  }),

  http.post(`${BASE}/me/donations/:id/leave-application`, async ({ params, request }) => {
    await latency()
    const donation = findDonation(Number(params.id))
    if (!donation) return apiError(404, 'donation_not_found', 'Донация не найдена')
    const error = restDateError(donation, (await request.json()) as LeaveApplicationInput)
    if (error) return error
    const format = new URL(request.url).searchParams.get('format') ?? 'pdf'
    return new HttpResponse(MOCK_PDF, {
      headers: {
        'Content-Type': format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`Заявление на день отдыха.${format}`)}`,
      },
    })
  }),

  http.post(`${BASE}/me/donations/:id/leave-application/send`, async ({ params, request }) => {
    await latency()
    const donation = findDonation(Number(params.id))
    if (!donation) return apiError(404, 'donation_not_found', 'Донация не найдена')
    const error = restDateError(donation, (await request.json()) as LeaveApplicationInput)
    if (error) return error
    return new HttpResponse(null, { status: 204 })
  }),
]
