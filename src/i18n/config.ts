import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ru from './locales/ru';

const resources = {
  en: { translation: en },
  ru: { translation: ru }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Load saved language or default to English
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;