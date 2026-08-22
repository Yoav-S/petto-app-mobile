import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Vaccination } from '@/types/api';
import { invalidateVaccinations } from '@/services/queryClient';
import { buildCursorQuery, type CursorListParams } from '@/utils/cursorPagination';

export type { CursorListParams };

export interface CreateVaccinationInput {
  name: string;
  date: string;
  next_date?: string | null;
  note?: string | null;
  photo_url?: string | null;
  vet_clinic?: string | null;
}

export type UpdateVaccinationInput = Partial<CreateVaccinationInput>;

export function listVaccinations(
  petId: string,
  params?: CursorListParams,
): Promise<Vaccination[]> {
  return apiGet<Vaccination[]>(`/pets/${petId}/vaccinations${buildCursorQuery(params)}`);
}

export async function createVaccination(
  petId: string,
  input: CreateVaccinationInput,
): Promise<Vaccination> {
  const row = await apiPost<Vaccination>(`/pets/${petId}/vaccinations`, input);
  invalidateVaccinations(petId);
  return row;
}

export function getVaccination(petId: string, id: string): Promise<Vaccination> {
  return apiGet<Vaccination>(`/pets/${petId}/vaccinations/${id}`);
}

export async function updateVaccination(
  petId: string,
  id: string,
  patch: UpdateVaccinationInput,
): Promise<Vaccination> {
  const row = await apiPatch<Vaccination>(`/pets/${petId}/vaccinations/${id}`, patch);
  invalidateVaccinations(petId);
  return row;
}

export async function deleteVaccination(petId: string, id: string): Promise<void> {
  await apiDelete(`/pets/${petId}/vaccinations/${id}`);
  invalidateVaccinations(petId);
}
