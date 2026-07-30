import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { ToastProvider } from '@/context/ToastContext';
import { PetStoreProvider } from '@/store/petStore';
import { PetOnboardingDraftProvider } from '@/store/petOnboardingDraft';
import { useReminderNotificationRouting } from '@/hooks/useReminderNotificationRouting';
import GlobalKeyboardDoneButton, {
  KeyboardDoneClaimProvider,
} from '@/components/ui/GlobalKeyboardDoneButton';
import AppSplash from '@/components/ui/AppSplash';
import { SPLASH_BACKGROUND } from '@/constants/splash';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Keep native splash until JS mounts, then hand off to AppSplash. */
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Brand splash minimum so cold start doesn't blink. */
const MIN_SPLASH_MS = 500;

function BootSpinner() {
  return (
    <View style={styles.bootSpinner} pointerEvents="auto">
      <ActivityIndicator size="large" color="#004741" />
    </View>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const mountedAtRef = useRef(Date.now());

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

  /** Tabs, onboarding, or any signed-in stack screen (reminders, settings, …). */
  const onAuthedAppSurface =
    inTabsGroup ||
    inOnboardingGroup ||
    (group != null && group !== '(auth)');

  useReminderNotificationRouting(emailVerified);

  useEffect(() => {
    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = setTimeout(() => setMinSplashElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading) return;

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

    if (user && user.emailVerified && onAuthLobby) {
      router.replace('/(tabs)' as never);
    }
  }, [
    user,
    isLoading,
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
    !showBrandSplash && loggedInVerified && !onAuthedAppSurface;

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

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  return (
    <NavThemeProvider value={navTheme}>
      <ToastProvider>
        <KeyboardDoneClaimProvider>
          <View key={locale} style={{ flex: 1, backgroundColor: colors.background }}>
            <RootLayoutNav />
            <GlobalKeyboardDoneButton />
          </View>
        </KeyboardDoneClaimProvider>
      </ToastProvider>
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
