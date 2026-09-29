import { Navigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { getGroupCode } from '@/bridge/max'
import { FullScreenLoader } from '@/components/shared/FullScreenLoader/FullScreenLoader'

/**
 * Вход в приложение: спиннер → GET /me → онбординг или «Запись».
 * Ошибка проверки тоже ведёт на онбординг (онбординг, общие правила).
 * start_param=appointment (кнопка «Открыть запись» в чате) тоже ведёт на «Запись» — она и так стартовая.
 * start_param=grp_<code> — приглашение в групповую донацию, после онбординга.
 */
export const StartPage = () => {
  const { data: me, isPending, isError } = useMe()

  if (isPending) return <FullScreenLoader />
  if (isError || !me.onboarding_completed) return <Navigate to="/onboarding" replace />
  const groupCode = getGroupCode()
  return <Navigate to={groupCode ? `/group/${groupCode}` : '/home'} replace />
}
