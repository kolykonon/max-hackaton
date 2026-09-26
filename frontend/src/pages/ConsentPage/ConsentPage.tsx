import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Screen } from '@/components/layout/Screen/Screen'
import { ConsentText } from '@/components/shared/ConsentText/ConsentText'

/** Экран «Согласие на обработку персональных данных». */
export const ConsentPage = () => (
  <Screen header={<PageHeader title="Согласие на обработку ПД" align="center" />}>
    <ConsentText />
  </Screen>
)
