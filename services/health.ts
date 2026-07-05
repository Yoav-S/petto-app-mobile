import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/services/api';
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
