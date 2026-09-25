// Обёртка над MAX Bridge (window.WebApp): https://dev.max.ru/docs/webapps/bridge
// Вне MAX все методы работают как заглушки, чтобы приложение открывалось в обычном браузере.

type HapticImpact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type HapticNotification = 'error' | 'success' | 'warning'

interface MaxWebApp {
  initData: string
  initDataUnsafe: {
    start_param?: string
    user?: { id: number; first_name: string; last_name?: string; photo_url?: string }
  }
  platform: 'ios' | 'android' | 'desktop' | 'web'
  openLink: (url: string) => void
  openMaxLink: (url: string) => void
  shareMaxContent: (params: { text?: string; link?: string }) => Promise<unknown>
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: HapticImpact, disableVibrationFallback?: boolean) => void
    notificationOccurred: (type: HapticNotification, disableVibrationFallback?: boolean) => void
    selectionChanged: (disableVibrationFallback?: boolean) => void
  }
}

declare global {
  interface Window {
    WebApp?: MaxWebApp
  }
}

const webApp = (): MaxWebApp | undefined => window.WebApp

/** Открыто ли приложение внутри MAX. Скрипт Bridge определяет WebApp и в браузере, но без initData. */
export const isInsideMax = (): boolean => Boolean(webApp()?.initData)

export const getInitData = (): string => webApp()?.initData ?? ''

/** Параметр запуска: `appointment` или `ref_<code>`. Вне MAX читаем ?startapp= для отладки. */
export const getStartParam = (): string | null =>
  webApp()?.initDataUnsafe.start_param ?? new URLSearchParams(window.location.search).get('startapp')

/** Внешняя ссылка: в MAX — во внешнем браузере, иначе в новой вкладке. */
export const openLink = (url: string): void => {
  if (isInsideMax()) webApp()!.openLink(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

/** «Поделиться» внутри MAX. Вне MAX — системное меню или копирование ссылки. */
export const shareContent = async (params: { text: string; link: string }): Promise<'shared' | 'copied'> => {
  if (isInsideMax()) {
    await webApp()!.shareMaxContent(params)
    return 'shared'
  }
  if (navigator.share) {
    await navigator.share({ text: params.text, url: params.link })
    return 'shared'
  }
  await navigator.clipboard.writeText(params.link)
  return 'copied'
}

export const haptic = {
  selection: () => webApp()?.HapticFeedback.selectionChanged(true),
  impact: (style: HapticImpact = 'light') => webApp()?.HapticFeedback.impactOccurred(style, true),
  notification: (type: HapticNotification) => webApp()?.HapticFeedback.notificationOccurred(type, true),
}

export const backButton = {
  show: (onClick: () => void) => {
    const button = webApp()?.BackButton
    if (!isInsideMax() || !button) return () => undefined
    button.onClick(onClick)
    button.show()
    return () => {
      button.offClick(onClick)
      button.hide()
    }
  },
}
