import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import { FORCE_FULL_SITE_MOTION } from './constants/motion'
import './index.css'
import './styles/business.css'
import { ScrollToTop } from '@/components/ScrollToTop'
import { LenisRoot } from '@/components/LenisRoot'

if (FORCE_FULL_SITE_MOTION && typeof document !== 'undefined') {
  document.documentElement.classList.add('fb-force-motion')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <LenisRoot>
      <ScrollToTop />
      <App />
    </LenisRoot>
  </BrowserRouter>,
)
