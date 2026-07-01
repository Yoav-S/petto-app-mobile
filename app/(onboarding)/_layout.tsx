import { Stack } from 'expo-router';

export default function PetOnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="name" />
      <Stack.Screen name="type" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="birth" />
    </Stack>
  );
}
