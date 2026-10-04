import type { OnboardingStep } from '@/types/api';

export const ONBOARDING_STEPS = ['name', 'type', 'photo', 'birth'] as const;

export function onboardingHref(step: OnboardingStep | null | undefined): string {
  if (step === 'type' || step === 'photo' || step === 'birth') {
    return `/(onboarding)/${step}`;
  }
  return '/(onboarding)/name';
}

export function previousOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  if (index <= 0) return null;
  return ONBOARDING_STEPS[index - 1];
}

/** Back through the setup stack. A cold resume has no history, so replace the previous step. */
export function goToPreviousOnboardingStep(
  router: { canGoBack: () => boolean; back: () => void; replace: (href: never) => void },
  step: OnboardingStep,
): void {
  const previous = previousOnboardingStep(step);
  if (!previous) return;
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(onboardingHref(previous) as never);
}
