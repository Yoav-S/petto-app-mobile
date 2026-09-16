import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useSegments } from 'expo-router';
import {
  subscribeToForegroundReminderNotifications,
  subscribeToReminderNotificationResponses,
} from '@/services/notifications';
import { listReminders } from '@/services/reminders';
import { needsStatusPrompt } from '@/components/reminders/reminderFormShared';
import { useActivePet } from '@/store/petStore';
import { useReminderPrompt } from '@/context/ReminderPromptContext';
import type { Reminder } from '@/types/api';

function mergeReminderRows(today: Reminder[], recent: Reminder[]): Reminder[] {
  const byId = new Map<string, Reminder>();
  for (const row of [...today, ...recent]) byId.set(row.id, row);
  return Array.from(byId.values());
}

/**
 * Reminder fire or Reminder tap → Done/Missed sheet (full unanswered queue).
 * Alert tap after that fire → same sheet. Alert tap before the reminder → edit.
 * Alert banner arriving does not auto-open the sheet.
 */
export function useReminderNotificationRouting(enabled: boolean) {
  const segments = useSegments();
  const { activePetId } = useActivePet();
  const { present, presentFromPush, visible } = useReminderPrompt();
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const cacheRef = useRef<Reminder[]>([]);
  const scanningRef = useRef(false);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (!enabled) return;

    let unsubscribeTap: (() => void) | undefined;
    let unsubscribeForeground: (() => void) | undefined;
    let cancelled = false;

    void subscribeToReminderNotificationResponses((data) => {
      if (cancelled) return;
      void presentFromPush(data, 'tap');
    }).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribeTap = unsub;
    });

    void subscribeToForegroundReminderNotifications((data) => {
      if (cancelled) return;
      void presentFromPush(data, 'foreground');
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
  }, [enabled, presentFromPush]);

  useEffect(() => {
    if (!enabled || !activePetId) return;

    let cancelled = false;

    const onAuthedSurface = () => {
      const root = segmentsRef.current[0] as string | undefined;
      return root !== '(auth)' && root !== '(onboarding)';
    };

    const presentDue = (items: Reminder[], focusId?: string) => {
      if (cancelled || !onAuthedSurface()) return;
      const pending = items.filter(needsStatusPrompt);
      if (!pending.length && !focusId) return;
      present(focusId ? items : pending, focusId);
    };

    const refreshCache = async () => {
      if (cancelled || scanningRef.current || !onAuthedSurface()) return;
      scanningRef.current = true;
      try {
        const [today, recent] = await Promise.all([
          listReminders(activePetId, 'today', { limit: 50 }),
          listReminders(activePetId, 'recent', { limit: 50, collapse: false }),
        ]);
        if (cancelled) return;
        const items = mergeReminderRows(today, recent);
        cacheRef.current = items;
        presentDue(items);
      } catch {
        /* next tick / interval retries */
      } finally {
        scanningRef.current = false;
      }
    };

    const onLocalClock = () => {
      if (cancelled || !onAuthedSurface()) return;
      const due = cacheRef.current.filter(needsStatusPrompt);
      if (!due.length) return;
      present(due);
    };

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refreshCache();
    };

    void refreshCache();
    const clock = setInterval(onLocalClock, 1000);
    const poll = setInterval(() => {
      if (AppState.currentState === 'active') void refreshCache();
    }, 8000);
    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      cancelled = true;
      clearInterval(clock);
      clearInterval(poll);
      sub.remove();
    };
  }, [activePetId, enabled, present]);
}
