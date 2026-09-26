import { http } from 'msw'
import { setupWorker } from 'msw/browser'

import { bookingHandlers } from './handlers/booking'
import { demoHandlers } from './handlers/demo'
import { meHandlers } from './handlers/me'
import { apiError, BASE, shouldFail } from './utils'

/** Первым идёт перехватчик принудительных ошибок — см. shouldFail. */
const failureHandler = http.all(`${BASE}/*`, ({ request }) => {
  if (shouldFail(new URL(request.url).pathname)) return apiError(500, 'internal_error', 'Принудительная ошибка мока')
  return undefined
})

export const worker = setupWorker(failureHandler, ...meHandlers, ...bookingHandlers, ...demoHandlers)

