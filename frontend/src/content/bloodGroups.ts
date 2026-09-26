import type { BloodGroup } from './types'

export const BLOOD_GROUPS: BloodGroup[] = ['1+', '1-', '2+', '2-', '3+', '3-', '4+', '4-']

/** 1 = O(I), 2 = A(II), 3 = B(III), 4 = AB(IV) — ТЗ §4. */
const ABO = { '1': 'O(I)', '2': 'A(II)', '3': 'B(III)', '4': 'AB(IV)' } as const

export const getAbo = (group: BloodGroup): string => ABO[group[0] as keyof typeof ABO]

export const getRhesus = (group: BloodGroup): string => (group.endsWith('+') ? 'Rh+' : 'Rh−')

export const BLOOD_GROUP_NAMES: Record<BloodGroup, string> = Object.fromEntries(
  BLOOD_GROUPS.map((group) => [group, `${getAbo(group)} ${group.endsWith('+') ? 'положительная' : 'отрицательная'}`]),
) as Record<BloodGroup, string>
