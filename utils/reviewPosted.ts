import { t } from '@/i18n';
import { formatRelativeAgo } from '@/utils/localeFormat';

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

/**
 * Seconds, minutes, and hours on the same day.
 * The previous calendar day is "Yesterday 10:05".
 * Weeks and months match the review list ("Acum 2 săptămâni", "Acum o lună").
 * Older than a year is the real date and time.
 */
export function postedLabel(iso: string, now = new Date()): string {
  const then = parseUtc(iso);
  if (Number.isNaN(then.getTime())) return '';

  const diffSec = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (diffSec < 1) return t('business.just_now');
  if (diffSec < 60) return formatRelativeAgo(diffSec, 'second');

  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return formatRelativeAgo(minutes, 'minute');

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / 86400000);
  if (dayDiff === 1) return `${t('common.yesterday')} ${clock(then)}`;
  if (dayDiff <= 0) {
    const hours = Math.max(1, Math.floor(minutes / 60));
    return formatRelativeAgo(hours, 'hour');
  }
  if (dayDiff < 7) return formatRelativeAgo(dayDiff, 'day');

  const weeks = Math.round(dayDiff / 7);
  if (dayDiff < 30) return formatRelativeAgo(Math.max(1, weeks), 'week');

  const months = Math.round(dayDiff / 30);
  if (dayDiff < 365) return formatRelativeAgo(Math.max(1, months), 'month');

  const day = String(then.getDate()).padStart(2, '0');
  const month = String(then.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${then.getFullYear()} ${clock(then)}`;
}
