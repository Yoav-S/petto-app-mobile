import { apiGet } from './api';

export type BusinessCategory =
  | 'veterinarian'
  | 'groomer'
  | 'pharmacy'
  | 'pet_friendly'
  | 'pet_store';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface BusinessPlace {
  id: string;
  name: string;
  category: BusinessCategory;
  city: string;
  image: string | null;
  distance_km: number | null;
  rating?: number | null;
  open_now?: boolean;
  open_24_7?: boolean;
  closes_at?: string | null;
  opens_at?: string | null;
  next_open_day?: Weekday | null;
  opens_tomorrow?: boolean;
}

export interface BusinessPlacePage {
  items: BusinessPlace[];
  has_more: boolean;
}

const PAGE_SIZE = 15;

export function listPlaces(options: {
  latitude?: number;
  longitude?: number;
  offset?: number;
}): Promise<BusinessPlacePage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(options.offset ?? 0),
  });
  if (options.latitude != null && options.longitude != null) {
    params.set('latitude', String(options.latitude));
    params.set('longitude', String(options.longitude));
  }
  return apiGet<BusinessPlace[] | BusinessPlacePage>(
    `/businesses/nearby?${params.toString()}`,
  ).then((data) => {
    if (Array.isArray(data)) {
      return { items: data, has_more: data.length >= PAGE_SIZE };
    }
    return { items: data.items ?? [], has_more: Boolean(data.has_more) };
  });
}
