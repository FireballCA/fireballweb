import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import './index.css'
import './styles/business.css'
import { initSmoothScroll } from './utils/smoothScroll'
import { initProfessionalScroll } from './utils/professionalScroll'

// Initialiser le smooth scroll
initSmoothScroll()

// Initialiser le scroll professionnel (compatible avec navbar)
initProfessionalScroll()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
