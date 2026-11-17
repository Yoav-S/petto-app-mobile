import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { CREATE_SCREEN_OPTIONS, SIDE_ANIMATION } from '@/constants/screenAnimations';

export default function VaccinesLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: SIDE_ANIMATION,
      }}
    >
      <Stack.Screen name="add" options={CREATE_SCREEN_OPTIONS} />
    </Stack>
  );
}
