import { Coffee, IdCard, Sandwich, WineOff } from 'lucide-react'

import type { IconItem } from './types'

export const PREPARATION: IconItem[] = [
  { icon: WineOff, tone: 'blue', title: 'Не пейте алкоголь за 2 дня до донации' },
  { icon: Sandwich, tone: 'blue', title: 'Накануне не ешьте жирное, жареное, острое и копчёное' },
  { icon: Coffee, tone: 'blue', title: 'Утром легко позавтракайте' },
  { icon: IdCard, tone: 'blue', title: 'Возьмите паспорт' },
]
