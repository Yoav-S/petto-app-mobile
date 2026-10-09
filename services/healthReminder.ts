import {
  createReminder,
  updateReminder,
  deleteReminder,
  getReminder,
  listReminders,
  type AlertOption,
  type RepeatOption,
} from '@/services/reminders';
import type { Reminder } from '@/types/api';
import { isRecentOccurrence } from '@/components/reminders/reminderFormShared';

export interface HealthReminderDraft {
  date: string;
  endDate?: string | null;
  time: string;
  repeat: RepeatOption;
  alert?: AlertOption;
}

/** Short title for a reminder created from a health note. */
export function healthReminderTitle(noteText: string, conditionTitle?: string): string {
  const fromNote = noteText.trim();
  if (fromNote) return fromNote.length > 80 ? `${fromNote.slice(0, 77)}…` : fromNote;
  const fromCondition = conditionTitle?.trim();
  if (fromCondition) return fromCondition.length > 80 ? `${fromCondition.slice(0, 77)}…` : fromCondition;
  return 'Health reminder';
}

/** Create or update the reminder tied to a health note. Returns the reminder id. */
export async function upsertHealthReminder(
  petId: string,
  draft: HealthReminderDraft,
  title: string,
  existingReminderId?: string | null,
): Promise<string> {
  const payload = {
    title,
    date: draft.date,
    end_date: draft.endDate ?? null,
    time: draft.time,
    repeat: draft.repeat,
    alert: draft.alert ?? 'off',
  };

  if (existingReminderId) {
    const updated = await updateReminder(petId, existingReminderId, payload);
    return updated.id;
  }

  const created = await createReminder(petId, payload);
  return created.id;
}

/** Remove a reminder that was linked to a health note. */
export async function removeHealthReminder(petId: string, reminderId: string): Promise<void> {
  await deleteReminder(petId, reminderId);
}

/**
 * A repeating reminder that already fired keeps the note pointed at that
 * occurrence. Edits belong on the next scheduled row in the same series.
 */
export async function resolveEditableReminder(petId: string, reminderId: string): Promise<Reminder> {
  const reminder = await getReminder(petId, reminderId);
  const repeat = reminder.repeat || 'off';
  if (repeat === 'off' || !isRecentOccurrence(reminder)) return reminder;

  const seriesId = reminder.series_id || reminder.id;
  const [today, upcoming] = await Promise.all([
    listReminders(petId, 'today', { limit: 100 }),
    listReminders(petId, 'upcoming', { limit: 100 }),
  ]);
  const live = [...today, ...upcoming].find((row) => (row.series_id || row.id) === seriesId);
  return live ?? reminder;
}
