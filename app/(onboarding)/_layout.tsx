import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SIDE_ANIMATION } from '@/constants/screenAnimations';

export default function PetOnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: SIDE_ANIMATION,
      }}
    >
      <Stack.Screen name="type" />
      <Stack.Screen name="name" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="birth" />
    </Stack>
  );
}
