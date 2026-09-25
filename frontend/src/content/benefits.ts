import { Briefcase, CalendarDays, Coins, House, Luggage, ShieldPlus, Stethoscope, Utensils } from 'lucide-react'

import type { IconItem } from './types'

export const DONATION_BENEFITS: IconItem[] = [
  {
    icon: Briefcase,
    tone: 'blue',
    title: 'Освобождение от работы в день донации',
    description: 'С сохранением среднего заработка',
  },
  {
    icon: CalendarDays,
    tone: 'green',
    title: 'Дополнительный оплачиваемый день отдыха',
    description: 'Можно взять сразу, присоединить к отпуску или использовать в течение года',
  },
  {
    icon: Stethoscope,
    tone: 'red',
    title: 'Бесплатное медобследование',
    description: 'Перед донацией проверят группу крови, резус-фактор, гемоглобин и инфекции',
  },
  {
    icon: Utensils,
    tone: 'yellow',
    title: 'Бесплатное питание',
    description: 'В день донации. Или денежная компенсация вместо питания',
  },
]

export const HONORARY_BENEFITS: IconItem[] = [
  { icon: Coins, tone: 'red', title: 'Ежегодная выплата', description: '19 497,68 ₽ в 2026 году' },
  { icon: ShieldPlus, tone: 'blue', title: 'Медицинская помощь вне очереди', description: 'В государственных медучреждениях' },
  {
    icon: Luggage,
    tone: 'green',
    title: 'Отпуск в удобное время',
    description: 'Работодатель предоставляет ежегодный отпуск, когда вам удобно',
  },
  { icon: House, tone: 'purple', title: 'Льготные путёвки в санаторий', description: 'Право купить в первую очередь' },
]

export const HONORARY_SHORT_BENEFITS = [
  'ежегодную выплату — 19 497,68 ₽ в 2026 году',
  'медицинскую помощь вне очереди в государственных медучреждениях',
  'отпуск в удобное для вас время',
  'первоочередную покупку льготных путёвок в санаторий',
]

export const HONORARY_CONDITION = 'Звание дают, если вы сдали кровь 40 раз или плазму 60 раз.'

export const HONORARY_CONDITION_FULL =
  'Звание дают, если вы сдали кровь 40 раз или плазму 60 раз. Засчитываются и смешанные донации: 40, если из них не меньше 25 крови, или 60, если крови меньше 25.'

export const BENEFITS_FOOTNOTE =
  'По 125-ФЗ «О донорстве крови и её компонентов» и ст. 186 ТК РФ. Сумма выплаты указана на 2026 год.'
