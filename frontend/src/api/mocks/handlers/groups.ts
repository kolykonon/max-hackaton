import { http, HttpResponse } from 'msw'

import type { DonationType } from '@/content/types'
import { addDays, parseISODate, startOfDay, toISODate } from '@/utils/format'

import type { Group, GroupCreate } from '../../types'
import { centersOf, db, decodeSlot, findCenter, type MockGroup, MOSCOW_ID } from '../db'
import { getNextAllowed } from '../logic'
import { apiError, BASE, latency } from '../utils'
import { freeSlotsCount, setDemoGroupSlot, slotsFor } from './booking'

/** Демо-группа ?startapp=grp_demo: Мария собрала группу в первый центр Москвы на ближайший день, когда можно и вам. */
const DEMO_GROUP_CODE = 'demo'

const demoGroupDay = () => {
  setDemoGroupSlot(null)
  const center = centersOf(MOSCOW_ID)[0]
  let day = addDays(startOfDay(new Date()), 1)
  const earliest = getNextAllowed(db.state.donations).whole_blood
  if (day < earliest) day = earliest
  for (;;) {
    const date = toISODate(day)
    const free = slotsFor(center.id, 'whole_blood', date).filter((slot) => slot.is_free)
    // Нужен день, где у Марии есть время и рядом остаётся свободное
    if (free.length > 1) {
      setDemoGroupSlot(free[0].id)
      return { centerId: center.id, date, time: free[0].local_time }
    }
    day = addDays(day, 1)
  }
}

const myBookingIn = (group: { centerId: number; date: string; donationType: DonationType }) => {
  const active = db.activeAppointment()
  if (!active) return null
  const slot = decodeSlot(active.slotId)
  return slot.centerId === group.centerId && slot.date === group.date && active.donationType === group.donationType
    ? slot.time
    : null
}

const toGroup = (mock: MockGroup): Group => {
  const center = findCenter(mock.centerId)!
  const myTime = myBookingIn(mock)
  const me = { name: 'Иван И.', photo_url: null, is_owner: mock.isOwner, is_booked: myTime !== null, booked_time: myTime }
  const members =
    mock.code === DEMO_GROUP_CODE
      ? [
          { name: 'Мария К.', photo_url: null, is_owner: true, is_booked: true, booked_time: demoGroupDay().time },
          { name: 'Пётр С.', photo_url: null, is_owner: false, is_booked: false, booked_time: null },
          ...(mock.isMember ? [me] : []),
        ]
      : [me]
  return {
    code: mock.code,
    center: { id: center.id, name: center.name, address: center.address, region_id: center.regionId },
    date: mock.date,
    donation_type: mock.donationType,
    owner_name: mock.code === DEMO_GROUP_CODE ? 'Мария К.' : 'Иван И.',
    members,
    members_count: members.length,
    donated_count: 0,
    is_member: mock.isMember,
    is_owner: mock.isOwner,
    is_booked: myTime !== null,
    is_past: parseISODate(mock.date) < startOfDay(new Date()),
    free_slots: freeSlotsCount(mock.centerId, mock.donationType, mock.date),
    link: `https://max.ru/kaplya_bot?startapp=grp_${mock.code}`,
    share_text: `Пойдём сдавать кровь вместе? ${mock.date}, «${center.name}». Присоединяйся:`,
  }
}

/** Прошедшая демо-группа «коллеги»: сдали 4 из 5 — для блока «Прошедшие» в «Мои группы». */
const PAST_DEMO_CODE = 'office'

const pastDemoGroup = (): Group => {
  const center = centersOf(MOSCOW_ID)[0]
  const date = toISODate(addDays(startOfDay(new Date()), -40))
  const colleague = (name: string, time: string | null) => ({
    name,
    photo_url: null,
    is_owner: false,
    is_booked: time !== null,
    booked_time: time,
  })
  const members = [
    { name: 'Иван И.', photo_url: null, is_owner: true, is_booked: true, booked_time: '09:00' },
    colleague('Анна С.', '09:15'),
    colleague('Олег В.', '09:30'),
    colleague('Мария К.', '10:00'),
    colleague('Дмитрий Р.', null),
  ]
  return {
    code: PAST_DEMO_CODE,
    center: { id: center.id, name: center.name, address: center.address, region_id: center.regionId },
    date,
    donation_type: 'whole_blood',
    owner_name: 'Иван И.',
    members,
    members_count: members.length,
    donated_count: 4,
    is_member: true,
    is_owner: true,
    is_booked: true,
    is_past: true,
    free_slots: 0,
    link: `https://max.ru/kaplya_bot?startapp=grp_${PAST_DEMO_CODE}`,
    share_text: `Пойдём сдавать кровь вместе? ${date}, «${center.name}». Присоединяйся:`,
  }
}

const findGroup = (code: string): MockGroup | null => {
  const saved = db.state.groups.find((g) => g.code === code)
  if (saved) return saved
  if (code !== DEMO_GROUP_CODE) return null
  const { centerId, date } = demoGroupDay()
  return { code, centerId, date, donationType: 'whole_blood', isOwner: false, isMember: false }
}

export const groupHandlers = [
  http.post(`${BASE}/groups`, async ({ request }) => {
    await latency()
    const body = (await request.json()) as GroupCreate
    const code = `my-${body.center_id}-${body.date}-${body.donation_type}`
    let group = db.state.groups.find((g) => g.code === code)
    if (!group) {
      group = { code, centerId: body.center_id, date: body.date, donationType: body.donation_type, isOwner: true, isMember: true }
      db.state.groups.push(group)
      db.save()
    }
    return HttpResponse.json(toGroup(group), { status: 201 })
  }),

  http.get(`${BASE}/groups/my`, async ({ request }) => {
    await latency()
    const past = new URL(request.url).searchParams.get('past') === 'true'
    const today = startOfDay(new Date())
    const mine = db.state.groups
      .filter((g) => g.isMember && parseISODate(g.date) < today === past)
      .sort((a, b) => (past ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
      .map(toGroup)
    return HttpResponse.json(past ? [...mine, pastDemoGroup()] : mine)
  }),

  http.get(`${BASE}/groups/:code`, async ({ params }) => {
    await latency()
    if (params.code === PAST_DEMO_CODE) return HttpResponse.json(pastDemoGroup())
    const group = findGroup(String(params.code))
    if (!group) return apiError(404, 'group_not_found', 'Группа не найдена')
    return HttpResponse.json(toGroup(group))
  }),

  http.post(`${BASE}/groups/:code/join`, async ({ params }) => {
    await latency()
    const group = findGroup(String(params.code))
    if (!group) return apiError(404, 'group_not_found', 'Группа не найдена')
    if (parseISODate(group.date) < startOfDay(new Date())) return apiError(409, 'group_closed', 'Дата группы уже прошла')
    if (!group.isMember) {
      group.isMember = true
      if (!db.state.groups.includes(group)) db.state.groups.push(group)
      db.save()
    }
    return HttpResponse.json(toGroup(group))
  }),
]
