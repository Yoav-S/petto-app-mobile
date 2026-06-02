import { apiPost } from './api';
import type { UserProfile } from '@/types/api';

/** Upsert the Firebase user into MongoDB (idempotent). Call after every login/session restore. */
export async function syncUserWithBackend(): Promise<UserProfile> {
  return apiPost<UserProfile>('/users/me', {});
}
