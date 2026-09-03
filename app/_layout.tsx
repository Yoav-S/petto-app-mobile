import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import {
  Rubik_400Regular,
  Rubik_500Medium,
  useFonts,
} from '@expo-google-fonts/rubik';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { ToastProvider } from '@/context/ToastContext';
import QueryProvider from '@/context/QueryProvider';
import { PetStoreProvider, useSnapActivePetToIncluded } from '@/store/petStore';
import { PetOnboardingDraftProvider, usePetOnboardingDraft } from '@/store/petOnboardingDraft';
import { UpgradeLimitProvider } from '@/context/UpgradeLimitContext';
import { useReminderNotificationRouting } from '@/hooks/useReminderNotificationRouting';
import GlobalKeyboardDoneButton from '@/components/ui/GlobalKeyboardDoneButton';
import AppSplash from '@/components/ui/AppSplash';
import { SPLASH_BACKGROUND } from '@/constants/splash';
import { SystemBarsProvider } from '@/context/SystemBarsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Keep native splash until JS mounts, then hand off to AppSplash. */
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Brand splash minimum so cold start doesn't blink. */
const MIN_SPLASH_MS = 500;

function BootSpinner() {
  const { colors } = useTheme();
  return (
    <View style={styles.bootSpinner} pointerEvents="auto">
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

function RootLayoutNav() {
  const { user, isLoading, isSyncing, hasPets } = useAuth();
  const { resetDraft } = usePetOnboardingDraft();
  const segments = useSegments();
  const router = useRouter();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const mountedAtRef = useRef(Date.now());
  const hadUserRef = useRef(false);

  const group = segments[0] as string | undefined;
  const authScreen = segments[1] as string | undefined;
  const inAuthGroup = group === '(auth)';
  const inOnboardingGroup = group === '(onboarding)';
  const inTabsGroup = group === '(tabs)';
  const onVerifyEmail = authScreen === 'verify-email';
  const onTerms = authScreen === 'terms';
  const onEmail = authScreen === 'email';
  /** Welcome / lobby — not mid-auth flows. */
  const onAuthLobby = inAuthGroup && !onVerifyEmail && !onTerms && !onEmail;

  const emailVerified = Boolean(user?.emailVerified);
  const loggedOut = !isLoading && !user;
  const loggedInVerified = !isLoading && Boolean(user) && emailVerified;
  const loggedInUnverified = !isLoading && Boolean(user) && !emailVerified;
  const petsKnown = hasPets !== null;

  /** Tabs, onboarding, or any signed-in stack screen (reminders, settings, …). */
  const onAuthedAppSurface =
    inTabsGroup ||
    inOnboardingGroup ||
    (group != null && group !== '(auth)');

  useReminderNotificationRouting(emailVerified);
  useSnapActivePetToIncluded(loggedInVerified && hasPets === true);

  useEffect(() => {
    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = setTimeout(() => setMinSplashElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Leaving mid-onboarding via logout → wipe draft and land on welcome clean.
  useEffect(() => {
    if (user) {
      hadUserRef.current = true;
      return;
    }
    if (!isLoading && hadUserRef.current) {
      hadUserRef.current = false;
      resetDraft();
    }
  }, [user, isLoading, resetDraft]);

  useEffect(() => {
    if (isLoading || isSyncing) return;

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

    if (!user || !user.emailVerified || !petsKnown) return;

    // No first pet yet → must finish onboarding (never skip to home on cold start).
    if (hasPets === false && !inOnboardingGroup) {
      router.replace('/(onboarding)/name' as never);
      return;
    }

    // Has pets → app home (not welcome lobby / not stuck in onboarding).
    if (hasPets === true && (onAuthLobby || inOnboardingGroup)) {
      router.replace('/(tabs)' as never);
    }
  }, [
    user,
    isLoading,
    isSyncing,
    hasPets,
    petsKnown,
    inAuthGroup,
    inOnboardingGroup,
    onVerifyEmail,
    onTerms,
    onEmail,
    onAuthLobby,
    router,
  ]);

  /**
   * Brand splash: auth unknown, min time, or still routing a guest onto welcome.
   * Never reveal tabs/welcome underneath during those moments.
   */
  const showBrandSplash =
    isLoading ||
    !minSplashElapsed ||
    (loggedOut && !inAuthGroup) ||
    (loggedInUnverified && onAuthLobby);

  /**
   * After splash, logged-in users still on the auth lobby (or mid-replace)
   * get a spinner — not a peek at welcome — until home/onboarding is up.
   */
  const showRedirectSpinner =
    !showBrandSplash &&
    loggedInVerified &&
    (!petsKnown || isSyncing || !onAuthedAppSurface);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack>
      {showBrandSplash ? <AppSplash /> : null}
      {showRedirectSpinner ? <BootSpinner /> : null}
    </View>
  );
}

function ThemedApp() {
  const { isDark, colors } = useTheme();
  const { locale } = useLocale();
  const [fontsLoaded, fontError] = useFonts({
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Medium': Rubik_500Medium,
  });

  // Keep the native splash visible until the actual Rubik weights are ready.
  if (!fontsLoaded && !fontError) return null;

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  return (
    <NavThemeProvider value={navTheme}>
      <SystemBarsProvider isDark={isDark}>
        <ToastProvider>
            <UpgradeLimitProvider>
            <View style={{ flex: 1 }}>
              <View key={locale} style={{ flex: 1, backgroundColor: colors.background }}>
                <RootLayoutNav />
              </View>
              <GlobalKeyboardDoneButton />
            </View>
            </UpgradeLimitProvider>
        </ToastProvider>
      </SystemBarsProvider>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <QueryProvider>
              <PetStoreProvider>
                <PetOnboardingDraftProvider>
                  <ThemedApp />
                </PetOnboardingDraftProvider>
              </PetStoreProvider>
            </QueryProvider>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bootSpinner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    elevation: 10000,
  },
});
