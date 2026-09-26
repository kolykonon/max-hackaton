import { useQuery } from '@tanstack/react-query'

import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { LocateRegionResponse, MapStatus, Region } from '../types'

export const useRegions = () =>
  useQuery({ queryKey: queryKeys.regions, queryFn: () => api.get<Region[]>('/regions'), staleTime: Infinity })

export const useLocateRegion = (coords: { lat: number; lon: number } | null) =>
  useQuery({
    queryKey: queryKeys.locate(coords?.lat ?? 0, coords?.lon ?? 0),
    queryFn: () => api.get<LocateRegionResponse>('/regions/locate', { lat: coords!.lat, lon: coords!.lon }),
    enabled: coords !== null,
  })

export const useMapStatus = () =>
  useQuery({ queryKey: queryKeys.mapStatus, queryFn: () => api.get<MapStatus>('/map/status') })
