import { Input } from '@maxhub/max-ui'
import { Search } from 'lucide-react'

interface RegionSearchProps {
  value: string
  onChange: (value: string) => void
}

export const RegionSearch = ({ value, onChange }: RegionSearchProps) => (
  <Input
    value={value}
    placeholder="Поиск региона"
    aria-label="Поиск региона"
    iconBefore={<Search size={20} />}
    withClearButton
    onChange={(event) => onChange(event.target.value)}
  />
)
