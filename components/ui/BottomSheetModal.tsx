import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

export const BOTTOM_SHEET_OPEN_MS = 280;
export const BOTTOM_SHEET_CLOSE_MS = 220;
/** Extra settle after close before another RN Modal may present (iOS). */
export const BOTTOM_SHEET_IOS_GAP_MS = Platform.OS === 'ios' ? 120 : 0;

/**
 * A native iOS Modal must fully dismiss before another one presents.
 * Keep ownership until the close animation has completed, regardless of React
 * sibling effect order. This covers every BottomSheetModal in the app.
 */
type SheetWaiter = {
  id: symbol;
  resolve: () => void;
};

let activeSheetId: symbol | null = null;
let sheetGapPending = false;
const sheetWaiters: SheetWaiter[] = [];
const idleResolvers: (() => void)[] = [];

function resolveIdleWaiters() {
  if (activeSheetId !== null || sheetGapPending || sheetWaiters.length > 0) return;
  idleResolvers.splice(0).forEach((resolve) => resolve());
}

/** Wait until no app bottom-sheet Modal is mounted or dismissing. */
export function waitForBottomSheetsToSettle(): Promise<void> {
  if (activeSheetId === null && !sheetGapPending && sheetWaiters.length === 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    idleResolvers.push(resolve);
  });
}

/**
 * Present a raw RN Modal only after every bottom sheet has dismissed.
 * Confirm dialogs, photo viewers, and success overlays must use this on iOS.
 */
export function useSettledModalVisible(requested: boolean): boolean {
  const [presented, setPresented] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!requested) {
      setPresented(false);
      return;
    }
    void waitForBottomSheetsToSettle().then(() => {
      if (!cancelled) setPresented(true);
    });
    return () => {
      cancelled = true;
    };
  }, [requested]);

  return presented;
}

function acquireSheet(id: symbol): Promise<void> {
  if ((activeSheetId === null && !sheetGapPending) || activeSheetId === id) {
    activeSheetId = id;
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    if (!sheetWaiters.some((waiter) => waiter.id === id)) {
      sheetWaiters.push({ id, resolve });
    }
  });
}

function cancelWaitingSheet(id: symbol) {
  const index = sheetWaiters.findIndex((waiter) => waiter.id === id);
  if (index >= 0) {
    const [waiter] = sheetWaiters.splice(index, 1);
    waiter.resolve();
  }
}

function releaseSheet(id: symbol) {
  cancelWaitingSheet(id);
  if (activeSheetId !== id) return;
  activeSheetId = null;

  const grantNext = () => {
    sheetGapPending = false;
    const next = sheetWaiters.shift();
    if (!next) {
      resolveIdleWaiters();
      return;
    }
    activeSheetId = next.id;
    next.resolve();
  };

  if (BOTTOM_SHEET_IOS_GAP_MS > 0) {
    sheetGapPending = true;
    setTimeout(grantNext, BOTTOM_SHEET_IOS_GAP_MS);
  } else {
    grantNext();
  }
}

const SHEET_OFFSET = 420;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bottom sheet host: backdrop fades in place; sheet slides up.
 * Open/close is gated so only one sheet Modal presents at a time on iOS.
 */
export default function BottomSheetModal({
  visible,
  onClose,
  children,
}: BottomSheetModalProps) {
  const styles = useThemedStyles(makeStyles);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  const sheetIdRef = useRef(Symbol('bottom-sheet'));
  const progress = useSharedValue(0);

  const markUnmounted = () => {
    mountedRef.current = false;
    setMounted(false);
  };

  useEffect(() => {
    let cancelled = false;

    if (visible) {
      void (async () => {
        await acquireSheet(sheetIdRef.current);
        if (cancelled) {
          releaseSheet(sheetIdRef.current);
          return;
        }
        mountedRef.current = true;
        setMounted(true);
        progress.value = withTiming(1, {
          duration: BOTTOM_SHEET_OPEN_MS,
          easing: Easing.out(Easing.cubic),
        });
      })();

      return () => {
        cancelled = true;
      };
    }

    // visible === false
    if (!mountedRef.current) {
      cancelWaitingSheet(sheetIdRef.current);
      return;
    }

    const completeClose = () => {
      markUnmounted();
      releaseSheet(sheetIdRef.current);
    };

    progress.value = withTiming(
      0,
      {
        duration: BOTTOM_SHEET_CLOSE_MS,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(completeClose)();
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [visible, progress]);

  useEffect(
    () => () => {
      cancelWaitingSheet(sheetIdRef.current);
      if (mountedRef.current) {
        mountedRef.current = false;
        releaseSheet(sheetIdRef.current);
      }
    },
    [],
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * SHEET_OFFSET }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.root} pointerEvents="box-none">
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheetHost, sheetStyle]} pointerEvents="box-none">
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheetHost: {
      width: '100%',
    },
  });
