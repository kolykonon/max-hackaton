import { Typography } from '@maxhub/max-ui'

import { BulletList } from '@/components/shared/BulletList/BulletList'
import { BulletListItem } from '@/components/shared/BulletList/BulletListItem'
import { Card } from '@/components/shared/Card/Card'

import styles from './DocumentsList.module.scss'

interface DocumentsListProps {
  documents: string[]
}

/** Какие справки взять в центре крови. Тексты приходят с бэка готовыми. */
export const DocumentsList = ({ documents }: DocumentsListProps) => (
  <Card padding="l" className={styles['documents-list']}>
    <Typography.Text variant="subheader">Что взять в центре крови</Typography.Text>
    <BulletList gap="m">
      {documents.map((document) => (
        <BulletListItem key={document} marker="check">
          {document}
        </BulletListItem>
      ))}
    </BulletList>
  </Card>
)
