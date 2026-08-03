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
 * Serialize Modal teardown → next Modal present.
 * Opening a sheet while another is still dismissing stacks Modals and freezes iOS
 * (date picker, gallery sheets, reminder sub-sheets, etc.).
 */
let closeChain: Promise<void> = Promise.resolve();

function enqueueClose(): () => void {
  let resolved = false;
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  closeChain = closeChain.then(() => promise);
  return () => {
    if (resolved) return;
    resolved = true;
    resolve();
  };
}

async function waitForCloseChain(): Promise<void> {
  await closeChain;
  if (BOTTOM_SHEET_IOS_GAP_MS > 0) {
    await new Promise((r) => setTimeout(r, BOTTOM_SHEET_IOS_GAP_MS));
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
  const progress = useSharedValue(0);
  const finishCloseRef = useRef<(() => void) | null>(null);

  const markUnmounted = () => {
    mountedRef.current = false;
    setMounted(false);
  };

  useEffect(() => {
    let cancelled = false;

    if (visible) {
      void (async () => {
        await waitForCloseChain();
        if (cancelled) return;
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
      return;
    }

    const finishClose = enqueueClose();
    finishCloseRef.current = finishClose;

    const completeClose = () => {
      markUnmounted();
      finishClose();
      if (finishCloseRef.current === finishClose) {
        finishCloseRef.current = null;
      }
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
      // Interrupted (next sheet opening / unmount): release the gate immediately.
      progress.value = 0;
      markUnmounted();
      finishClose();
      if (finishCloseRef.current === finishClose) {
        finishCloseRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, progress]);

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
