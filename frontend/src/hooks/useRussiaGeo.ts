import { useQuery } from '@tanstack/react-query'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'

// ?url — Vite кладёт файл в /assets с хешем в имени, Caddy отдаёт его с долгим кешем
import russiaTopoUrl from '@/assets/geo/russia.topo.json?url'

export type RegionFeature = Feature<Polygon | MultiPolygon, { code: string }>

/**
 * Контуры 89 субъектов (scripts/build_russia_map.py). Грузятся при первом открытии карты,
 * дальше берутся из кеша TanStack Query и браузера. У каждого региона code = Region.code из API.
 */
export const useRussiaGeo = () =>
  useQuery({
    queryKey: ['geo', 'russia'],
    queryFn: async () => {
      const response = await fetch(russiaTopoUrl)
      if (!response.ok) throw new Error(`Не удалось загрузить карту: ${response.status}`)
      const topology = (await response.json()) as Topology
      return feature(topology, topology.objects.russia) as FeatureCollection<Polygon | MultiPolygon, { code: string }>
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
