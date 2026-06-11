import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PetStoreProvider } from '@/store/petStore';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const onVerifyEmail = (segments[1] as string) === 'verify-email';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
      return;
    }

    // Firebase session only exists after OTP verify (custom token). Block stale/unverified sessions.
    if (user && !user.emailVerified && !onVerifyEmail) {
      router.replace('/(auth)/login' as any);
      return;
    }

    if (user && user.emailVerified && inAuthGroup && !onVerifyEmail) {
      router.replace('/(tabs)' as any);
    }
  }, [user, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <PetStoreProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </PetStoreProvider>
    </AuthProvider>
  );
}
