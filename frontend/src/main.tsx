import '@maxhub/max-ui/dist/styles.css'
import '@/styles/globals.scss'

import { MaxUI } from '@maxhub/max-ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { queryClient } from '@/api/queryClient'

import App from './App.tsx'

const enableMocking = async () => {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('@/api/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MaxUI colorScheme="light">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MaxUI>
      </QueryClientProvider>
    </StrictMode>,
  )
})
