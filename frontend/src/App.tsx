import { Navigate, Route, Routes } from 'react-router-dom'

import { TabLayout } from '@/components/layout/TabLayout/TabLayout'
import { AccountPage } from '@/pages/AccountPage/AccountPage'
import { AfterDonationPage } from '@/pages/AfterDonationPage/AfterDonationPage'
import { BookingCenterPage } from '@/pages/BookingCenterPage/BookingCenterPage'
import { BookingCheckPage } from '@/pages/BookingCheckPage/BookingCheckPage'
import { BookingConfirmedPage } from '@/pages/BookingConfirmedPage/BookingConfirmedPage'
import { BookingDatePage } from '@/pages/BookingDatePage/BookingDatePage'
import { BookingTimePage } from '@/pages/BookingTimePage/BookingTimePage'
import { BookingTypeRegionPage } from '@/pages/BookingTypeRegionPage/BookingTypeRegionPage'
import { ConsentPage } from '@/pages/ConsentPage/ConsentPage'
import { DonationInfoPage } from '@/pages/DonationInfoPage/DonationInfoPage'
import { GuidePage } from '@/pages/GuidePage/GuidePage'
import { HomePage } from '@/pages/HomePage/HomePage'
import { GroupPage } from '@/pages/GroupPage/GroupPage'
import { GroupsPage } from '@/pages/GroupsPage/GroupsPage'
import { HonoraryPage } from '@/pages/HonoraryPage/HonoraryPage'
import { MapPage } from '@/pages/MapPage/MapPage'
import { OnboardingPage } from '@/pages/OnboardingPage/OnboardingPage'
import { ReferralsPage } from '@/pages/ReferralsPage/ReferralsPage'
import { SettingsPage } from '@/pages/SettingsPage/SettingsPage'
import { StartPage } from '@/pages/StartPage/StartPage'

const App = () => (
  <Routes>
    <Route path="/" element={<StartPage />} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/guide" element={<GuidePage />} />
    <Route path="/consent" element={<ConsentPage />} />

    <Route element={<TabLayout />}>
      <Route path="/home" element={<HomePage />} />
      <Route path="/account" element={<AccountPage />} />
    </Route>

    <Route path="/map" element={<MapPage />} />
    <Route path="/donation-info" element={<DonationInfoPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/booking/type" element={<BookingTypeRegionPage />} />
    <Route path="/booking/date" element={<BookingDatePage />} />
    <Route path="/booking/center" element={<BookingCenterPage />} />
    <Route path="/booking/time" element={<BookingTimePage />} />
    <Route path="/booking/check" element={<BookingCheckPage />} />
    <Route path="/booking/done" element={<BookingConfirmedPage />} />
    <Route path="/referrals" element={<ReferralsPage />} />
    <Route path="/honorary" element={<HonoraryPage />} />
    <Route path="/groups" element={<GroupsPage />} />
    <Route path="/after-donation/:id" element={<AfterDonationPage />} />
    <Route path="/group/:code" element={<GroupPage />} />

    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
)

export default App
