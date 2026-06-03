import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en/translation.json'
import fr from './locales/fr/translation.json'
import { safeLocal } from './utils/safeStorage'

const savedLang = safeLocal.get('fireball-lang')
const initialLang = savedLang === 'fr' ? 'en' : savedLang || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

if (savedLang === 'fr') {
  safeLocal.set('fireball-lang', 'en')
}

i18n.on('languageChanged', (lng) => {
  safeLocal.set('fireball-lang', lng)
})

export default i18n
