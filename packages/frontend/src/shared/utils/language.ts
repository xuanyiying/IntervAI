export const normalizeLanguage = (language?: string | null) => {
  if (!language) return 'zh-CN';
  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('en')) return 'en-US';
  return 'zh-CN';
};
