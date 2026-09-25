import '@maxhub/max-ui/dist/styles.css'
import '@/styles/globals.scss'

import { MaxUI } from '@maxhub/max-ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.tsx'

// Тёмную тему не рисовали — закрепляем светлую. Платформа (iOS/Android) определяется сама.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MaxUI colorScheme="light">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MaxUI>
  </StrictMode>,
)
