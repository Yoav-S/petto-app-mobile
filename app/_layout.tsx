import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { onboardingHref, replaceWithWelcome } from '@/utils/onboardingRoute';
import { UpgradeLimitProvider } from '@/context/UpgradeLimitContext';
import { ReminderPromptProvider } from '@/context/ReminderPromptContext';
import { useReminderNotificationRouting } from '@/hooks/useReminderNotificationRouting';
import AppSplash from '@/components/ui/AppSplash';
import { SPLASH_DARK, SPLASH_LIGHT } from '@/constants/splash';
import { SystemBarsProvider } from '@/context/SystemBarsContext';
import { useCompactPortraitLock } from '@/hooks/useCompactPortraitLock';
import AnalyticsConsentPrompt from '@/components/AnalyticsConsentPrompt';
import { CREATE_SCREEN_OPTIONS, SIDE_ANIMATION } from '@/constants/screenAnimations';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * The native splash has no wordmark, so it is hidden from AppSplash's onLayout
 * (never from an effect) once the JS splash with "Ragly" has painted beneath it.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {});
try {
  SplashScreen.setOptions({ fade: false, duration: 0 });
} catch {
  // Expo Go may not support setOptions.
}

const MIN_SPLASH_MS = 500;

let nativeSplashHidden = false;
function hideNativeSplashOnce() {
  if (nativeSplashHidden) return;
  nativeSplashHidden = true;
  void SplashScreen.hideAsync().catch(() => {});
}

let bootSplashDismissed = false;

function RootLayoutNav({ onBootReady }: { onBootReady: () => void }) {
  useLocale();
  const { colors, isDark } = useTheme();
  const { user, isLoading, isSyncing, hasPets, hasAccountName, onboardingResume } = useAuth();
  const { resetDraft } = usePetOnboardingDraft();
  const segments = useSegments();
  const router = useRouter();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const mountedAtRef = useRef(Date.now());
  const hadUserRef = useRef(false);
  const bootReadyRef = useRef(false);

  const group = segments[0] as string | undefined;
  const authScreen = segments[1] as string | undefined;
  const inAuthGroup = group === '(auth)';
  const inOnboardingGroup = group === '(onboarding)';
  const inTabsGroup = group === '(tabs)';
  const onVerifyEmail = authScreen === 'verify-email';
  const onTerms = authScreen === 'terms';
  const onEmail = authScreen === 'email';
  const onYourName = authScreen === 'your-name';
  const onAuthLobby = inAuthGroup && !onVerifyEmail && !onTerms && !onEmail;

  const emailVerified = Boolean(user?.emailVerified);
  const loggedOut = !isLoading && !user;
  const loggedInVerified = !isLoading && Boolean(user) && emailVerified;
  const loggedInUnverified = !isLoading && Boolean(user) && !emailVerified;
  const petsKnown = hasPets !== null;
  const nameKnown = hasAccountName !== null;

  const onAuthedAppSurface =
    inTabsGroup ||
    inOnboardingGroup ||
    onYourName ||
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
      replaceWithWelcome(router);
      return;
    }

    if (!user && (inOnboardingGroup || onYourName)) {
      replaceWithWelcome(router);
      return;
    }

    if (user && !user.emailVerified && !onVerifyEmail && !onTerms && !onEmail) {
      replaceWithWelcome(router);
      return;
    }

    if (!user || !user.emailVerified || !petsKnown || !nameKnown) return;

    if (!hasAccountName && !onYourName) {
      router.replace('/(auth)/your-name' as never);
      return;
    }
    if (!hasAccountName) return;

    if (hasPets === false && !inOnboardingGroup) {
      router.replace(onboardingHref(onboardingResume?.step) as never);
      return;
    }

    if (hasPets === true && (onAuthLobby || inOnboardingGroup || onYourName)) {
      router.replace('/(tabs)' as never);
    }
  }, [
    user,
    isLoading,
    isSyncing,
    hasPets,
    hasAccountName,
    petsKnown,
    nameKnown,
    inAuthGroup,
    inOnboardingGroup,
    onVerifyEmail,
    onTerms,
    onEmail,
    onYourName,
    onAuthLobby,
    onboardingResume?.step,
    router,
  ]);

  const wantSplash =
    isLoading ||
    !minSplashElapsed ||
    (loggedOut && !inAuthGroup) ||
    (loggedInUnverified && onAuthLobby) ||
    (loggedInVerified && (!petsKnown || !nameKnown || !onAuthedAppSurface));

  useEffect(() => {
    if (wantSplash || bootReadyRef.current) return;
    bootReadyRef.current = true;
    onBootReady();
  }, [wantSplash, onBootReady]);

  const bootCanvas = isDark ? SPLASH_DARK.background : SPLASH_LIGHT.background;
  const canvas = wantSplash ? bootCanvas : colors.background;

  return (
    <View style={[styles.root, { backgroundColor: canvas }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: canvas },
          animation: SIDE_ANIMATION,
          animationTypeForReplace: 'push',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="reminders/add" options={CREATE_SCREEN_OPTIONS} />
        <Stack.Screen name="pets/add" options={CREATE_SCREEN_OPTIONS} />
        <Stack.Screen name="topics/add-note" options={CREATE_SCREEN_OPTIONS} />
        <Stack.Screen
          name="topics/add"
          options={({ route }) =>
            (route.params as { id?: string } | undefined)?.id
              ? { animation: SIDE_ANIMATION }
              : CREATE_SCREEN_OPTIONS
          }
        />
        <Stack.Screen
          name="vaccines"
          options={({ route }) =>
            (route.params as { screen?: string } | undefined)?.screen === 'add'
              ? CREATE_SCREEN_OPTIONS
              : { animation: SIDE_ANIMATION }
          }
        />
      </Stack>
    </View>
  );
}

function AppTree({
  onBootReady,
  bootReady,
  splashPalette,
}: {
  onBootReady: () => void;
  bootReady: boolean;
  splashPalette: typeof SPLASH_LIGHT | typeof SPLASH_DARK;
}) {
  const { isDark, colors } = useTheme();
  useCompactPortraitLock();

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  return (
    <NavThemeProvider value={navTheme}>
      <SystemBarsProvider isDark={isDark}>
        <ToastProvider>
          <UpgradeLimitProvider>
            <ReminderPromptProvider>
              <View
                style={{
                  flex: 1,
                  backgroundColor: bootReady
                    ? colors.background
                    : splashPalette.background,
                }}
              >
                <RootLayoutNav onBootReady={onBootReady} />
                <AnalyticsConsentPrompt ready={bootReady} />
                {!bootReady ? (
                  <AppSplash palette={splashPalette} onReady={hideNativeSplashOnce} />
                ) : null}
                {bootReady ? (
                  <View
                    collapsable={false}
                    pointerEvents="none"
                    style={styles.hideSentinel}
                    onLayout={hideNativeSplashOnce}
                  />
                ) : null}
              </View>
            </ReminderPromptProvider>
          </UpgradeLimitProvider>
        </ToastProvider>
      </SystemBarsProvider>
    </NavThemeProvider>
  );
}

function RootShell() {
  const { isDark, ready: themeReady } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Medium': Rubik_500Medium,
  });
  const [bootReady, setBootReady] = useState(() => bootSplashDismissed);
  const splashPaletteRef = useRef<typeof SPLASH_LIGHT | typeof SPLASH_DARK | null>(null);

  const onBootReady = useCallback(() => {
    bootSplashDismissed = true;
    setBootReady(true);
  }, []);

  const ready = themeReady && (fontsLoaded || Boolean(fontError));
  if (ready && splashPaletteRef.current == null) {
    splashPaletteRef.current = isDark ? SPLASH_DARK : SPLASH_LIGHT;
  }
  const splashPalette = splashPaletteRef.current;
  const bootCanvas =
    splashPalette?.background ??
    (isDark ? SPLASH_DARK.background : SPLASH_LIGHT.background);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: bootCanvas }]}>
      {ready && splashPalette ? (
        <LocaleProvider>
          <AuthProvider>
            <QueryProvider>
              <PetStoreProvider>
                <PetOnboardingDraftProvider>
                  <AppTree
                    onBootReady={onBootReady}
                    bootReady={bootReady}
                    splashPalette={splashPalette}
                  />
                </PetOnboardingDraftProvider>
              </PetStoreProvider>
            </QueryProvider>
          </AuthProvider>
        </LocaleProvider>
      ) : null}
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootShell />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hideSentinel: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
});
