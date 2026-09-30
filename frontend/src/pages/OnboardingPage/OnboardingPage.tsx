import { Navigate } from 'react-router-dom'

import { useMe } from '@/api/hooks/me'
import { GuideScreen } from '@/components/features/guide/GuideScreen'
import { getStartRoute } from '@/utils/startRoute'

/** Онбординг: гид «Быть донором», в конце согласие на обработку ПД. Уже прошедшим его не показываем. */
export const OnboardingPage = () => {
  const { data: me } = useMe()
  if (me?.onboarding_completed) return <Navigate to={getStartRoute()} replace />
  return <GuideScreen onboarding />
}
