import i18n from 'i18next';
import { normalizeLanguage } from './language';

const currentLanguage = () =>
  normalizeLanguage(i18n.resolvedLanguage || i18n.language);

export const formatDate = (
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
) => {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(currentLanguage(), options).format(date);
};

export const formatDateTime = (
  value: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
) => {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(currentLanguage(), {
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
  return new Intl.DateTimeFormat(currentLanguage(), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
};

export const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(currentLanguage()).format(value);
};

export const formatCurrency = (
  value: number | null | undefined,
  currency: string,
  options?: Intl.NumberFormatOptions
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(currentLanguage(), {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
};
