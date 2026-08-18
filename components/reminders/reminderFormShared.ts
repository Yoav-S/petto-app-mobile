import type { Reminder } from '@/types/api';
import {
  formatHourMinute,
  isIsoDateBefore,
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

export function isReminderScheduleInPast(nextDate: string, nextTime?: string | null): boolean {
  return isBeforeMinReminderDate(nextDate);
}

export function needsStatusPrompt(reminder: Reminder): boolean {
  // Only auto-prompt for today's notified fire. Old auto-"missed" leftovers
  // used to reappear on every login; the dispatcher catch-up clears those.
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

