import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  subscribeToForegroundReminderNotifications,
  subscribeToReminderNotificationResponses,
  type ReminderPushData,
} from '@/services/notifications';
import { getReminder, listReminders } from '@/services/reminders';
import { listPets } from '@/services/pets';
import {
  needsStatusPrompt,
  reminderAlreadyAnswered,
  reminderHasFired,
  shouldPromptFromPush,
} from '@/components/reminders/reminderFormShared';
import { useActivePet } from '@/store/petStore';
import { presentUpgradeLimit } from '@/services/upgradeLimit';

function firedListHref(data: ReminderPushData): string {
  const focus = data.reminderId ? `&focusId=${encodeURIComponent(data.reminderId)}` : '';
  const pet = data.petId ? `&petId=${encodeURIComponent(data.petId)}` : '';
  return `/reminders?prompt=1&tab=Recent${focus}${pet}&n=${Date.now()}`;
}

function recentListHref(): string {
  return `/reminders?prompt=0&tab=Recent&n=${Date.now()}`;
}

/**
 * Alert tap before fire → edit screen.
 * Alert or reminder tap after fire → Recent list + Done/Missed queue of every
 * unanswered fired occurrence (not only the tapped id).
 * Foreground main fire → same Recent queue. Alert receive never opens the sheet.
 * Already answered → Recent with no sheet, even from leftover tray banners.
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

    const onRemindersList = () => {
      const segs = segmentsRef.current as string[];
      const idx = segs.indexOf('reminders');
      if (idx < 0) return false;
      return segs[idx + 1] == null;
    };

    const switchPetIfNeeded = async (petId?: string) => {
      if (!petId) return;
      const pets = await listPets();
      const target = pets.find((p) => p.id === petId);
      if (target?.locked) {
        presentUpgradeLimit('pet_switch');
        throw new Error('locked');
      }
      await setActivePetId(petId);
    };

    const goRecentNoPrompt = () => {
      if (onRemindersList()) {
        router.setParams({
          prompt: '0',
          tab: 'Recent',
          focusId: undefined,
          petId: undefined,
          n: String(Date.now()),
        } as never);
        return;
      }
      router.push(recentListHref() as never);
    };

    const openFiredQueue = (data: ReminderPushData) => {
      launchedPromptRef.current = true;
      const href = firedListHref(data);
      if (onRemindersList()) {
        router.setParams({
          prompt: '1',
          tab: 'Recent',
          focusId: data.reminderId,
          petId: data.petId,
          n: String(Date.now()),
        } as never);
      } else {
        router.push(href as never);
      }
    };

    const openFromPush = async (data: ReminderPushData, fromForeground = false) => {
      // Foreground *receive* of the alert banner must not steal the UI.
      // A *tap* on that same alert after the reminder fired must open the sheet.
      if (fromForeground && data.kind === 'alert') return;

      try {
        await switchPetIfNeeded(data.petId);
      } catch {
        return;
      }

      const petId = data.petId;
      const reminderId = data.reminderId;

      if (reminderId && petId) {
        try {
          const reminder = await getReminder(petId, reminderId);
          if (reminderAlreadyAnswered(reminder)) {
            goRecentNoPrompt();
            return;
          }
          const fired = reminderHasFired(reminder) || shouldPromptFromPush(reminder);
          if (data.kind === 'alert' && !fired) {
            router.push(`/reminders/${reminderId}` as never);
            return;
          }
        } catch {
          // Tap must still open the queue if the reminder already fired.
        }
      }

      openFiredQueue(data);
    };

    void subscribeToReminderNotificationResponses((data) => {
      if (cancelled) return;
      void openFromPush(data, false);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeTap = unsub;
    });

    void subscribeToForegroundReminderNotifications((data) => {
      if (cancelled) return;
      void openFromPush(data, true);
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
          listReminders(activePetId, 'recent', { collapse: false }),
        ]);
        if (cancelled || launchedPromptRef.current) return;
        const pending = [...today, ...recent].some(needsStatusPrompt);
        if (!pending) return;
        launchedPromptRef.current = true;
        router.push('/reminders?prompt=1&tab=Recent' as never);
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
