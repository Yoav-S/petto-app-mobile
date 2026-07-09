import {
  createReminder,
  updateReminder,
  deleteReminder,
  type RepeatOption,
} from '@/services/reminders';

export interface HealthReminderDraft {
  date: string;
  time: string;
  repeat: RepeatOption;
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
    time: draft.time,
    repeat: draft.repeat,
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
