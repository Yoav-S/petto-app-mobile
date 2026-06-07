import { signInWithCustomToken } from 'firebase/auth';
import auth from './firebaseAuth';
import { apiPost, apiPostPublic } from './api';
import type { UserProfile } from '@/types/api';

interface AuthMessage {
  message: string;
}

interface VerifyOtpResult {
  custom_token: string;
}

/** In-memory only — email between send-otp and verify screens. Never persist or route-param. */
let pendingEmail: string | null = null;

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
  await signInWithCustomToken(auth, custom_token);
  clearPendingEmail();
  return syncUserWithBackend();
}

/** Resend OTP (respect server 20s cooldown). */
export async function resendOtp(email: string): Promise<AuthMessage> {
  return apiPostPublic<AuthMessage>('/auth/resend-otp', { email });
}

/** Upsert Firebase user in MongoDB — updates last_login_at. Called after every login/session restore. */
export async function syncUserWithBackend(): Promise<UserProfile> {
  return apiPost<UserProfile>('/users/me', {});
}
