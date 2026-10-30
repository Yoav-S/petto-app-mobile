import { apiDelete, apiGet, apiPost } from './api';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

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
  categories?: BusinessCategory[];
  city: string;
  image: string | null;
  distance_km: number | null;
  rating?: number | null;
  open_now?: boolean;
  open_24_7?: boolean;
  some_services_closed?: boolean;
  closes_at?: string | null;
  opens_at?: string | null;
  next_open_day?: Weekday | null;
  opens_tomorrow?: boolean;
  address?: string;
  location_count?: number;
  location_id?: string | null;
}

export interface BusinessPlacePage {
  items: BusinessPlace[];
  has_more: boolean;
}

export interface TimeSlot {
  open: string;
  close: string;
}

export interface SpecialDate {
  date: string;
  closed: boolean;
  slots: TimeSlot[];
}

export interface OpeningHours {
  provided?: boolean;
  always_open?: boolean;
  mon: TimeSlot[];
  tue: TimeSlot[];
  wed: TimeSlot[];
  thu: TimeSlot[];
  fri: TimeSlot[];
  sat: TimeSlot[];
  sun: TimeSlot[];
  special_dates?: SpecialDate[];
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

export interface PlaceService {
  id: string;
  category: BusinessCategory;
  opening_hours: OpeningHours;
  phone: string[];
}

export interface PlaceLocation {
  id: string;
  address: string;
  city: string;
  opening_hours: OpeningHours;
  phone: string[];
  call_phone: string[];
  shared_phone: boolean;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  distance_km: number | null;
  categories?: BusinessCategory[];
  services?: PlaceService[];
  photo?: string | null;
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
  locations?: PlaceLocation[];
}

const PAGE_SIZE = 15;

export type NearbyCoords = { latitude: number; longitude: number };

/** Two addresses of the same business are two cards. */
export function placeKey(place: BusinessPlace): string {
  return place.location_id ? `${place.id}:${place.location_id}` : place.id;
}

type NearbySnapshot = { items: BusinessPlace[]; hasMore: boolean };

const nearbySnapshots = new Map<string, NearbySnapshot>();
let lastNearbyCoords: NearbyCoords | null = null;

function nearbyKey(coords: NearbyCoords | null, category: BusinessCategory | null): string {
  const lat = coords ? coords.latitude.toFixed(3) : '';
  const lng = coords ? coords.longitude.toFixed(3) : '';
  return `${lat},${lng},${category ?? ''}`;
}

export function readLastNearbyCoords(): NearbyCoords | null {
  return lastNearbyCoords;
}

/** Last list for this spot and category. A category with no own page falls back to the mixed nearby list. */
export function readNearby(
  coords: NearbyCoords | null,
  category: BusinessCategory | null,
): NearbySnapshot | null {
  const exact = nearbySnapshots.get(nearbyKey(coords, category));
  if (exact) return exact;
  if (!category) return null;
  const mixed = nearbySnapshots.get(nearbyKey(coords, null));
  if (!mixed) return null;
  const items = mixed.items.filter(
    (item) => item.category === category || item.categories?.includes(category),
  );
  return items.length ? { items, hasMore: false } : null;
}

export function rememberNearbyCoords(coords: NearbyCoords): void {
  lastNearbyCoords = coords;
}

export function rememberNearby(
  coords: NearbyCoords | null,
  category: BusinessCategory | null,
  items: BusinessPlace[],
  hasMore: boolean,
): void {
  if (coords) lastNearbyCoords = coords;
  nearbySnapshots.set(nearbyKey(coords, category), { items, hasMore });
}

export function clearNearbyCache(): void {
  nearbySnapshots.clear();
  lastNearbyCoords = null;
}

export function listPlaces(options: {
  latitude?: number;
  longitude?: number;
  offset?: number;
  category?: BusinessCategory;
}): Promise<BusinessPlacePage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(options.offset ?? 0),
  });
  if (options.latitude != null && options.longitude != null) {
    params.set('latitude', String(options.latitude));
    params.set('longitude', String(options.longitude));
  }
  if (options.category) params.set('category', options.category);
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

export function listPlaceReviews(
  id: string,
  options: { limit: number; cursor?: string },
): Promise<PlaceReview[]> {
  const params = new URLSearchParams({ limit: String(options.limit) });
  if (options.cursor) params.set('cursor', options.cursor);
  return apiGet<PlaceReview[]>(`/businesses/${id}/reviews?${params.toString()}`);
}

/** Newest first. Replaces this user's previous review. */
export function upsertOwnReview(list: PlaceReview[], review: PlaceReview): PlaceReview[] {
  const next = { ...review, is_mine: true };
  return [next, ...list.filter((item) => item.id !== next.id && !item.is_mine)];
}

/** Keep the reviews list cache in step with a review that was just saved. */
export function rememberPlaceReview(businessId: string, review: PlaceReview): void {
  const key = queryKeys.businesses.reviews(businessId);
  const cached = queryClient.getQueryData<PlaceReview[]>(key) ?? [];
  queryClient.setQueryData(key, upsertOwnReview(cached, review));
  if (
    openedReview
    && openedReview.businessId === businessId
    && (openedReview.review.id === review.id || openedReview.review.is_mine)
  ) {
    openedReview = { businessId, review: { ...review, is_mine: true } };
  }
}

let openedReview: { businessId: string; review: PlaceReview } | null = null;

/** Hold the tapped review so the full-screen view keeps the photo and menu. */
export function rememberOpenedReview(businessId: string, review: PlaceReview): void {
  openedReview = { businessId, review };
}

export function readOpenedReview(businessId: string, reviewId: string): PlaceReview | null {
  if (
    openedReview
    && openedReview.businessId === businessId
    && openedReview.review.id === reviewId
  ) {
    return openedReview.review;
  }
  const cached = queryClient.getQueryData<PlaceReview[]>(queryKeys.businesses.reviews(businessId));
  return cached?.find((item) => item.id === reviewId) ?? null;
}

export function forgetOpenedReview(businessId: string, reviewId: string): void {
  if (
    openedReview
    && openedReview.businessId === businessId
    && openedReview.review.id === reviewId
  ) {
    openedReview = null;
  }
  const key = queryKeys.businesses.reviews(businessId);
  const cached = queryClient.getQueryData<PlaceReview[]>(key);
  if (cached) {
    queryClient.setQueryData(
      key,
      cached.filter((item) => item.id !== reviewId),
    );
  }
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

export function deletePlaceReview(id: string): Promise<void> {
  return apiDelete(`/businesses/${id}/reviews`);
}

export type ReviewReportReason = 'spam' | 'offensive' | 'fake' | 'irrelevant';

export function reportPlaceReview(
  businessId: string,
  reviewId: string,
  reason: ReviewReportReason,
): Promise<void> {
  return apiPost<void>(`/businesses/${businessId}/reviews/${reviewId}/report`, { reason });
}
