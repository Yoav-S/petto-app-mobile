import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme, useColors } from '@/context/ThemeContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { ToastProvider } from '@/context/ToastContext';
import { PetStoreProvider } from '@/store/petStore';
import { PetOnboardingDraftProvider } from '@/store/petOnboardingDraft';
import { useReminderNotificationRouting } from '@/hooks/useReminderNotificationRouting';
import GlobalKeyboardDoneButton, {
  KeyboardDoneClaimProvider,
} from '@/components/ui/GlobalKeyboardDoneButton';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthBootstrapSpinner() {
  const colors = useColors();
  return (
    <View style={[styles.bootstrap, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  /** Keep spinner up until auth is known and the first route decision is applied. */
  const [routeReady, setRouteReady] = useState(false);

  useReminderNotificationRouting(Boolean(user?.emailVerified));

  useEffect(() => {
    if (isLoading) {
      setRouteReady(false);
      return;
    }

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const authScreen = segments[1] as string | undefined;
    const onVerifyEmail = authScreen === 'verify-email';
    const onTerms = authScreen === 'terms';
    const onEmail = authScreen === 'email';
    const inOnboardingGroup = (segments[0] as string) === '(onboarding)';
    const inTabsGroup = (segments[0] as string) === '(tabs)';

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
      setRouteReady(true);
      return;
    }

    // On the correct surface for this session — lift the spinner.
    if (!user && inAuthGroup) {
      setRouteReady(true);
      return;
    }
    if (user && !user.emailVerified && (onVerifyEmail || onTerms || onEmail)) {
      setRouteReady(true);
      return;
    }
    if (user && user.emailVerified && inTabsGroup) {
      setRouteReady(true);
      return;
    }

    // Fallback: allow UI once auth is known even if segment is an app stack screen.
    if (user && user.emailVerified) {
      setRouteReady(true);
    }
  }, [user, isLoading, segments, router]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack>
      {isLoading || !routeReady ? <AuthBootstrapSpinner /> : null}
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
          {/* Re-key on locale so every `t()` call re-evaluates when the language changes. */}
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
  bootstrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    elevation: 10000,
  },
});
