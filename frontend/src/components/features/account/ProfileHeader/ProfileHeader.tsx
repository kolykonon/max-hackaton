import { Avatar, IconButton, Typography } from '@maxhub/max-ui'
import { Settings } from 'lucide-react'

import styles from './ProfileHeader.module.scss'

interface ProfileHeaderProps {
  firstName: string
  lastName: string
  photoUrl?: string
  /** 5 тапов по аватару открывают скрытое демо-меню. */
  onAvatarClick?: () => void
  /** Шестерёнка у имени: паспорт, полис, контакты и регион. */
  onOpenSettings: () => void
}

/** Аватар из профиля MAX и имя. Без фото — инициалы на фирменном фоне. */
export const ProfileHeader = ({ firstName, lastName, photoUrl, onAvatarClick, onOpenSettings }: ProfileHeaderProps) => {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`

  return (
    <div className={styles['profile-header']}>
      <button type="button" className={styles['profile-header__avatar']} aria-label="Фото профиля" onClick={onAvatarClick}>
        <Avatar.Container size={64} form="circle">
          {photoUrl ? (
            <Avatar.Image src={photoUrl} alt="" fallback={initials} fallbackGradient="blue" />
          ) : (
            <Avatar.Text gradient="blue">{initials}</Avatar.Text>
          )}
        </Avatar.Container>
      </button>
      <Typography.Text variant="hero" className={styles['profile-header__name']}>
        {[firstName, lastName].filter(Boolean).join(' ')}
      </Typography.Text>
      <IconButton size="medium" variant="ghost" aria-label="Настройки" onClick={onOpenSettings}>
        <Settings size={24} />
      </IconButton>
    </div>
  )
}
