import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { ToastStack, type ToastItem } from '@/components/ui/BottomToast';
import { t } from '@/i18n';

const DEFAULT_DURATION_MS = 3500;
const UNDO_DURATION_MS = 5000;

export interface ShowToastOptions {
  message: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
  countdown?: boolean;
  countdownSeconds?: number;
  onTimeout?: () => void;
  aboveFab?: boolean;
}

export interface ShowUndoOptions {
  message: string;
  onUndo: () => void;
  onCommit: () => void | Promise<void>;
  aboveFab?: boolean;
  seconds?: number;
}

interface ToastContextValue {
  show: (options: ShowToastOptions) => void;
  showError: (message: string, options?: { aboveFab?: boolean }) => void;
  showUndo: (options: ShowUndoOptions) => void;
  hide: () => void;
}

type ToastKind = 'undo' | 'message';

interface ActiveToast extends ToastItem {
  kind: ToastKind;
}

interface ToastTimers {
  tick: ReturnType<typeof setInterval> | null;
  hide: ReturnType<typeof setTimeout> | null;
  onTimeout: (() => void) | null;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const timersRef = useRef(new Map<number, ToastTimers>());
  const tokenRef = useRef(0);

  const clearToastTimers = useCallback((id: number) => {
    const timers = timersRef.current.get(id);
    if (!timers) return;
    if (timers.tick) clearInterval(timers.tick);
    if (timers.hide) clearTimeout(timers.hide);
    timersRef.current.delete(id);
  }, []);

  const removeToast = useCallback(
    (id: number) => {
      clearToastTimers(id);
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    },
    [clearToastTimers],
  );

  /** Drop a toast without running its timeout (undo tap, or a message replace). */
  const dismissToast = useCallback(
    (id: number) => {
      const timers = timersRef.current.get(id);
      if (timers) timers.onTimeout = null;
      removeToast(id);
    },
    [removeToast],
  );

  const hide = useCallback(() => {
    for (const id of [...timersRef.current.keys()]) {
      const timers = timersRef.current.get(id);
      if (timers?.onTimeout) {
        const commit = timers.onTimeout;
        timers.onTimeout = null;
        clearToastTimers(id);
        void commit();
      } else {
        dismissToast(id);
      }
    }
    setToasts([]);
  }, [clearToastTimers, dismissToast]);

  const show = useCallback(
    (options: ShowToastOptions) => {
      tokenRef.current += 1;
      const id = tokenRef.current;
      const seconds = options.countdown
        ? Math.max(1, options.countdownSeconds ?? 5)
        : null;
      const kind: ToastKind = options.countdown ? 'undo' : 'message';

      const onAction = options.onAction
        ? () => {
            dismissToast(id);
            options.onAction?.();
          }
        : undefined;

      const nextToast: ActiveToast = {
        id,
        kind,
        message: options.message,
        actionText: options.actionText,
        onAction,
        aboveFab: Boolean(options.aboveFab),
        countdownSec: seconds,
      };

      setToasts((prev) => {
        const kept =
          kind === 'message'
            ? prev.filter((toast) => {
                if (toast.kind !== 'message') return true;
                const existing = timersRef.current.get(toast.id);
                if (existing) {
                  existing.onTimeout = null;
                  if (existing.tick) clearInterval(existing.tick);
                  if (existing.hide) clearTimeout(existing.hide);
                  timersRef.current.delete(toast.id);
                }
                return false;
              })
            : prev;
        return [...kept, nextToast];
      });

      const timers: ToastTimers = {
        tick: null,
        hide: null,
        onTimeout: options.onTimeout ?? null,
      };
      timersRef.current.set(id, timers);

      if (seconds != null) {
        let remaining = seconds;
        timers.tick = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            const commit = timers.onTimeout;
            timers.onTimeout = null;
            removeToast(id);
            void commit?.();
            return;
          }
          setToasts((prev) =>
            prev.map((toast) =>
              toast.id === id ? { ...toast, countdownSec: remaining } : toast,
            ),
          );
        }, 1000);
      } else {
        const duration = options.duration ?? DEFAULT_DURATION_MS;
        timers.hide = setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [dismissToast, removeToast],
  );

  const showError = useCallback(
    (message: string, options?: { aboveFab?: boolean }) => {
      show({
        message: message.trim() || t('common.error'),
        duration: 4500,
        aboveFab: options?.aboveFab,
      });
    },
    [show],
  );

  const showUndo = useCallback(
    (options: ShowUndoOptions) => {
      const seconds = options.seconds ?? Math.round(UNDO_DURATION_MS / 1000);
      show({
        message: options.message,
        actionText: t('common.undo'),
        onAction: options.onUndo,
        countdown: true,
        countdownSeconds: seconds,
        onTimeout: () => {
          void options.onCommit();
        },
        aboveFab: options.aboveFab,
      });
    },
    [show],
  );

  useEffect(
    () => () => {
      for (const [id, timers] of timersRef.current.entries()) {
        if (timers.tick) clearInterval(timers.tick);
        if (timers.hide) clearTimeout(timers.hide);
        const commit = timers.onTimeout;
        timers.onTimeout = null;
        timersRef.current.delete(id);
        void commit?.();
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ show, showError, showUndo, hide }),
    [show, showError, showUndo, hide],
  );

  const stackItems: ToastItem[] = toasts.map(
    ({ id, message, countdownSec, actionText, onAction, aboveFab }) => ({
      id,
      message,
      countdownSec,
      actionText,
      onAction,
      aboveFab,
    }),
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.host} pointerEvents="box-none">
        {children}
        <ToastStack toasts={stackItems} />
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
