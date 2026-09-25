import { getInitData, isInsideMax } from '@/bridge/max'

import type { ApiErrorBody } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Ошибка API в формате { error: { code, message, fields } } (ТЗ §6). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error.message ?? `HTTP ${status}`)
    this.status = status
    this.code = body?.error.code ?? (status === 0 ? 'network_error' : 'unknown_error')
    this.fields = body?.error.fields
  }
}

/** Заголовки авторизации: initData из MAX или X-Dev-User-Id при локальной разработке (ТЗ §3). */
const authHeaders = (): Record<string, string> => {
  if (isInsideMax()) return { 'X-Max-Init-Data': getInitData() }
  const devUserId = import.meta.env.VITE_DEV_USER_ID
  return devUserId ? { 'X-Dev-User-Id': devUserId } : {}
}

type QueryParams = Record<string, string | number | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  params?: QueryParams
  body?: unknown
}

const buildUrl = (path: string, params?: QueryParams): string => {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) search.set(key, String(value))
  })
  const query = search.toString()
  return `${BASE_URL}${path}${query ? `?${query}` : ''}`
}

export const request = async <T>(path: string, { method = 'GET', params, body }: RequestOptions = {}): Promise<T> => {
  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: {
        ...authHeaders(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, null)
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(response.status, errorBody)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, params?: QueryParams) => request<T>(path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
}
