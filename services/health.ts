import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/services/api';
import { getReminder } from '@/services/reminders';
import type { MedicalRecord, MedicalRecordDetail, HealthNote } from '@/types/api';
import { invalidateRecords, invalidateReminders } from '@/services/queryClient';
import {
  buildCursorQuery,
  buildCursorQueryWithBase,
  type CursorListParams,
} from '@/utils/cursorPagination';

export type { CursorListParams };

export type RecordStatus = 'active' | 'resolved';

export interface CreateNoteInput {
  text: string;
  photo_url?: string | null;
  linked_reminder_id?: string | null;
}

export type UpdateNoteInput = Partial<CreateNoteInput>;

export function listRecords(
  petId: string,
  status: RecordStatus,
  params?: CursorListParams,
): Promise<MedicalRecord[]> {
  return apiGet<MedicalRecord[]>(
    `/pets/${petId}/medical-records${buildCursorQueryWithBase({ status }, params)}`,
  );
}

export function getRecord(
  petId: string,
  id: string,
  params?: { notes_limit?: number },
): Promise<MedicalRecordDetail> {
  const search = new URLSearchParams();
  if (params?.notes_limit != null) {
    search.set('notes_limit', String(params.notes_limit));
  }
  const qs = search.toString();
  return apiGet<MedicalRecordDetail>(
    `/pets/${petId}/medical-records/${id}${qs ? `?${qs}` : ''}`,
  );
}

export function listRecordNotes(
  petId: string,
  recordId: string,
  params?: CursorListParams,
): Promise<HealthNote[]> {
  return apiGet<HealthNote[]>(
    `/pets/${petId}/medical-records/${recordId}/notes${buildCursorQuery(params)}`,
  );
}

export async function createRecord(
  petId: string,
  input: { title: string; description?: string | null },
): Promise<MedicalRecord> {
  const row = await apiPost<MedicalRecord>(`/pets/${petId}/medical-records`, input);
  invalidateRecords(petId);
  return row;
}

export async function updateRecord(
  petId: string,
  id: string,
  input: { title?: string; description?: string | null },
): Promise<MedicalRecord> {
  const row = await apiPatch<MedicalRecord>(`/pets/${petId}/medical-records/${id}`, input);
  invalidateRecords(petId);
  return row;
}

export async function resolveRecord(petId: string, id: string): Promise<MedicalRecord> {
  const row = await apiPatch<MedicalRecord>(`/pets/${petId}/medical-records/${id}/status`, {
    status: 'resolved',
  });
  invalidateRecords(petId);
  return row;
}

export async function reopenRecord(petId: string, id: string): Promise<MedicalRecord> {
  const row = await apiPatch<MedicalRecord>(`/pets/${petId}/medical-records/${id}/status`, {
    status: 'active',
  });
  invalidateRecords(petId);
  return row;
}

export async function deleteRecord(petId: string, id: string): Promise<void> {
  await apiDelete(`/pets/${petId}/medical-records/${id}`);
  invalidateRecords(petId);
  invalidateReminders(petId);
}

export async function addNote(
  petId: string,
  recordId: string,
  input: CreateNoteInput,
): Promise<HealthNote> {
  const note = await apiPost<HealthNote>(
    `/pets/${petId}/medical-records/${recordId}/notes`,
    input,
  );
  invalidateRecords(petId);
  if (input.linked_reminder_id) invalidateReminders(petId);
  return note;
}

export async function updateNote(
  petId: string,
  recordId: string,
  noteId: string,
  patch: UpdateNoteInput,
): Promise<HealthNote> {
  const note = await apiPut<HealthNote>(
    `/pets/${petId}/medical-records/${recordId}/notes/${noteId}`,
    patch,
  );
  invalidateRecords(petId);
  invalidateReminders(petId);
  return note;
}

export async function deleteNote(petId: string, recordId: string, noteId: string): Promise<void> {
  await apiDelete(`/pets/${petId}/medical-records/${recordId}/notes/${noteId}`);
  invalidateRecords(petId);
  invalidateReminders(petId);
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
