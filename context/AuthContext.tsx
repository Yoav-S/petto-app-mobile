import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import auth from '@/services/firebaseAuth';
import { syncUserWithBackend } from '@/services/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'petto';

function mapFirebaseGoogleError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('auth/account-exists-with-different-credential')) {
    return 'This email is already registered with email/password. Log in with your password instead.';
  }
  if (message.includes('auth/invalid-credential')) {
    return 'Google sign-in failed. Check Firebase Google provider and OAuth client IDs.';
  }
  return 'Could not sign in with Google. Please try again.';
}

function mapGoogleOAuthError(
  error: AuthSession.AuthError | null | undefined,
  params: Record<string, string> | undefined,
): string {
  const code = error?.code ?? params?.error ?? '';
  const description = error?.message ?? params?.error_description ?? '';

  if (code === 'access_denied') {
    return 'Google access was denied. If the app is in Testing mode, add your Gmail under Google Cloud → Audience → Test users.';
  }
  if (code === 'invalid_client' || description.includes('invalid_client')) {
    return 'Google OAuth client mismatch. Use an EAS development build and set Android/iOS client IDs in .env (see .env.example).';
  }
  if (description.includes('OAuth 2.0 policy') || description.includes('validation rules')) {
    return 'Google blocked sign-in (OAuth policy). Add yourself as a test user in Google Cloud → Audience, and enable Google in Firebase → Authentication.';
  }
  if (description) return description;
  return 'Google sign-in failed. Try again or use email/password.';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  isGoogleLoading: boolean;
  googleAuthError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  retryBackendSync: () => Promise<void>;
  clearGoogleAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isSyncing: false,
  syncError: null,
  isGoogleLoading: false,
  googleAuthError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  retryBackendSync: async () => {},
  clearGoogleAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
  // Native hooks require platform client IDs — fall back to web ID so the app loads
  // in Expo Go. Use dedicated Android/iOS IDs from Firebase for production Google login.
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId || undefined;
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || webClientId || undefined;

  const googleEnabled = Boolean(webClientId);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId,
      iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
      androidClientId: Platform.OS === 'android' ? androidClientId : undefined,
      selectAccount: true,
    },
    { scheme: APP_SCHEME },
  );

  const runBackendSync = useCallback(async (firebaseUser: User) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await syncUserWithBackend();
    } catch (error) {
      console.error('Backend auth handshake failed:', error);
      setSyncError(
        error instanceof Error ? error.message : 'Could not connect to the server.',
      );
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await runBackendSync(currentUser);
      } else {
        setSyncError(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [runBackendSync]);

  useEffect(() => {
    if (!response) return;

    setIsGoogleLoading(false);

    if (response.type === 'success') {
      const idToken = response.params.id_token;
      if (!idToken) {
        setGoogleAuthError(
          'Google did not return an ID token. On a phone, build a development client with EAS (Expo Go has limited Google support).',
        );
        return;
      }

      setGoogleAuthError(null);
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch(error => {
        console.error('Firebase Google Auth Error:', error);
        setGoogleAuthError(mapFirebaseGoogleError(error));
      });
      return;
    }

    if (response.type === 'error') {
      setGoogleAuthError(mapGoogleOAuthError(response.error, response.params));
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (!googleEnabled) {
      setGoogleAuthError(
        'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env and restart Expo.',
      );
      return;
    }
    if (Platform.OS === 'android' && !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      setGoogleAuthError(
        'Google on Android needs EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (add SHA-1 in Firebase, then rebuild). Use email OTP for now.',
      );
      return;
    }
    if (!request) {
      setGoogleAuthError('Google Sign-In is still initializing. Wait a moment and try again.');
      return;
    }

    setGoogleAuthError(null);
    setIsGoogleLoading(true);

    try {
      const result = await promptAsync();
      if (result.type === 'dismiss' || result.type === 'cancel') {
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setIsGoogleLoading(false);
      setGoogleAuthError(
        error instanceof Error ? error.message : 'Google sign-in failed.',
      );
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out Error:', error);
    }
  };

  const retryBackendSync = async () => {
    if (!auth.currentUser) return;
    await runBackendSync(auth.currentUser);
  };

  const clearGoogleAuthError = () => setGoogleAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSyncing,
        syncError,
        isGoogleLoading,
        googleAuthError,
        signInWithGoogle,
        signOut,
        retryBackendSync,
        clearGoogleAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
