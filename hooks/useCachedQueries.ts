import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfile } from '@/services/subscription';
import { listPets } from '@/services/pets';
import { listVaccinations, getVaccination } from '@/services/vaccines';
import { listReminders, getReminder, type ReminderTab } from '@/services/reminders';
import {
  listRecords,
  getRecord,
  enrichRecordsWithLatestNoteReminders,
  type RecordStatus,
} from '@/services/health';
import { queryKeys } from '@/services/queryKeys';
import type { Pet, Vaccination, Reminder, MedicalRecord, MedicalRecordDetail } from '@/types/api';

export function usePetsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.pets.all,
    queryFn: listPets,
    enabled,
  });
}

export function useVaccinationsQuery(petId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.vaccinations.all(petId ?? ''),
    queryFn: () => listVaccinations(petId!),
    enabled: Boolean(petId),
  });
}

export function useVaccinationQuery(petId: string | null | undefined, id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.vaccinations.detail(petId ?? '', id ?? ''),
    queryFn: () => getVaccination(petId!, id!),
    enabled: Boolean(petId && id),
  });
}

export function useRemindersQuery(petId: string | null | undefined, tab: ReminderTab) {
  return useQuery({
    queryKey: queryKeys.reminders.tab(petId ?? '', tab),
    queryFn: () => listReminders(petId!, tab),
    enabled: Boolean(petId),
  });
}

export function useReminderQuery(petId: string | null | undefined, id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.reminders.detail(petId ?? '', id ?? ''),
    queryFn: () => getReminder(petId!, id!),
    enabled: Boolean(petId && id),
  });
}

export function useRecordsQuery(
  petId: string | null | undefined,
  status: RecordStatus,
  opts?: { enrichReminders?: boolean },
) {
  const enrich = opts?.enrichReminders ?? false;
  return useQuery({
    queryKey: [...queryKeys.records.status(petId ?? '', status), enrich ? 'enriched' : 'plain'],
    queryFn: async () => {
      const list = await listRecords(petId!, status);
      if (!enrich) return list;
      return enrichRecordsWithLatestNoteReminders(petId!, list);
    },
    enabled: Boolean(petId),
  });
}

export function useRecordQuery(petId: string | null | undefined, id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.records.detail(petId ?? '', id ?? ''),
    queryFn: () => getRecord(petId!, id!),
    enabled: Boolean(petId && id),
  });
}

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: getMyProfile,
    enabled,
    staleTime: 30_000,
  });
}

/** Prefetch helpers for screens that know they'll need a domain next. */
export function usePrefetchPetDomain() {
  const qc = useQueryClient();
  return (petId: string) => {
    void qc.prefetchQuery({
      queryKey: queryKeys.vaccinations.all(petId),
      queryFn: () => listVaccinations(petId),
    });
    void qc.prefetchQuery({
      queryKey: queryKeys.reminders.tab(petId, 'today'),
      queryFn: () => listReminders(petId, 'today'),
    });
    void qc.prefetchQuery({
      queryKey: queryKeys.reminders.tab(petId, 'upcoming'),
      queryFn: () => listReminders(petId, 'upcoming'),
    });
    void qc.prefetchQuery({
      queryKey: queryKeys.records.status(petId, 'active'),
      queryFn: () => listRecords(petId, 'active'),
    });
  };
}

export type { Pet, Vaccination, Reminder, MedicalRecord, MedicalRecordDetail };
