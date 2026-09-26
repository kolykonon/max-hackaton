import { Hospital } from 'lucide-react'
import { useState } from 'react'

import styles from './CenterPhoto.module.scss'

interface CenterPhotoProps {
  src?: string
  alt: string
}

/** Фото центра. Пока фото нет — заглушка со значком больницы. */
export const CenterPhoto = ({ src, alt }: CenterPhotoProps) => {
  const [failed, setFailed] = useState(false)

  return (
    <div className={styles['center-photo']}>
      {src && !failed ? (
        <img src={src} alt={alt} className={styles['center-photo__image']} onError={() => setFailed(true)} />
      ) : (
        <Hospital size={36} strokeWidth={1.5} className={styles['center-photo__icon']} aria-hidden />
      )}
    </div>
  )
}
