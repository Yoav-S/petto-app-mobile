import { t } from '@/i18n';

/** Parse API error body: {"detail": {"code": "otp_invalid"}} */
export async function parseErrorCode(res: Response): Promise<string | null> {
  try {
    const json = await res.json();
    const detail = json?.detail;
    if (detail && typeof detail === 'object' && typeof detail.code === 'string') {
      return detail.code;
    }
    if (typeof detail === 'string') {
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Map server error code (or HTTP status fallback) to localized text. */
export function mapErrorCode(
  code: string | null,
  status: number,
  path: string,
): string {
  if (code) {
    const key = `errors.${code}`;
    const message = t(key);
    if (message !== key) {
      return message;
    }
  }

  const isOtpSend = path.includes('/auth/send-otp') || path.includes('/auth/resend-otp');
  const isOtpVerify = path.includes('/auth/verify-otp');

  if (status === 429 && isOtpVerify) {
    return t('errors.otp_too_many_attempts');
  }
  if (status === 429 && isOtpSend) {
    return t('errors.otp_resend_cooldown');
  }
  if (status === 400 && isOtpVerify) {
    return t('errors.otp_invalid');
  }
  if (status === 401) {
    return t('errors.invalid_token');
  }
  if (status === 403) {
    return t('errors.email_not_verified');
  }
  if (status === 404) {
    return t('errors.not_found');
  }
  if (status === 422) {
    return t('errors.failed_to_save');
  }
  if (status >= 500) {
    return t('errors.check_connection');
  }
  return t('errors.generic');
}
