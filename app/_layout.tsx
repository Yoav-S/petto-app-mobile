import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PetStoreProvider } from '@/store/petStore';
import { PetOnboardingDraftProvider } from '@/store/petOnboardingDraft';

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
    const authScreen = segments[1] as string | undefined;
    const onVerifyEmail = authScreen === 'verify-email';
    const onTerms = authScreen === 'terms';
    const onEmail = authScreen === 'email';
    const inOnboardingGroup = (segments[0] as string) === '(onboarding)';

    if (!user && !inAuthGroup && !inOnboardingGroup) {
      router.replace('/(auth)/' as never);
      return;
    }

    if (!user && inOnboardingGroup) {
      router.replace('/(auth)/' as never);
      return;
    }

    if (user && !user.emailVerified && !onVerifyEmail && !onTerms && !onEmail) {
      router.replace('/(auth)/' as never);
      return;
    }

    if (user && user.emailVerified && inAuthGroup && !onVerifyEmail && !onTerms && !onEmail) {
      router.replace('/(tabs)' as never);
      return;
    }

    if (user && user.emailVerified && inOnboardingGroup) {
      return;
    }
  }, [user, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <PetStoreProvider>
        <PetOnboardingDraftProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ThemeProvider>
        </PetOnboardingDraftProvider>
      </PetStoreProvider>
    </AuthProvider>
  );
}
