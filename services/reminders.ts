import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Reminder } from '@/types/api';

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
}

export type UpdateReminderInput = Partial<CreateReminderInput>;

export function listReminders(petId: string, tab: ReminderTab): Promise<Reminder[]> {
  return apiGet<Reminder[]>(`/pets/${petId}/reminders?tab=${tab}`);
}

export function getReminder(petId: string, id: string): Promise<Reminder> {
  return apiGet<Reminder>(`/pets/${petId}/reminders/${id}`);
}

export function createReminder(petId: string, input: CreateReminderInput): Promise<Reminder> {
  return apiPost<Reminder>(`/pets/${petId}/reminders`, input);
}

export function updateReminder(
  petId: string,
  id: string,
  patch: UpdateReminderInput,
): Promise<Reminder> {
  return apiPatch<Reminder>(`/pets/${petId}/reminders/${id}`, patch);
}

export function updateReminderStatus(
  petId: string,
  id: string,
  status: ReminderStatus,
): Promise<Reminder> {
  return apiPatch<Reminder>(`/pets/${petId}/reminders/${id}/status`, { status });
}

export function deleteReminder(petId: string, id: string): Promise<void> {
  return apiDelete(`/pets/${petId}/reminders/${id}`);
}
