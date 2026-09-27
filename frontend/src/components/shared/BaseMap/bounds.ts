import type { Geometry, Position } from 'geojson'
import type { LngLatBoundsLike } from 'maplibre-gl'

/** Россия целиком. Восточная граница за 180°, чтобы Чукотка не разрезалась. */
export const RUSSIA_BOUNDS: LngLatBoundsLike = [
  [19, 41],
  [191, 78],
]

const positions = (geometry: Geometry): Position[] => {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates]
    case 'MultiPoint':
    case 'LineString':
      return geometry.coordinates
    case 'Polygon':
    case 'MultiLineString':
      return geometry.coordinates.flat()
    case 'MultiPolygon':
      return geometry.coordinates.flat(2)
    default:
      return []
  }
}

/**
 * Границы геометрии для fitBounds. Если объект пересекает 180-й меридиан (Чукотка),
 * западные долготы сдвигаем на +360, иначе карта отдалилась бы на весь мир.
 */
export const geometryBounds = (geometry: Geometry): LngLatBoundsLike | null => {
  const points = positions(geometry)
  if (points.length === 0) return null
  let lons = points.map(([lon]) => lon)
  if (Math.max(...lons) - Math.min(...lons) > 180) lons = lons.map((lon) => (lon < 0 ? lon + 360 : lon))
  const lats = points.map(([, lat]) => lat)
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ]
}
