import { t } from '@/i18n';

/** Mongo sometimes sends UTC without a Z. Treat that as UTC, not local time. */
function parseUtc(iso: string): Date {
  const trimmed = iso.trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) return new Date(trimmed);
  return new Date(`${trimmed}Z`);
}

function clock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function ago(count: number, oneKey: string, manyKey: string): string {
  return `${count} ${t(count === 1 ? oneKey : manyKey)}`;
}

/**
 * Seconds, minutes, and hours on the same day.
 * The previous calendar day is "Yesterday 10:05".
 * Older than a week is the real date and time.
 */
export function postedLabel(iso: string, now = new Date()): string {
  const then = parseUtc(iso);
  if (Number.isNaN(then.getTime())) return '';

  const diffSec = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (diffSec < 1) return t('business.just_now');
  if (diffSec < 60) return ago(diffSec, 'business.second_ago', 'business.seconds_ago');

  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return ago(minutes, 'business.minute_ago', 'business.minutes_ago');

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / 86400000);
  if (dayDiff === 1) return `${t('common.yesterday')} ${clock(then)}`;
  if (dayDiff <= 0) {
    const hours = Math.floor(minutes / 60);
    return ago(hours, 'business.hour_ago', 'business.hours_ago');
  }
  if (dayDiff < 7) return ago(dayDiff, 'business.day_ago', 'business.days_ago');

  const day = String(then.getDate()).padStart(2, '0');
  const month = String(then.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${then.getFullYear()} ${clock(then)}`;
}
