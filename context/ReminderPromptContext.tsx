import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import ReminderActionSheet from '@/components/reminders/ReminderActionSheet';
import {
  buildPromptQueue,
  reminderAlreadyAnswered,
  reminderHasFired,
  shouldPromptFromPush,
} from '@/components/reminders/reminderFormShared';
import {
  getReminder,
  listReminders,
  updateReminderStatus,
} from '@/services/reminders';
import { listPets } from '@/services/pets';
import { invalidateReminders } from '@/services/queryClient';
import { presentUpgradeLimit } from '@/services/upgradeLimit';
import { useActivePet } from '@/store/petStore';
import type { ReminderPushData } from '@/services/notifications';
import type { Reminder } from '@/types/api';
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from '@/utils/calendar';
import {
  REMINDER_CATEGORIES,
  resolveReminderCategory,
  type ReminderCategory,
} from '@/utils/reminderCategory';
import { t } from '@/i18n';

function categoryOf(reminder: Reminder): ReminderCategory {
  if (reminder.category && (REMINDER_CATEGORIES as string[]).includes(reminder.category)) {
    return reminder.category as ReminderCategory;
  }
  return resolveReminderCategory(reminder.title);
}

type ReminderPromptContextValue = {
  visible: boolean;
  present: (items: Reminder[], focusId?: string | null) => void;
  presentFromPush: (
    data: ReminderPushData,
    source: 'tap' | 'foreground',
  ) => Promise<void>;
};

const ReminderPromptContext = createContext<ReminderPromptContextValue | null>(null);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function relativeDate(date: string): string {
  const today = todayIsoDate();
  if (date === today) return t('common.today');
  if (date === addDaysToIsoDate(today, -1)) return t('common.yesterday');
  if (date === addDaysToIsoDate(today, 1)) return t('common.tomorrow');
  return formatDisplayDate(date);
}

export function ReminderPromptProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { activePetId, setActivePetId } = useActivePet();
  const [queue, setQueue] = useState<Reminder[]>([]);
  const [total, setTotal] = useState(0);
  const answeredIdsRef = useRef(new Set<string>());
  const queueRef = useRef<Reminder[]>([]);
  queueRef.current = queue;

  const present = useCallback((items: Reminder[], focusId?: string | null) => {
    const next = buildPromptQueue(items, focusId, answeredIdsRef.current, Boolean(focusId));
    // Never let an empty rebuild close a sheet that is already on screen.
    // Reminders-tab refetch often misses the row for a few hundred ms.
    if (next.length === 0) return;
    setQueue(next);
    setTotal(next.length);
  }, []);

  const goRecent = useCallback(
    (prompt: boolean, data?: ReminderPushData) => {
      const n = String(Date.now());
      const onList =
        (segments as string[]).includes('reminders') &&
        (segments as string[])[(segments as string[]).indexOf('reminders') + 1] == null;
      if (onList) {
        router.setParams({
          prompt: prompt ? '1' : '0',
          tab: 'Recent',
          focusId: prompt ? data?.reminderId : undefined,
          petId: prompt ? data?.petId : undefined,
          n,
        } as never);
        return;
      }
      if (prompt && data) {
        const focus = data.reminderId
          ? `&focusId=${encodeURIComponent(data.reminderId)}`
          : '';
        const pet = data.petId ? `&petId=${encodeURIComponent(data.petId)}` : '';
        router.push(`/reminders?prompt=1&tab=Recent${focus}${pet}&n=${n}` as never);
        return;
      }
      router.push(`/reminders?prompt=0&tab=Recent&n=${n}` as never);
    },
    [router, segments],
  );

  const presentFromPush = useCallback(
    async (data: ReminderPushData, source: 'tap' | 'foreground') => {
      if (source === 'foreground' && data.kind === 'alert') return;

      const petId = data.petId;
      const reminderId = data.reminderId;

      if (petId) {
        try {
          const pets = await listPets();
          const target = pets.find((p) => p.id === petId);
          if (target?.locked) {
            presentUpgradeLimit('pet_switch');
            return;
          }
          await setActivePetId(petId);
        } catch {
          return;
        }
      }

      const resolvedPetId = petId || activePetId;
      let focused: Reminder | null = null;

      if (reminderId && resolvedPetId) {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          try {
            focused = await getReminder(resolvedPetId, reminderId);
          } catch {
            focused = null;
          }
          if (focused && reminderAlreadyAnswered(focused)) {
            goRecent(false);
            return;
          }
          if (
            focused &&
            (reminderHasFired(focused) ||
              shouldPromptFromPush(focused) ||
              data.kind !== 'alert')
          ) {
            break;
          }
          if (data.kind === 'alert' && focused && !reminderHasFired(focused)) {
            break;
          }
          await sleep(400);
        }

        if (data.kind === 'alert' && focused && !reminderHasFired(focused)) {
          if (!reminderAlreadyAnswered(focused)) {
            router.push(`/reminders/${reminderId}` as never);
          }
          return;
        }

        if (focused) present([focused], reminderId);
      }

      const items: Reminder[] = [];
      if (resolvedPetId) {
        try {
          const [today, recent] = await Promise.all([
            listReminders(resolvedPetId, 'today', { limit: 50 }),
            listReminders(resolvedPetId, 'recent', { limit: 50, collapse: false }),
          ]);
          items.push(...today, ...recent);
        } catch {
          /* still try the focused row */
        }
      }
      if (focused) {
        const idx = items.findIndex((row) => row.id === focused.id);
        if (idx >= 0) items[idx] = focused;
        else items.unshift(focused);
      }

      present(items, reminderId);
      // Foreground: keep the user on the current screen and only jump the sheet.
      // Tap: open Recent so leftover tray banners land on the history tab.
      if (source === 'tap') goRecent(true, data);
    },
    [activePetId, goRecent, present, router, setActivePetId],
  );

  const close = useCallback(() => {
    const remaining = queueRef.current;
    setQueue([]);
    setTotal(0);
    const petId = remaining[0]?.pet_id || activePetId;
    if (!petId) return;
    for (const item of remaining) {
      if (answeredIdsRef.current.has(item.id) || reminderAlreadyAnswered(item)) continue;
      answeredIdsRef.current.add(item.id);
      void updateReminderStatus(petId, item.id, 'missed');
    }
    invalidateReminders(petId);
  }, [activePetId]);

  const mark = useCallback(
    async (status: 'completed' | 'missed') => {
      const current = queueRef.current[0];
      if (!current) return;
      const petId = current.pet_id || activePetId;
      answeredIdsRef.current.add(current.id);
      if (petId) {
        try {
          await updateReminderStatus(petId, current.id, status);
        } catch {
          /* keep advancing so the user is not stuck */
        }
        invalidateReminders(petId);
      }
      setQueue((prev) => {
        const next = prev.slice(1);
        if (next.length === 0) setTotal(0);
        return next;
      });
    },
    [activePetId],
  );

  const selected = queue[0] ?? null;
  const promptPosition = total > 1 ? total - queue.length + 1 : undefined;

  const value = useMemo(
    () => ({
      visible: selected != null,
      present,
      presentFromPush,
    }),
    [present, presentFromPush, selected],
  );

  return (
    <ReminderPromptContext.Provider value={value}>
      {children}
      <ReminderActionSheet
        visible={selected != null}
        title={selected?.title}
        subtitle={selected?.note ?? undefined}
        category={selected ? categoryOf(selected) : undefined}
        time={selected?.time}
        dateLabel={selected ? relativeDate(selected.date) : undefined}
        currentIndex={promptPosition}
        totalCount={total > 1 ? total : undefined}
        onClose={close}
        onDone={() => {
          void mark('completed');
        }}
        onMissed={() => {
          void mark('missed');
        }}
      />
    </ReminderPromptContext.Provider>
  );
}

export function useReminderPrompt() {
  const ctx = useContext(ReminderPromptContext);
  if (!ctx) {
    throw new Error('useReminderPrompt must be used within ReminderPromptProvider');
  }
  return ctx;
}
