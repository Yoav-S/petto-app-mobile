import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  subscribeToForegroundReminderNotifications,
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
  const launchedPromptRef = useRef(false);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (!enabled) return;

    let unsubscribeTap: (() => void) | undefined;
    let unsubscribeForeground: (() => void) | undefined;
    let cancelled = false;

    const openFromPush = async (data: ReminderPushData) => {
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
          return;
        }
        await setActivePetId(data.petId);
      }
      const focus = data.reminderId ? `&focusId=${encodeURIComponent(data.reminderId)}` : '';
      const pet = data.petId ? `&petId=${encodeURIComponent(data.petId)}` : '';
      // Unique `n` so tapping the alert or the reminder while already on
      // /reminders still re-opens the Done/Missed sheet.
      const href = `/reminders?prompt=1${focus}${pet}&n=${Date.now()}`;
      const onReminders = segmentsRef.current.some((s) => s === 'reminders');
      if (onReminders) {
        router.setParams({
          prompt: '1',
          focusId: data.reminderId,
          petId: data.petId,
          n: String(Date.now()),
        } as never);
      } else {
        router.push(href as never);
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
      unsubscribeTap = unsub;
    });

    void subscribeToForegroundReminderNotifications((data) => {
      if (cancelled) return;
      void openFromPush(data);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeForeground = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribeTap?.();
      unsubscribeForeground?.();
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
