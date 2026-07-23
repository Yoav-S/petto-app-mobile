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
import BottomToast from '@/components/ui/BottomToast';
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

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastState {
  message: string;
  actionText?: string;
  onAction?: () => void;
  aboveFab: boolean;
  countdownSec: number | null;
  token: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef<(() => void) | null>(null);
  const tokenRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimers();
    onTimeoutRef.current = null;
    setToast(null);
  }, [clearTimers]);

  const show = useCallback(
    (options: ShowToastOptions) => {
      clearTimers();
      tokenRef.current += 1;
      const token = tokenRef.current;

      const seconds = options.countdown
        ? Math.max(1, options.countdownSeconds ?? 5)
        : null;

      onTimeoutRef.current = options.onTimeout ?? null;

      setToast({
        message: options.message,
        actionText: options.actionText,
        onAction: options.onAction
          ? () => {
              const action = options.onAction;
              hide();
              action?.();
            }
          : undefined,
        aboveFab: Boolean(options.aboveFab),
        countdownSec: seconds,
        token,
      });

      if (seconds != null) {
        let remaining = seconds;
        tickTimerRef.current = setInterval(() => {
          remaining -= 1;
          if (tokenRef.current !== token) return;
          if (remaining <= 0) {
            clearTimers();
            const commit = onTimeoutRef.current;
            onTimeoutRef.current = null;
            setToast(null);
            void commit?.();
            return;
          }
          setToast((prev) =>
            prev && prev.token === token ? { ...prev, countdownSec: remaining } : prev,
          );
        }, 1000);
      } else {
        const duration = options.duration ?? DEFAULT_DURATION_MS;
        hideTimerRef.current = setTimeout(() => {
          if (tokenRef.current !== token) return;
          setToast(null);
        }, duration);
      }
    },
    [clearTimers, hide],
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

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo(
    () => ({ show, showError, showUndo, hide }),
    [show, showError, showUndo, hide],
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.host} pointerEvents="box-none">
        {children}
        <BottomToast
          visible={toast != null}
          message={toast?.message ?? ''}
          countdownSec={toast?.countdownSec}
          actionText={toast?.actionText}
          onAction={toast?.onAction}
          aboveFab={toast?.aboveFab ?? false}
        />
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
