import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SIDE_ANIMATION } from '@/constants/screenAnimations';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: SIDE_ANIMATION,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="email" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="your-name" />
    </Stack>
  );
}
