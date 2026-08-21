import { Stack } from 'expo-router';
import { useThemedStatusBar } from '@/context/SystemBarsContext';

/**
 * Settings stack sits on the themed app background — force theme-matched
 * status bar icons while any settings screen is focused (fixes light-mode
 * white icons left over from the home cover photo).
 */
export default function SettingsLayout() {
  useThemedStatusBar();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="language" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="help" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}
