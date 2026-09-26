import { delay, HttpResponse } from 'msw'

import type { ErrorCode } from '../types'

export const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Имитация сети. */
export const latency = () => delay(350)

/** Ошибка в формате Error из openapi.yaml: fields всегда есть, null — если не 422 формы. */
export const apiError = (status: number, code: ErrorCode, message: string, fields: Record<string, string> | null = null) =>
  HttpResponse.json({ error: { code, message, fields } }, { status })

/**
 * Принудительные ошибки для проверки состояний «Ошибка загрузки».
 * В консоли: localStorage.setItem('kaplya:mock-fail', 'appointments,me/donations'), затем обновить страницу.
 */
export const shouldFail = (path: string): boolean => {
  const rules = localStorage.getItem('kaplya:mock-fail')
  return Boolean(rules?.split(',').some((rule) => rule.trim() && path.includes(rule.trim())))
}
