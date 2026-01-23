import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

export const normalizeLanguage = (language?: string | null) => {
  if (!language) return 'zh-CN';
  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('en')) return 'en-US';
  return 'zh-CN';
};

export const getCurrentLanguage = () =>
  normalizeLanguage(i18n.resolvedLanguage || i18n.language);

export const formatDate = (
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
) => {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getCurrentLanguage(), options).format(date);
};

export const formatDateTime = (
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
) => {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getCurrentLanguage(), {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(date);
};

export const formatTime = (
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
) => {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getCurrentLanguage(), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
};

export const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(getCurrentLanguage()).format(value);
};

export const formatCurrency = (
  value: number | null | undefined,
  currency: string,
  options?: Intl.NumberFormatOptions
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(getCurrentLanguage(), {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
};

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
    supportedLngs: ['zh-CN', 'en-US'],
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
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
