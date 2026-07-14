import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import amTranslations from './locales/am.json';

// Fetch initial language from localStorage or default to system preferred/English
const savedLang = localStorage.getItem('ess_portal_lang');
const defaultLang = savedLang || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      am: {
        translation: amTranslations
      }
    },
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

// Automatically persist language change in localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('ess_portal_lang', lng);
});

export default i18n;
