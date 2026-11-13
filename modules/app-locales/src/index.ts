/** In-app UI locale is handled in LocaleContext. Soft keyboard stays system. */

export function languageTagForLocale(locale: string): string {
  return locale;
}

export async function setKeyboardLocale(_localeOrTag: string): Promise<boolean> {
  return false;
}

export async function setNativeAppLocale(_localeOrTag: string): Promise<boolean> {
  return false;
}

export async function isImeLanguageEnabled(_localeOrTag: string): Promise<boolean> {
  return true;
}

export async function openImeSubtypeSettings(): Promise<boolean> {
  return false;
}

export function isNativeAppLocaleAvailable(): boolean {
  return false;
}
