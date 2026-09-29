const normalize = (value: string) => value.trim().toLowerCase().replaceAll('ё', 'е')

/** Поиск по названию без учёта регистра и «ё». */
export const matchesQuery = (name: string, query: string): boolean => normalize(name).includes(normalize(query))
