import { t } from '@/i18n';

function sameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/**
 * Posted time from the review's real date.
 * Under 10 minutes today: "few minutes ago".
 * Later the same day: "12 minutes ago" or "5 hours ago".
 * A previous day: "2/10/2026 at 9:12".
 */
export function postedLabel(iso: string, now = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  if (!sameLocalDay(then, now) && then.getTime() < now.getTime()) {
    const date = `${then.getDate()}/${then.getMonth() + 1}/${then.getFullYear()}`;
    const time = `${then.getHours()}:${String(then.getMinutes()).padStart(2, '0')}`;
    return `${t('business.posted')} ${date} ${t('business.posted_at')} ${time}`;
  }

  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 10) {
    return `${t('business.posted')} ${t('business.few_minutes_ago')}`;
  }
  if (minutes < 60) {
    return `${t('business.posted')} ${minutes} ${t('business.minutes_ago')}`;
  }
  const hours = Math.floor(minutes / 60);
  return `${t('business.posted')} ${hours} ${t(hours === 1 ? 'business.hour_ago' : 'business.hours_ago')}`;
}
