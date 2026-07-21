import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
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

function ThemedApp() {
  const { isDark, colors } = useTheme();
  const { locale } = useLocale();

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  return (
    <NavThemeProvider value={navTheme}>
      {/* Re-key on locale so every `t()` call re-evaluates when the language changes. */}
      <View key={locale} style={{ flex: 1, backgroundColor: colors.background }}>
        <RootLayoutNav />
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <PetStoreProvider>
            <PetOnboardingDraftProvider>
              <ThemedApp />
            </PetOnboardingDraftProvider>
          </PetStoreProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
