import { getInitData, isInsideMax } from '@/bridge/max'

import type { ApiErrorBody, ErrorCode } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Ошибка API в формате { error: { code, message, fields } } (ТЗ §6). */
export class ApiError extends Error {
  readonly status: number
  /** Код из ErrorCode либо network_error, если ответа нет. */
  readonly code: ErrorCode | 'network_error'
  readonly fields: Record<string, string> | null

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error.message ?? `HTTP ${status}`)
    this.status = status
    this.code = body?.error.code ?? (status === 0 ? 'network_error' : 'internal_error')
    this.fields = body?.error.fields ?? null
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

/** Имя файла из Content-Disposition: сначала filename* (UTF-8), потом filename. */
const fileNameOf = (header: string | null, fallback: string): string => {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header ?? '')?.[1]
  if (encoded) return decodeURIComponent(encoded)
  return /filename="?([^";]+)"?/i.exec(header ?? '')?.[1] ?? fallback
}

/** POST, который отвечает файлом (заявление PDF/DOCX). Ошибки — как у request. */
export const requestFile = async (
  path: string,
  { params, body, fallbackName }: { params?: QueryParams; body?: unknown; fallbackName: string },
): Promise<{ blob: Blob; fileName: string }> => {
  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
  } catch {
    throw new ApiError(0, null)
  }
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(response.status, errorBody)
  }
  return { blob: await response.blob(), fileName: fileNameOf(response.headers.get('Content-Disposition'), fallbackName) }
}

export const api = {
  get: <T>(path: string, params?: QueryParams) => request<T>(path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  postWithParams: <T>(path: string, params: QueryParams, body?: unknown) =>
    request<T>(path, { method: 'POST', params, body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
}
