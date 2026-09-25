type ClassValue = string | false | null | undefined

/** Склеивает классы, пропуская пустые значения. */
export const cn = (...classes: ClassValue[]): string => classes.filter(Boolean).join(' ')
