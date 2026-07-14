import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/services/api';
import { getReminder } from '@/services/reminders';
import type { MedicalRecord, MedicalRecordDetail, HealthNote } from '@/types/api';

export type RecordStatus = 'active' | 'resolved';

export interface CreateNoteInput {
  text: string;
  photo_url?: string | null;
  linked_reminder_id?: string | null;
}

export type UpdateNoteInput = Partial<CreateNoteInput>;

export function listRecords(petId: string, status: RecordStatus): Promise<MedicalRecord[]> {
  return apiGet<MedicalRecord[]>(`/pets/${petId}/medical-records?status=${status}`);
}

export function createRecord(petId: string, input: { title: string }): Promise<MedicalRecord> {
  return apiPost<MedicalRecord>(`/pets/${petId}/medical-records`, input);
}

export function getRecord(petId: string, id: string): Promise<MedicalRecordDetail> {
  return apiGet<MedicalRecordDetail>(`/pets/${petId}/medical-records/${id}`);
}

export function resolveRecord(petId: string, id: string): Promise<MedicalRecord> {
  return apiPatch<MedicalRecord>(`/pets/${petId}/medical-records/${id}/status`, {
    status: 'resolved',
  });
}

export function deleteRecord(petId: string, id: string): Promise<void> {
  return apiDelete(`/pets/${petId}/medical-records/${id}`);
}

export function addNote(
  petId: string,
  recordId: string,
  input: CreateNoteInput,
): Promise<HealthNote> {
  return apiPost<HealthNote>(`/pets/${petId}/medical-records/${recordId}/notes`, input);
}

export function updateNote(
  petId: string,
  recordId: string,
  noteId: string,
  patch: UpdateNoteInput,
): Promise<HealthNote> {
  return apiPut<HealthNote>(
    `/pets/${petId}/medical-records/${recordId}/notes/${noteId}`,
    patch,
  );
}

export function deleteNote(petId: string, recordId: string, noteId: string): Promise<void> {
  return apiDelete(`/pets/${petId}/medical-records/${recordId}/notes/${noteId}`);
}

/** Resolve reminder display fields when the list API omits them (older server builds). */
export async function enrichRecordWithLatestNoteReminder(
  petId: string,
  record: MedicalRecord,
): Promise<MedicalRecord> {
  if (record.linked_reminder_date && record.linked_reminder_time) {
    return record;
  }

  try {
    const detail = await getRecord(petId, record.id);
    const latestNote = detail.notes[0];
    if (!latestNote) {
      return {
        ...record,
        latest_note_id: record.latest_note_id ?? null,
        linked_reminder_date: null,
        linked_reminder_time: null,
      };
    }

    const hasLinkedReminder =
      latestNote.linked_reminder_id ||
      latestNote.linked_reminder_date ||
      latestNote.linked_reminder_time;

    if (!hasLinkedReminder) {
      return {
        ...record,
        latest_note_id: latestNote.id,
        latest_note_photo_url: latestNote.photo_url ?? record.latest_note_photo_url ?? null,
        linked_reminder_date: null,
        linked_reminder_time: null,
      };
    }

    let reminderDate = latestNote.linked_reminder_date ?? null;
    let reminderTime = latestNote.linked_reminder_time ?? null;

    if (latestNote.linked_reminder_id && (!reminderDate || !reminderTime)) {
      try {
        const reminder = await getReminder(petId, latestNote.linked_reminder_id);
        reminderDate = reminder.date;
        reminderTime = reminder.time;
      } catch {
        // keep note-level fields when reminder fetch fails
      }
    }

    return {
      ...record,
      latest_note_id: latestNote.id,
      latest_note_photo_url: latestNote.photo_url ?? record.latest_note_photo_url ?? null,
      linked_reminder_date: reminderDate,
      linked_reminder_time: reminderTime,
    };
  } catch {
    return record;
  }
}

export async function enrichRecordsWithLatestNoteReminders(
  petId: string,
  records: MedicalRecord[],
): Promise<MedicalRecord[]> {
  return Promise.all(
    records.map((record) =>
      record.linked_reminder_date && record.linked_reminder_time
        ? Promise.resolve(record)
        : enrichRecordWithLatestNoteReminder(petId, record),
    ),
  );
}
