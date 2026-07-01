import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'petto_onboarding_complete';
const TERMS_KEY = 'petto_terms_accepted_v2';
const TERMS_KEY_LEGACY = 'petto_terms_accepted';

let welcomeContinueUnlocked = false;

/** Set when the user taps Continue on the terms screen (this session). */
export function unlockWelcomeContinue(): void {
  welcomeContinueUnlocked = true;
}

export function isWelcomeContinueUnlocked(): boolean {
  return welcomeContinueUnlocked;
}

export function resetWelcomeContinueUnlock(): void {
  welcomeContinueUnlocked = false;
}

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function getTermsAccepted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TERMS_KEY);
  return value === 'true';
}

export async function setTermsAccepted(): Promise<void> {
  await AsyncStorage.setItem(TERMS_KEY, 'true');
}

export async function clearTermsAccepted(): Promise<void> {
  resetWelcomeContinueUnlock();
  await AsyncStorage.multiRemove([TERMS_KEY, TERMS_KEY_LEGACY]);
}

export async function clearOnboardingComplete(): Promise<void> {
  resetWelcomeContinueUnlock();
  await AsyncStorage.multiRemove([ONBOARDING_KEY, TERMS_KEY, TERMS_KEY_LEGACY]);
}
