import type { Reminder } from '@/types/api';
import {
  formatDisplayTime,
  formatHourMinute,
  isIsoDateBefore,
  isIsoDateToday,
  isReminderDateTimeInPast,
  minReminderDateIso,
  soonestValidReminderTime,
} from '@/utils/calendar';
import { t } from '@/i18n';
import type { AlertOption, RepeatOption } from '@/services/reminders';

export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;

export const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

export type ReminderSheet = 'category' | 'start' | 'end' | 'time' | 'repeat' | 'alert' | null;

export function normalizeTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: string): string {
  return formatDisplayTime(normalizeTime(time));
}

/** Current clock time as HH:MM. */
export function nowReminderTime(): string {
  const now = new Date();
  return formatHourMinute(now.getHours(), now.getMinutes());
}

/**
 * Earliest selectable HH:MM when `nextDate` is today; null for future days.
 */
export function minReminderTimeForDate(nextDate: string): string | null {
  if (!isIsoDateToday(nextDate)) return null;
  return soonestValidReminderTime(nextDate);
}

/**
 * Normalize / default time for a date.
 * Today with no time → now + 1 minute. Today with a past time → same floor.
 */
export function clampReminderTimeForDate(
  nextDate: string,
  nextTime: string | null | undefined,
): string | null {
  if (!nextTime) {
    if (!isIsoDateToday(nextDate)) return null;
    return minReminderTimeForDate(nextDate) ?? nowReminderTime();
  }
  const normalized = normalizeTime(nextTime);
  if (isIsoDateToday(nextDate) && isReminderDateTimeInPast(nextDate, normalized)) {
    return minReminderTimeForDate(nextDate) ?? normalized;
  }
  return normalized;
}

export function isActiveReminderStatus(status: string): boolean {
  return status === 'today' || status === 'scheduled';
}

export function repeatToggleLabel(repeat: RepeatOption): string {
  return repeat === 'off' ? t('reminders.repeat_toggle_off') : t('reminders.repeat_toggle_on');
}

export function alertFieldLabel(alert: AlertOption): string {
  return t(`reminders.alert_${alert}`);
}

export function hasDuplicateInList(
  list: Reminder[],
  nextDate: string,
  nextTime: string,
  excludeId?: string,
): boolean {
  return list.some(
    (r) =>
      r.id !== excludeId &&
      isActiveReminderStatus(r.status) &&
      r.date === nextDate &&
      normalizeTime(r.time) === normalizeTime(nextTime),
  );
}

export function isBeforeMinReminderDate(nextDate: string): boolean {
  return isIsoDateBefore(nextDate.slice(0, 10), minReminderDateIso());
}

/** Past calendar days, or a time today that has already passed. */
export function isReminderScheduleInPast(nextDate: string, nextTime?: string | null): boolean {
  if (isBeforeMinReminderDate(nextDate)) return true;
  if (!nextTime) return false;
  return isReminderDateTimeInPast(nextDate.slice(0, 10), normalizeTime(nextTime));
}

export function needsStatusPrompt(reminder: Reminder): boolean {
  if (!reminder.notified_at) return false;
  return reminder.status === 'today';
}

/** Compact clock for list rows and action sheet (e.g. "4:46"). */
export function formatSheetClockTime(time: string): string {
  return formatDisplayTime(normalizeTime(time));
}
