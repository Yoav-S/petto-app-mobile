import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  subscribeToReminderNotificationResponses,
  type ReminderPushData,
} from '@/services/notifications';
import { listReminders } from '@/services/reminders';
import { listPets } from '@/services/pets';
import { needsStatusPrompt } from '@/components/reminders/reminderFormShared';
import { useActivePet } from '@/store/petStore';
import { presentUpgradeLimit } from '@/services/upgradeLimit';

/**
 * Routes reminder push taps into /reminders and, on cold/warm app open,
 * sends the user there when unanswered notified reminders are waiting.
 */
export function useReminderNotificationRouting(enabled: boolean) {
  const router = useRouter();
  const segments = useSegments();
  const { activePetId, setActivePetId } = useActivePet();
  const handlingRef = useRef(false);
  const launchedPromptRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const openFromPush = async (data: ReminderPushData) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      try {
        launchedPromptRef.current = true;
        if (data.petId) {
          try {
            const pets = await listPets();
            const target = pets.find((p) => p.id === data.petId);
            if (target?.locked) {
              presentUpgradeLimit('pet_switch');
              return;
            }
          } catch {
            // If we cannot confirm access, do not switch onto a possibly locked pet.
            return;
          }
          await setActivePetId(data.petId);
        }
        const focus = data.reminderId ? `&focusId=${encodeURIComponent(data.reminderId)}` : '';
        router.push(`/reminders?prompt=1${focus}` as never);
      } finally {
        setTimeout(() => {
          handlingRef.current = false;
        }, 800);
      }
    };

    void subscribeToReminderNotificationResponses((data) => {
      if (cancelled) return;
      void openFromPush(data);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled, router, setActivePetId]);

  useEffect(() => {
    if (!enabled || !activePetId || launchedPromptRef.current) return;

    const root = segments[0] as string | undefined;
    if (root === '(auth)' || root === '(onboarding)') return;
    if (segments.some((s) => s === 'reminders')) return;

    let cancelled = false;

    const checkPending = async () => {
      if (launchedPromptRef.current || cancelled) return;
      try {
        const [today, recent] = await Promise.all([
          listReminders(activePetId, 'today'),
          listReminders(activePetId, 'recent'),
        ]);
        if (cancelled || launchedPromptRef.current) return;
        const pending = [...today, ...recent].some(needsStatusPrompt);
        if (!pending) return;
        launchedPromptRef.current = true;
        router.push('/reminders?prompt=1' as never);
      } catch {
        /* ignore — reminders screen will retry on focus */
      }
    };

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void checkPending();
    };

    void checkPending();
    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [activePetId, enabled, router, segments]);
}
