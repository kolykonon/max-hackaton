import { geoConicEqualArea, type GeoProjection } from 'd3-geo'
import type { GeoJSON } from 'geojson'

/**
 * Равновеликая коническая проекция, как на школьных картах России.
 * Поворот на 100° в.д. убирает разрыв на 180-м меридиане (Чукотка).
 */
export const createProjection = (
  fitTo: GeoJSON,
  width: number,
  height: number,
  padding: number,
): GeoProjection =>
  geoConicEqualArea()
    .rotate([-100, 0])
    .parallels([52, 64])
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      fitTo,
    )
