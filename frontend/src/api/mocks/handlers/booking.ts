import { http, HttpResponse } from 'msw'

import { BLOOD_GROUPS } from '@/content/bloodGroups'
import type { BloodGroup, DonationType } from '@/content/types'
import { addDays, parseISODate, startOfDay, toISODate } from '@/utils/format'

import type {
  Appointment,
  AppointmentResponse,
  BookingCenter,
  BookingDates,
  BookingSlots,
  MapCenter,
  MapStatus,
  Region,
  SlotPeriod,
} from '../../types'
import { REGIONS } from '../fixtures'
import { centersOf, db, decodeSlot, encodeSlot, findCenter, MOSCOW_ID } from '../db'
import { getNextAllowed } from '../logic'
import { apiError, BASE, latency } from '../utils'

const WINDOW_DAYS = 61
const STATUSES = ['urgent', 'low', 'enough'] as const

const toRegion = (r: (typeof REGIONS)[number]): Region => ({
  id: r.id,
  code: r.code,
  name: r.name,
  has_centers: r.hasCenters,
})

const TIMES = Array.from({ length: 24 }, (_, i) => {
  const minutes = 8 * 60 + i * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

const takenSlotIds = () => new Set(db.state.appointments.filter((a) => a.status === 'active').map((a) => a.slotId))

const isBusyByDemo = (centerId: number, date: string, time: string) => {
  const day = parseISODate(date).getDate()
  if (day === 7 || day === 21) return true
  return (centerId * 7 + day * 3 + Number(time.replace(':', ''))) % 3 === 0
}

const slotsFor = (centerId: number, donationType: DonationType, date: string) => {
  const taken = takenSlotIds()
  const isWorkday = parseISODate(date).getDay() !== 0
  return TIMES.map((time) => {
    const id = encodeSlot(centerId, donationType, date, time)
    return {
      id,
      starts_at: `${date}T${time}:00+03:00`,
      local_time: time,
      is_free: isWorkday && !isBusyByDemo(centerId, date, time) && !taken.has(id),
    }
  })
}

const periodOf = (time: string): SlotPeriod => {
  const hour = Number(time.slice(0, 2))
  if (hour < 12) return 'morning'
  return hour < 17 ? 'day' : 'evening'
}

const freeSlotsCount = (centerId: number, donationType: DonationType, date: string) =>
  slotsFor(centerId, donationType, date).filter((s) => s.is_free).length

const toAppointment = (id: number, slotId: number, donationType: DonationType): Appointment => {
  const { centerId, date, time } = decodeSlot(slotId)
  const center = findCenter(centerId)!
  return {
    id,
    donation_type: donationType,
    starts_at: `${date}T${time}:00+03:00`,
    local_date: date,
    local_time: time,
    center: { id: center.id, name: center.name, address: center.address, region_id: center.regionId },
  }
}

/** Проверки из ТЗ §5.5. Возвращает ответ с ошибкой или null. */
const checkBooking = (slotId: number, ignoreAppointmentId?: number) => {
  const { centerId, donationType, date, time } = decodeSlot(slotId)
  if (!findCenter(centerId) || !TIMES.includes(time)) return apiError(404, 'slot_not_found', 'Слот не найден')
  if (parseISODate(date) < startOfDay(new Date())) return apiError(404, 'slot_not_found', 'Слот в прошлом')
  const takenByOther = db.state.appointments.some(
    (a) => a.status === 'active' && a.slotId === slotId && a.id !== ignoreAppointmentId,
  )
  if (takenByOther || isBusyByDemo(centerId, date, time)) return apiError(409, 'slot_taken', 'Это время уже заняли')
  if (parseISODate(date) < getNextAllowed(db.state.donations)[donationType]) {
    return apiError(422, 'interval_not_passed', 'Интервал после прошлой донации ещё не прошёл')
  }
  const missing = Object.values(db.state.personalData).some((value) => !String(value).trim())
  if (missing) return apiError(422, 'personal_data_incomplete', 'Заполните личные данные')
  return null
}

export const bookingHandlers = [
  http.get(`${BASE}/regions`, async () => {
    await latency()
    return HttpResponse.json(REGIONS.map(toRegion))
  }),

  http.get(`${BASE}/regions/locate`, async () => {
    await latency()
    return HttpResponse.json({ region: toRegion(REGIONS.find((r) => r.id === MOSCOW_ID)!) })
  }),

  http.get(`${BASE}/map/status`, async () => {
    await latency()
    const regions: MapStatus['regions'] = REGIONS.map((r) => {
      // ~10% регионов без данных
      if (r.id % 10 === 3) return { code: r.code, statuses: {}, worst: null }
      const statuses = Object.fromEntries(
        BLOOD_GROUPS.map((group, i) => [group, STATUSES[(r.id + i * 2) % 3]]),
      ) as Record<BloodGroup, (typeof STATUSES)[number]>
      const worst = STATUSES.find((s) => Object.values(statuses).includes(s)) ?? null
      return { code: r.code, statuses, worst }
    })
    return HttpResponse.json({ updated_at: addDays(new Date(), -1).toISOString(), regions })
  }),

  http.get(`${BASE}/map/centers`, async () => {
    await latency()
    const centers: MapCenter[] = REGIONS.flatMap((region) => centersOf(region.id)).map((center) => {
      // Статусы центра детерминированно «плавают» вокруг статуса его группы пользователя
      const statuses = Object.fromEntries(
        BLOOD_GROUPS.map((group, i) => [group, STATUSES[(center.id + i) % 3]]),
      ) as Record<BloodGroup, (typeof STATUSES)[number]>
      statuses['2+'] = center.groupStatus
      const worst = STATUSES.find((s) => Object.values(statuses).includes(s)) ?? null
      return {
        id: center.id,
        name: center.name,
        address: center.address,
        lat: center.lat,
        lon: center.lon,
        region_id: center.regionId,
        city: null,
        center_type: null,
        phone: null,
        work_hours: null,
        booking_info: null,
        donation_types: null,
        donor_requirements: null,
        notes: null,
        data_status: null,
        source_url: null,
        source_url_2: null,
        verified_on: null,
        statuses,
        worst,
      }
    })
    return HttpResponse.json(centers)
  }),

  http.get(`${BASE}/booking/dates`, async ({ request }) => {
    await latency()
    const url = new URL(request.url)
    const regionId = Number(url.searchParams.get('region_id'))
    const type = url.searchParams.get('donation_type') as DonationType
    const today = startOfDay(new Date())
    const earliest = getNextAllowed(db.state.donations)[type]
    const centers = centersOf(regionId)
    const days = Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const date = toISODate(addDays(today, i))
      const available = addDays(today, i) >= earliest && centers.some((c) => freeSlotsCount(c.id, type, date) > 0)
      return { date, available }
    })
    const result: BookingDates = {
      from: toISODate(today),
      to: toISODate(addDays(today, WINDOW_DAYS - 1)),
      earliest_allowed: toISODate(earliest),
      first_available: days.find((d) => d.available)?.date ?? null,
      days,
    }
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/booking/centers`, async ({ request }) => {
    await latency()
    const url = new URL(request.url)
    const regionId = Number(url.searchParams.get('region_id'))
    const date = url.searchParams.get('date')!
    const type = url.searchParams.get('donation_type') as DonationType
    const hasGeo = url.searchParams.has('lat')
    const pinId = Number(url.searchParams.get('pin_center_id'))
    const centers: BookingCenter[] = centersOf(regionId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        lat: c.lat,
        lon: c.lon,
        photo_url: null,
        free_slots: freeSlotsCount(c.id, type, date),
        distance_km: hasGeo ? c.distanceKm : null,
        group_status: c.groupStatus,
      }))
      .filter((c) => c.free_slots > 0)
      .sort((a, b) => {
        if (a.id === pinId) return -1
        if (b.id === pinId) return 1
        if ((a.group_status === 'urgent') !== (b.group_status === 'urgent')) return a.group_status === 'urgent' ? -1 : 1
        return hasGeo ? (a.distance_km ?? 0) - (b.distance_km ?? 0) : a.name.localeCompare(b.name, 'ru')
      })
    return HttpResponse.json(centers)
  }),

  http.get(`${BASE}/booking/slots`, async ({ request }) => {
    await latency()
    const url = new URL(request.url)
    const centerId = Number(url.searchParams.get('center_id'))
    const type = url.searchParams.get('donation_type') as DonationType
    const date = url.searchParams.get('date')!
    const center = findCenter(centerId)
    if (!center) return apiError(404, 'not_found', 'Центр не найден')
    const groups = (['morning', 'day', 'evening'] as SlotPeriod[])
      .map((period) => ({ period, slots: slotsFor(centerId, type, date).filter((s) => periodOf(s.local_time) === period) }))
      .filter((group) => group.slots.length > 0)
    const result: BookingSlots = { center: { id: center.id, name: center.name, address: center.address }, date, groups }
    return HttpResponse.json(result)
  }),

  http.get(`${BASE}/appointments/current`, async () => {
    await latency()
    const active = db.activeAppointment()
    const result: AppointmentResponse = { appointment: active ? toAppointment(active.id, active.slotId, active.donationType) : null }
    return HttpResponse.json(result)
  }),

  http.post(`${BASE}/appointments`, async ({ request }) => {
    await latency()
    const { slot_id: slotId } = (await request.json()) as { slot_id: number }
    if (db.activeAppointment()) return apiError(409, 'active_exists', 'У вас уже есть запись')
    const error = checkBooking(slotId)
    if (error) return error
    const appointment = { id: db.nextId(), slotId, donationType: decodeSlot(slotId).donationType, status: 'active' as const }
    db.state.appointments.push(appointment)
    db.save()
    const result: AppointmentResponse = { appointment: toAppointment(appointment.id, slotId, appointment.donationType) }
    return HttpResponse.json(result, { status: 201 })
  }),

  http.post(`${BASE}/appointments/:id/reschedule`, async ({ params, request }) => {
    await latency()
    const { slot_id: slotId } = (await request.json()) as { slot_id: number }
    const current = db.state.appointments.find((a) => a.id === Number(params.id))
    if (!current) return apiError(404, 'appointment_not_found', 'Запись не найдена')
    if (current.status !== 'active') return apiError(409, 'appointment_not_active', 'Запись уже неактивна')
    const error = checkBooking(slotId, current.id)
    if (error) return error
    current.status = 'rescheduled'
    const appointment = { id: db.nextId(), slotId, donationType: decodeSlot(slotId).donationType, status: 'active' as const }
    db.state.appointments.push(appointment)
    db.save()
    const result: AppointmentResponse = { appointment: toAppointment(appointment.id, slotId, appointment.donationType) }
    return HttpResponse.json(result, { status: 201 })
  }),

  http.post(`${BASE}/appointments/:id/cancel`, async ({ params }) => {
    await latency()
    const current = db.state.appointments.find((a) => a.id === Number(params.id))
    if (!current) return apiError(404, 'appointment_not_found', 'Запись не найдена')
    if (current.status !== 'active') return apiError(409, 'appointment_not_active', 'Запись уже неактивна')
    current.status = 'cancelled'
    db.save()
    const result: AppointmentResponse = { appointment: null }
    return HttpResponse.json(result)
  }),
]
