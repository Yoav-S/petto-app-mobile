import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Reminder } from '@/types/api';
import { invalidateReminders } from '@/services/queryClient';
import { buildCursorQueryWithBase, type CursorListParams } from '@/utils/cursorPagination';

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

export const ALERT_OPTIONS = [
  'off',
  '5m',
  '10m',
  '15m',
  '30m',
  '1h',
  '2h',
  '1d',
] as const;

export type AlertOption = (typeof ALERT_OPTIONS)[number];

export const DEFAULT_REMINDER_TIME = '09:00';

export function parseAlert(value: string | null | undefined): AlertOption {
  if (value && (ALERT_OPTIONS as readonly string[]).includes(value)) {
    return value as AlertOption;
  }
  return 'off';
}

export interface CreateReminderInput {
  title: string;
  date: string;
  time: string;
  repeat: RepeatOption;
  end_date?: string | null;
  alert?: AlertOption;
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

export async function createReminder(petId: string, input: CreateReminderInput): Promise<Reminder> {
  const row = await apiPost<Reminder>(`/pets/${petId}/reminders`, {
    ...input,
    date: input.date.slice(0, 10),
    time: input.time.trim(),
  });
  invalidateReminders(petId);
  return row;
}

export async function updateReminder(
  petId: string,
  id: string,
  patch: UpdateReminderInput,
): Promise<Reminder> {
  const payload = {
    ...patch,
    ...(patch.date ? { date: patch.date.slice(0, 10) } : {}),
    ...(patch.time ? { time: patch.time.trim() } : {}),
    ...(patch.end_date !== undefined
      ? { end_date: patch.end_date ? patch.end_date.slice(0, 10) : null }
      : {}),
  };
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
