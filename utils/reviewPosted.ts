import { t } from '@/i18n';

/**
 * Relative review time, with no "Posted" prefix until a week has passed.
 * Under an hour: "12 minutes ago". Under a day: "5 hours ago".
 * Under a week: "2 days ago". A week or more: "Posted one week ago".
 */
export function postedLabel(iso: string, now = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const minutes = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 60000));
  if (minutes < 10) return t('business.few_minutes_ago');
  if (minutes < 60) return `${minutes} ${t('business.minutes_ago')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${t(hours === 1 ? 'business.hour_ago' : 'business.hours_ago')}`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${t(days === 1 ? 'business.day_ago' : 'business.days_ago')}`;
  }
  return t('business.posted_one_week_ago');
}
