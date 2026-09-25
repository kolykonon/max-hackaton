import type { LucideIcon } from 'lucide-react'

export type DonationType = 'whole_blood' | 'plasma'
export type DonationKind = DonationType | 'mixed'

export type StockStatus = 'urgent' | 'low' | 'enough' | 'none'

export type BloodGroup = '1+' | '1-' | '2+' | '2-' | '3+' | '3-' | '4+' | '4-'

export type Tone = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'gray'

export interface IconItem {
  icon: LucideIcon
  tone: Tone
  title: string
  description?: string
}
