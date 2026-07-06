import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Vaccination } from '@/types/api';

export interface CreateVaccinationInput {
  name: string;
  date: string;
  next_date?: string | null;
  note?: string | null;
  photo_url?: string | null;
  vet_clinic?: string | null;
}

export type UpdateVaccinationInput = Partial<CreateVaccinationInput>;

export function listVaccinations(petId: string): Promise<Vaccination[]> {
  return apiGet<Vaccination[]>(`/pets/${petId}/vaccinations`);
}

export function createVaccination(
  petId: string,
  input: CreateVaccinationInput,
): Promise<Vaccination> {
  return apiPost<Vaccination>(`/pets/${petId}/vaccinations`, input);
}

export function getVaccination(petId: string, id: string): Promise<Vaccination> {
  return apiGet<Vaccination>(`/pets/${petId}/vaccinations/${id}`);
}

export function updateVaccination(
  petId: string,
  id: string,
  patch: UpdateVaccinationInput,
): Promise<Vaccination> {
  return apiPatch<Vaccination>(`/pets/${petId}/vaccinations/${id}`, patch);
}

export function deleteVaccination(petId: string, id: string): Promise<void> {
  return apiDelete(`/pets/${petId}/vaccinations/${id}`);
}
