import { Card } from '@/components/shared/Card/Card'
import { InfoRow } from '@/components/shared/InfoRow/InfoRow'
import type { IconItem } from '@/content/types'

interface RestrictionCardProps {
  item: IconItem
}

/** Пункт шторки «Почему такие ограничения» на сером фоне. */
export const RestrictionCard = ({ item }: RestrictionCardProps) => (
  <Card variant="filled">
    <InfoRow icon={item.icon} tone={item.tone} size="xl" title={item.title} description={item.description} strong />
  </Card>
)
