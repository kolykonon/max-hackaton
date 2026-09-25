import { http, HttpResponse } from 'msw'

import { db, decodeSlot, findCenter } from '../db'
import { apiError, BASE, latency } from '../utils'

export const demoHandlers = [
  http.post(`${BASE}/demo/reset`, async () => {
    await latency()
    db.reset()
    return HttpResponse.json({})
  }),

  http.post(`${BASE}/demo/appointments/:id/remind`, async () => {
    await latency()
    return HttpResponse.json({})
  }),

  http.post(`${BASE}/demo/appointments/:id/complete`, async ({ params }) => {
    await latency()
    const appointment = db.state.appointments.find((a) => a.id === Number(params.id) && a.status === 'active')
    if (!appointment) return apiError(404, 'appointment_not_found', 'Запись не найдена')
    const { centerId, date } = decodeSlot(appointment.slotId)
    appointment.status = 'completed'
    db.state.donations.push({
      id: db.nextId(),
      type: appointment.donationType,
      date: new Date(date).toISOString(),
      centerName: findCenter(centerId)?.name ?? '',
    })
    db.save()
    return HttpResponse.json({})
  }),

  http.get(`${BASE}/health`, () => HttpResponse.json({ status: 'ok' })),
]
