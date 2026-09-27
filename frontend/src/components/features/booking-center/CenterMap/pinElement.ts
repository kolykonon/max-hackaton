import type { StockStatus } from '@/content/types'

import styles from './CenterMap.module.scss'

// Иконка MapPin из lucide: остриё внизу по центру — туда и смотрит anchor маркера
const PIN_SVG =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" stroke="#fff" stroke-width="1.5" aria-hidden="true">' +
  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>' +
  '<circle cx="12" cy="10" r="3" fill="#fff"/></svg>'

/** DOM-элемент метки центра для Marker из MapLibre. */
export const createPinElement = (name: string, status: StockStatus, onSelect: () => void): HTMLButtonElement => {
  const element = document.createElement('button')
  element.type = 'button'
  element.className = `${styles['center-map__pin']} ${styles[`center-map__pin--${status}`]}`
  element.setAttribute('aria-label', name)
  element.innerHTML = PIN_SVG
  element.addEventListener('click', (event) => {
    // Не даём клику дойти до карты
    event.stopPropagation()
    onSelect()
  })
  return element
}

export const setPinSelected = (element: HTMLElement, selected: boolean) => {
  element.classList.toggle(styles['center-map__pin--selected'], selected)
  element.setAttribute('aria-pressed', String(selected))
}
