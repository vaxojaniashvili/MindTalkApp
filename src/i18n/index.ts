import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ka from './locales/ka.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'ka';
const supportedLang = ['ka', 'en', 'ru'].includes(deviceLocale) ? deviceLocale : 'ka';

i18n.use(initReactI18next).init({
  resources: { ka: { translation: ka }, en: { translation: en }, ru: { translation: ru } },
  lng: supportedLang,
  fallbackLng: 'ka',
  interpolation: { escapeValue: false },
});

export default i18n;
