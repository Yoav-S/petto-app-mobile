import { apiGet } from './api';

export type BusinessCategory =
  | 'veterinarian'
  | 'groomer'
  | 'pharmacy'
  | 'pet_friendly'
  | 'pet_store';

export interface BusinessPlace {
  id: string;
  name: string;
  category: BusinessCategory;
  city: string;
  image: string | null;
  distance_km: number | null;
}

export function listNearbyBusinesses(
  latitude: number,
  longitude: number,
): Promise<BusinessPlace[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    limit: '20',
  });
  return apiGet<BusinessPlace[]>(`/businesses/nearby?${params.toString()}`);
}
