import { t } from '@/i18n';
import { ApiError } from '@/services/api';

/** Map server error code to localized user-facing text. */
export function translateErrorCode(code: string | null): string | null {
  if (!code) return null;
  const key = `errors.${code}`;
  const message = t(key);
  return message !== key ? message : null;
}

/** Resolve any thrown value to a localized message for inline UI. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.message.includes('timed out')) {
      return t('errors.network_timeout');
    }
    if (err.message.includes('Network request failed')) {
      return t('errors.check_connection');
    }
    return err.message;
  }
  return t('errors.generic');
}
