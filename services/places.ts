import { apiGet, apiPost } from './api';

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

export interface TimeSlot {
  open: string;
  close: string;
}

export interface OpeningHours {
  always_open?: boolean;
  mon: TimeSlot[];
  tue: TimeSlot[];
  wed: TimeSlot[];
  thu: TimeSlot[];
  fri: TimeSlot[];
  sat: TimeSlot[];
  sun: TimeSlot[];
}

export interface PlaceReview {
  id: string;
  author_name: string;
  author_photo: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  is_mine?: boolean;
}

export interface BusinessPlaceDetail extends BusinessPlace {
  description: string | null;
  address: string;
  phone: string[];
  website: string | null;
  instagram: string | null;
  opening_hours: OpeningHours;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  reviews: PlaceReview[];
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

export function getPlace(
  id: string,
  coords?: { latitude: number; longitude: number },
): Promise<BusinessPlaceDetail> {
  const params = new URLSearchParams();
  if (coords) {
    params.set('latitude', String(coords.latitude));
    params.set('longitude', String(coords.longitude));
  }
  const query = params.toString();
  return apiGet<BusinessPlaceDetail>(`/businesses/${id}${query ? `?${query}` : ''}`);
}

export function savePlaceReview(
  id: string,
  body: { rating: number; comment?: string | null },
): Promise<PlaceReview> {
  return apiPost<PlaceReview>(`/businesses/${id}/reviews`, {
    rating: body.rating,
    comment: body.comment?.trim() || null,
  });
}
