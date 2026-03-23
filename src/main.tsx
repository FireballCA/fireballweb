import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import './index.css'
import './styles/business.css'
import { ScrollToTop } from '@/components/ScrollToTop'
import { LenisRoot } from '@/components/LenisRoot'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LenisRoot>
        <ScrollToTop />
        <App />
      </LenisRoot>
    </BrowserRouter>
  </React.StrictMode>,
)
