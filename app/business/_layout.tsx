import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';

export default function BusinessLayout() {
  useLocale();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right',
        animationTypeForReplace: 'push',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="[id]/index"
        dangerouslySingular={(_name, params) =>
          `${params.id ?? ''}:${params.locationId ?? ''}`
        }
      />
    </Stack>
  );
}
