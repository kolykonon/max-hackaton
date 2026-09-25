import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BloodGroupStrip } from '@/components/features/map/BloodGroupStrip/BloodGroupStrip'
import { MapControls } from '@/components/features/map/MapControls/MapControls'
import { getZoneStatus, hasZoneData } from '@/components/features/map/utils'
import { ZonePanel } from '@/components/features/map/ZonePanel/ZonePanel'
import { ZoneSpot } from '@/components/features/map/ZoneSpot/ZoneSpot'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { MapPlaceholder } from '@/components/shared/MapPlaceholder/MapPlaceholder'
import { StatusLegend } from '@/components/shared/StatusLegend/StatusLegend'
import { Toast } from '@/components/shared/Toast/Toast'
import { DEMO_USER, MAP_ZONES } from '@/content/demo'
import type { BloodGroup } from '@/content/types'
import { useToast } from '@/hooks/useToast'
import { formatDayMonth } from '@/utils/format'

import styles from './MapPage.module.scss'

// Положение зон на заглушке карты: Москва внутри МО, НАО на севере
const SPOTS: Record<string, { x: number; y: number; size: number }> = {
  'RU-MOS': { x: 30, y: 55, size: 34 },
  'RU-MOW': { x: 30, y: 55, size: 12 },
  'RU-NEN': { x: 62, y: 22, size: 22 },
}

/** Экран «Карта» — донорский светофор. Нижнее меню скрыто. */
export const MapPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const userGroup = DEMO_USER.bloodGroup
  const [zoneCode, setZoneCode] = useState('RU-MOW')
  const [group, setGroup] = useState<BloodGroup | null>(userGroup)

  const zone = MAP_ZONES.find((item) => item.code === zoneCode) ?? MAP_ZONES[0]
  // Повторное нажатие на выбранную группу снимает выбор
  const toggleGroup = (value: BloodGroup) => setGroup((current) => (current === value ? null : value))

  return (
    <Screen
      header={<PageHeader title="Карта" onBack={() => navigate('/home')} />}
      flush
      contentClassName={styles['map-page']}
    >
      <div className={styles['map-page__map']}>
        <MapPlaceholder alt="Карта России с донорским светофором">
          {/* Крупные зоны рисуем раньше, чтобы Москва была поверх области */}
          {[...MAP_ZONES]
            .sort((a, b) => SPOTS[b.code].size - SPOTS[a.code].size)
            .map((item) => (
              <ZoneSpot
                key={item.code}
                name={item.name}
                status={getZoneStatus(item, group)}
                selected={item.code === zoneCode}
                {...SPOTS[item.code]}
                onSelect={() => setZoneCode(item.code)}
              />
            ))}
          <MapControls
            onZoomIn={() => undefined}
            onZoomOut={() => undefined}
            onLocate={() => toast.show('Не удалось определить местоположение')}
          />
        </MapPlaceholder>
      </div>
      <div className={styles['map-page__legend']}>
        <StatusLegend withNoData />
      </div>
      <ZonePanel name={zone.name} updatedAt={formatDayMonth(zone.updatedAt)} hasData={hasZoneData(zone)}>
        <BloodGroupStrip statuses={zone.statuses} selected={group} userGroup={userGroup} onToggle={toggleGroup} />
      </ZonePanel>
      <Toast message={toast.message} />
    </Screen>
  )
}
