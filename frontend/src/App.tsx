import { Navigate, Route, Routes } from 'react-router-dom'

import { TabLayout } from '@/components/layout/TabLayout/TabLayout'
import { AccountPage } from '@/pages/AccountPage/AccountPage'
import { BookingCenterPage } from '@/pages/BookingCenterPage/BookingCenterPage'
import { BookingCheckPage } from '@/pages/BookingCheckPage/BookingCheckPage'
import { BookingConfirmedPage } from '@/pages/BookingConfirmedPage/BookingConfirmedPage'
import { BookingDatePage } from '@/pages/BookingDatePage/BookingDatePage'
import { BookingTimePage } from '@/pages/BookingTimePage/BookingTimePage'
import { BookingTypeRegionPage } from '@/pages/BookingTypeRegionPage/BookingTypeRegionPage'
import { ConsentPage } from '@/pages/ConsentPage/ConsentPage'
import { DonationInfoPage } from '@/pages/DonationInfoPage/DonationInfoPage'
import { HomePage } from '@/pages/HomePage/HomePage'
import { HonoraryPage } from '@/pages/HonoraryPage/HonoraryPage'
import { MapPage } from '@/pages/MapPage/MapPage'
import { OnboardingPage } from '@/pages/OnboardingPage/OnboardingPage'
import { PersonalDataPage } from '@/pages/PersonalDataPage/PersonalDataPage'
import { ReferralsPage } from '@/pages/ReferralsPage/ReferralsPage'

// TODO: старт через GET /me → онбординг или /home (ТЗ §8). Пока всегда начинаем с онбординга.
const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/onboarding" replace />} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/consent" element={<ConsentPage />} />

    <Route element={<TabLayout />}>
      <Route path="/home" element={<HomePage />} />
      <Route path="/account" element={<AccountPage />} />
    </Route>

    <Route path="/map" element={<MapPage />} />
    <Route path="/donation-info" element={<DonationInfoPage />} />
    <Route path="/personal-data" element={<PersonalDataPage />} />
    <Route path="/booking/type" element={<BookingTypeRegionPage />} />
    <Route path="/booking/date" element={<BookingDatePage />} />
    <Route path="/booking/center" element={<BookingCenterPage />} />
    <Route path="/booking/time" element={<BookingTimePage />} />
    <Route path="/booking/check" element={<BookingCheckPage />} />
    <Route path="/booking/done" element={<BookingConfirmedPage />} />
    <Route path="/referrals" element={<ReferralsPage />} />
    <Route path="/honorary" element={<HonoraryPage />} />

    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
)

export default App
