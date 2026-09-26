import { Avatar, Typography } from '@maxhub/max-ui'

import styles from './ProfileHeader.module.scss'

interface ProfileHeaderProps {
  firstName: string
  lastName: string
  photoUrl?: string
  /** 5 тапов по аватару открывают скрытое демо-меню. */
  onAvatarClick?: () => void
}

/** Аватар из профиля MAX и имя. Без фото — инициалы на фирменном фоне. */
export const ProfileHeader = ({ firstName, lastName, photoUrl, onAvatarClick }: ProfileHeaderProps) => {
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
      <Typography.Text variant="hero">{[firstName, lastName].filter(Boolean).join(' ')}</Typography.Text>
    </div>
  )
}
