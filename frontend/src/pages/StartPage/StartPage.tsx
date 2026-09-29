import { Navigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { FullScreenLoader } from '@/components/shared/FullScreenLoader/FullScreenLoader'
import { getStartRoute } from '@/utils/startRoute'

/**
 * Вход в приложение: спиннер → GET /me → онбординг или «Запись».
 * Ошибка проверки тоже ведёт на онбординг (онбординг, общие правила).
 * start_param=appointment (кнопка «Открыть запись» в чате) тоже ведёт на «Запись» — она и так стартовая.
 * start_param=grp_<code> и rest_<id> — экран группы и «После донации», после онбординга.
 */
export const StartPage = () => {
  const { data: me, isPending, isError } = useMe()

  if (isPending) return <FullScreenLoader />
  if (isError || !me.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <Navigate to={getStartRoute()} replace />
}
