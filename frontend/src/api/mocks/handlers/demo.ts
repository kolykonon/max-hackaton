import { http, HttpResponse } from 'msw'

import { db, decodeSlot, findCenter } from '../db'
import { apiError, BASE, latency } from '../utils'

const noContent = () => new HttpResponse(null, { status: 204 })

export const demoHandlers = [
  http.post(`${BASE}/demo/reset`, async () => {
    await latency()
    db.reset()
    return noContent()
  }),

  // Напоминание шлёт бот — в моках делать нечего
  http.post(`${BASE}/demo/appointments/:id/remind`, async ({ params }) => {
    await latency()
    if (!db.state.appointments.some((a) => a.id === Number(params.id))) {
      return apiError(404, 'appointment_not_found', 'Запись не найдена')
    }
    return noContent()
  }),

  http.post(`${BASE}/demo/appointments/:id/complete`, async ({ params }) => {
    await latency()
    const appointment = db.state.appointments.find((a) => a.id === Number(params.id))
    if (!appointment) return apiError(404, 'appointment_not_found', 'Запись не найдена')
    if (appointment.status !== 'active') return apiError(409, 'appointment_not_active', 'Запись уже неактивна')
    const { centerId, date } = decodeSlot(appointment.slotId)
    appointment.status = 'completed'
    db.state.donations.push({
      id: db.nextId(),
      type: appointment.donationType,
      date: new Date(date).toISOString(),
      centerName: findCenter(centerId)?.name ?? '',
      fromApp: true,
    })
    db.save()
    return noContent()
  }),

  // «Сдали кровь?» и пуши присылает бот — в моках только проверяем условия
  http.post(`${BASE}/demo/appointments/:id/ask-donated`, async ({ params }) => {
    await latency()
    const appointment = db.state.appointments.find((a) => a.id === Number(params.id))
    if (!appointment) return apiError(404, 'appointment_not_found', 'Запись не найдена')
    if (appointment.status !== 'active') return apiError(409, 'appointment_not_active', 'Запись уже неактивна')
    return noContent()
  }),

  http.post(`${BASE}/demo/pushes/:kind`, async ({ params }) => {
    await latency()
    if (params.kind === 'rest_day' && !db.state.donations.some((d) => d.fromApp)) {
      return apiError(404, 'donation_not_found', 'Нет засчитанной донации')
    }
    return noContent()
  }),

  http.get(`${BASE}/health`, () => HttpResponse.json({ status: 'ok' })),
]
