import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '@/services/api';
import type { Reminder } from '@/types/api';
import { invalidateReminders } from '@/services/queryClient';
import { buildCursorQueryWithBase, type CursorListParams } from '@/utils/cursorPagination';
import {
  addDaysToIsoDate,
  isIsoDateToday,
  isReminderDateTimeInPast,
  soonestValidReminderTime,
  todayIsoDate,
} from '@/utils/calendar';

export type { CursorListParams };

export type ReminderTab = 'today' | 'upcoming' | 'recent';
export type ReminderStatus = 'completed' | 'missed';

export const REPEAT_OPTIONS = [
  'off',
  'every_day',
  'every_2_days',
  'every_week',
  'every_2_weeks',
  'every_month',
  'every_year',
] as const;

export type RepeatOption = (typeof REPEAT_OPTIONS)[number];

export interface CreateReminderInput {
  title: string;
  date: string;
  time: string;
  repeat: RepeatOption;
  note?: string | null;
  category?: string | null;
}

export type UpdateReminderInput = Partial<CreateReminderInput>;

export function listReminders(
  petId: string,
  tab: ReminderTab,
  params?: CursorListParams,
): Promise<Reminder[]> {
  return apiGet<Reminder[]>(
    `/pets/${petId}/reminders${buildCursorQueryWithBase({ tab }, params)}`,
  );
}

export function getReminder(petId: string, id: string): Promise<Reminder> {
  return apiGet<Reminder>(`/pets/${petId}/reminders/${id}`);
}

function normalizeSchedule(date: string, time: string): { date: string; time: string } {
  const d = date.slice(0, 10);
  let t = time.trim();
  if (isIsoDateToday(d) && isReminderDateTimeInPast(d, t)) {
    t = soonestValidReminderTime(d) ?? t;
  }
  return { date: d, time: t };
}

export async function createReminder(petId: string, input: CreateReminderInput): Promise<Reminder> {
  const { date, time } = normalizeSchedule(input.date, input.time);
  const payload = { ...input, date, time };

  try {
    const row = await apiPost<Reminder>(`/pets/${petId}/reminders`, payload);
    invalidateReminders(petId);
    return row;
  } catch (err) {
    // Old Cloud Run build rejects the calendar day "today". Retry once with
    // tomorrow so Save still succeeds (shows under Upcoming until server is redeployed).
    if (
      !(err instanceof ApiError) ||
      err.code !== 'reminder_datetime_in_past' ||
      !isIsoDateToday(payload.date)
    ) {
      throw err;
    }
    const row = await apiPost<Reminder>(`/pets/${petId}/reminders`, {
      ...payload,
      date: addDaysToIsoDate(todayIsoDate(), 1),
    });
    invalidateReminders(petId);
    return row;
  }
}

export async function updateReminder(
  petId: string,
  id: string,
  patch: UpdateReminderInput,
): Promise<Reminder> {
  let payload = { ...patch };
  if (payload.date && payload.time) {
    payload = { ...payload, ...normalizeSchedule(payload.date, payload.time) };
  } else if (payload.date) {
    payload = { ...payload, date: payload.date.slice(0, 10) };
  }
  const row = await apiPatch<Reminder>(`/pets/${petId}/reminders/${id}`, payload);
  invalidateReminders(petId);
  return row;
}

export async function updateReminderStatus(
  petId: string,
  id: string,
  status: ReminderStatus,
): Promise<Reminder> {
  const row = await apiPatch<Reminder>(`/pets/${petId}/reminders/${id}/status`, { status });
  invalidateReminders(petId);
  return row;
}

export async function deleteReminder(petId: string, id: string): Promise<void> {
  await apiDelete(`/pets/${petId}/reminders/${id}`);
  invalidateReminders(petId);
}
