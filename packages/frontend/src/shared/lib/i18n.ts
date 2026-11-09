import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from '@/shared/locales/zh-CN.json';
import enUS from '@/shared/locales/en-US.json';
import { normalizeLanguage } from '@/shared/utils/language';

export { normalizeLanguage } from '@/shared/utils/language';

export const getCurrentLanguage = () =>
  normalizeLanguage(i18n.resolvedLanguage || i18n.language);

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
  zh: {
    translation: zhCN,
  },
  en: {
    translation: enUS,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US', 'zh', 'en'],
    nonExplicitSupportedLngs: true,
    load: 'all',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: [
        'querystring',
        'cookie',
        'localStorage',
        'navigator',
        'htmlTag',
        'path',
        'subdomain',
      ],
      caches: ['localStorage', 'cookie'],
      convertDetectedLanguage: normalizeLanguage,
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on('languageChanged', (language) => {
  document.documentElement.setAttribute('lang', normalizeLanguage(language));
});

export default i18n;
