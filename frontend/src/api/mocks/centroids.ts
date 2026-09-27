import { geoCentroid } from 'd3-geo'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'

import russiaTopoUrl from '@/assets/geo/russia.topo.json?url'

/** Центры регионов по файлу карты — куда моки ставят областные станции переливания. */
export const loadRegionCentroids = async (): Promise<Map<string, [number, number]>> => {
  const topology = (await (await fetch(russiaTopoUrl)).json()) as Topology
  const regions = feature(topology, topology.objects.russia) as FeatureCollection<Polygon | MultiPolygon, { code: string }>
  return new Map(regions.features.map((region) => [region.properties.code, geoCentroid(region) as [number, number]]))
}
