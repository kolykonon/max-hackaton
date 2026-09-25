import { delay, HttpResponse } from 'msw'

export const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Имитация сети. */
export const latency = () => delay(350)

export const apiError = (status: number, code: string, message: string, fields?: Record<string, string>) =>
  HttpResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status })

/**
 * Принудительные ошибки для проверки состояний «Ошибка загрузки».
 * В консоли: localStorage.setItem('kaplya:mock-fail', 'appointments,me/donations'), затем обновить страницу.
 */
export const shouldFail = (path: string): boolean => {
  const rules = localStorage.getItem('kaplya:mock-fail')
  return Boolean(rules?.split(',').some((rule) => rule.trim() && path.includes(rule.trim())))
}
