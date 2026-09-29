import { Button, Typography } from '@maxhub/max-ui'
import { useNavigate } from 'react-router-dom'

import { useMyGroups } from '@/api/hooks/groups'
import type { Group } from '@/api/types'
import { GroupCard } from '@/components/features/groups/GroupCard/GroupCard'
import { GroupList } from '@/components/features/groups/GroupList/GroupList'
import { PastGroupCard } from '@/components/features/groups/PastGroupCard/PastGroupCard'
import { PastGroups } from '@/components/features/groups/PastGroups/PastGroups'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { StickyFooter } from '@/components/layout/StickyFooter/StickyFooter'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { Skeleton } from '@/components/shared/Skeleton/Skeleton'
import { useBookingStore } from '@/store/booking'

import styles from './GroupsPage.module.scss'

/** «Мои группы»: предстоящие групповые донации, свёрнутый архив прошедших и «Собрать группу». */
export const GroupsPage = () => {
  const navigate = useNavigate()
  const upcoming = useMyGroups()
  const past = useMyGroups(true)
  const { startGroupCreation, startGroupAgain } = useBookingStore()

  const openGroup = (group: Group) => navigate(`/group/${group.code}`)
  const createGroup = () => {
    startGroupCreation()
    navigate('/booking/type')
  }
  // Тот же центр и вид донации — осталось выбрать новую дату
  const collectAgain = ({ center, donation_type: donationType }: Group) => {
    startGroupAgain({ id: center.id, name: center.name, address: center.address }, center.region_id, donationType)
    navigate('/booking/date')
  }

  const renderUpcoming = () => {
    if (upcoming.isPending) return [96, 96].map((height, i) => <Skeleton key={i} height={height} />)
    if (upcoming.isError) {
      return <ErrorState text="Не удалось загрузить группы" retrying={upcoming.isFetching} onRetry={() => upcoming.refetch()} />
    }
    if (upcoming.data.length === 0) {
      return (
        <div className={styles['groups-page__empty']}>
          <Typography.Text variant="body" color="secondary">
            Пока нет групп. Соберите друзей или коллег: вы выбираете центр и день, а каждый записывается на удобное время
          </Typography.Text>
        </div>
      )
    }
    return (
      <GroupList>
        {upcoming.data.map((group) => (
          <GroupCard key={group.code} group={group} onOpen={() => openGroup(group)} />
        ))}
      </GroupList>
    )
  }

  return (
    <Screen
      header={<PageHeader title="Мои группы" onBack={() => navigate('/home')} />}
      footer={
        <StickyFooter>
          <Button size="large" stretched onClick={createGroup}>
            Собрать группу
          </Button>
        </StickyFooter>
      }
    >
      {renderUpcoming()}
      {past.data && past.data.length > 0 && (
        <PastGroups count={past.data.length}>
          <GroupList>
            {past.data.map((group) => (
              <PastGroupCard
                key={group.code}
                group={group}
                onOpen={() => openGroup(group)}
                onAgain={() => collectAgain(group)}
              />
            ))}
          </GroupList>
        </PastGroups>
      )}
    </Screen>
  )
}
