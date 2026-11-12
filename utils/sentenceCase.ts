import { currentLocale } from '@/i18n';

/**
 * Sentence case for place category / service labels:
 * only the first letter is capital — e.g. "Pet friendly".
 */
export function sentenceCaseLabel(value: string, locale: string = currentLocale): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return text;
  const lower = text.toLocaleLowerCase(locale);
  return lower.charAt(0).toLocaleUpperCase(locale) + lower.slice(1);
}
