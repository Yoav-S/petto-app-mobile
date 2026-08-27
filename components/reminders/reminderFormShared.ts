import type { Reminder } from '@/types/api';
import {
  formatHourMinute,
  isIsoDateBefore,
  isIsoDateToday,
  minReminderDateIso,
  parseHourMinute,
} from '@/utils/calendar';
import { t } from '@/i18n';
import type { RepeatOption } from '@/services/reminders';

export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;

export const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

export type ReminderSheet = 'category' | 'date' | 'time' | 'repeat' | null;

export function normalizeTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: string): string {
  const { hour, minute } = parseHourMinute(normalizeTime(time));
  return formatHourMinute(hour, minute);
}

/** Current clock time as HH:MM (seconds cleared). */
export function nowReminderTime(): string {
  const now = new Date();
  return formatHourMinute(now.getHours(), now.getMinutes());
}

/**
 * Normalize time for the selected date.
 * Today allows any clock time (matches server); we only normalize the string.
 */
export function clampReminderTimeForDate(
  nextDate: string,
  nextTime: string | null | undefined,
): string | null {
  if (!nextTime) {
    // Sensible default when opening/picking a date with no time yet.
    return isIsoDateToday(nextDate) ? nowReminderTime() : null;
  }
  return normalizeTime(nextTime);
}

export function isActiveReminderStatus(status: string): boolean {
  return status === 'today' || status === 'scheduled';
}

export function repeatToggleLabel(repeat: RepeatOption): string {
  return repeat === 'off' ? t('reminders.repeat_toggle_off') : t('reminders.repeat_toggle_on');
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
  return isIsoDateBefore(nextDate, minReminderDateIso());
}

/**
 * Past calendar days are invalid.
 * Today (any clock time) and future dates are allowed — matches server.
 */
export function isReminderScheduleInPast(nextDate: string, _nextTime?: string | null): boolean {
  return isBeforeMinReminderDate(nextDate);
}

export function needsStatusPrompt(reminder: Reminder): boolean {
  if (!reminder.notified_at) return false;
  return reminder.status === 'today';
}

/** Compact clock for the action sheet (matches design "8:00"). */
export function formatSheetClockTime(time: string): string {
  const normalized = normalizeTime(time);
  const [h, m] = normalized.split(':');
  if (!h || !m) return time;
  return `${Number(h)}:${m}`;
}
