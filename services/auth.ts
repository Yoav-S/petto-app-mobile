import { signInWithCustomToken, signOut } from 'firebase/auth';
import auth from './firebaseAuth';
import { apiPost, apiPostPublic, apiDelete } from './api';
import { t } from '@/i18n';
import type { UserProfile } from '@/types/api';

interface AuthMessage {
  message: string;
}

interface VerifyOtpResult {
  custom_token: string;
}

/** In-memory only — email between send-otp and verify screens. Never persist or route-param. */
let pendingEmail: string | null = null;
let verifyScreenMessage: string | null = null;

export function setVerifyScreenMessage(message: string): void {
  verifyScreenMessage = message;
}

export function consumeVerifyScreenMessage(): string | null {
  const message = verifyScreenMessage;
  verifyScreenMessage = null;
  return message;
}

export function setPendingEmail(email: string): void {
  pendingEmail = email;
}

export function getPendingEmail(): string | null {
  return pendingEmail;
}

export function clearPendingEmail(): void {
  pendingEmail = null;
}

/** Signup + login step 1 — server sends 6-digit OTP to email. */
export async function sendOtp(email: string): Promise<AuthMessage> {
  return apiPostPublic<AuthMessage>('/auth/send-otp', { email });
}

/** Signup + login step 2 — verify OTP, sign in with Firebase custom token. */
export async function verifyOtpAndSignIn(email: string, otp: string): Promise<UserProfile> {
  const { custom_token } = await apiPostPublic<VerifyOtpResult>('/auth/verify-otp', {
    email,
    otp,
  });
  try {
    await signInWithCustomToken(auth, custom_token);
  } catch (error) {
    console.error('Firebase sign-in after OTP failed:', error);
    throw new Error(t('errors.firebase_signin_failed'));
  }
  clearPendingEmail();
  return syncUserWithBackend();
}

/** Resend OTP (respect server 20s cooldown). */
export async function resendOtp(email: string): Promise<AuthMessage> {
  return apiPostPublic<AuthMessage>('/auth/resend-otp', { email });
}

/**
 * Permanently delete the account and all its data (server cascades pets,
 * records, reminders, push tokens, storage files, and the Firebase Auth user).
 * The caller should sign out afterwards to clear the local session.
 */
export async function deleteAccount(): Promise<void> {
  await apiDelete('/users/me');
}

/** Upsert Firebase user in MongoDB — updates last_login_at. Called after every login/session restore. */
export async function syncUserWithBackend(): Promise<UserProfile> {
  const profile = await apiPost<UserProfile>('/users/me', {});
  if (profile.auth_provider === 'email' && !profile.email_verified) {
    await signOut(auth);
    throw new Error(t('errors.email_not_verified'));
  }
  return profile;
}
