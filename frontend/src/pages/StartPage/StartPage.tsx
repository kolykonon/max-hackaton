import { Navigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { ErrorState } from '@/components/shared/ErrorState/ErrorState'
import { FullScreenLoader } from '@/components/shared/FullScreenLoader/FullScreenLoader'
import { getStartRoute } from '@/utils/startRoute'

/**
 * Вход в приложение: спиннер → GET /me → онбординг или «Запись».
 * Ошибка проверки НЕ ведёт на онбординг: зарегистрированный донор не должен проходить его повторно — показываем «Повторить».
 * start_param=appointment (кнопка «Открыть запись» в чате) тоже ведёт на «Запись» — она и так стартовая.
 * start_param=book, grp_<code> и rest_<id> — начало записи, экран группы и «После донации», после онбординга.
 */
export const StartPage = () => {
  const { data: me, isPending, isError, isFetching, refetch } = useMe()

  if (isPending) return <FullScreenLoader />
  if (isError) return <ErrorState text="Не удалось загрузить приложение" retrying={isFetching} onRetry={() => refetch()} />
  if (!me.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <Navigate to={getStartRoute()} replace />
}
