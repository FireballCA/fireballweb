import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import './index.css'
import './styles/business.css'
import { initSmoothScroll } from './utils/smoothScroll'

// Initialiser le smooth scroll (scroll-behavior: smooth CSS uniquement)
initSmoothScroll()

// Scroll professionnel désactivé - cause des problèmes avec la navbar
// import { initProfessionalScroll } from './utils/professionalScroll'
// initProfessionalScroll()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
