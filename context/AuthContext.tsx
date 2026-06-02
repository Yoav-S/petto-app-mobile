import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, sendEmailVerification } from 'firebase/auth';
import auth from '@/services/firebaseAuth';
import { syncUserWithBackend } from '@/services/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retryBackendSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isSyncing: false,
  syncError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resendVerificationEmail: async () => {},
  refreshUser: async () => {},
  retryBackendSync: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? webClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? webClientId,
  });

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
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch(error => {
        console.error("Firebase Google Auth Error:", error);
      });
    } else if (response?.type === 'error') {
      console.error("Google Auth Error:", response.error, response.params);
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (!request) {
      console.error("Google Sign-In Error: auth request not ready (check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)");
      return;
    }
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-out Error:", error);
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  };

  const retryBackendSync = async () => {
    if (!auth.currentUser) return;
    await runBackendSync(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSyncing,
        syncError,
        signInWithGoogle,
        signOut,
        resendVerificationEmail,
        refreshUser,
        retryBackendSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
